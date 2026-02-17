import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import https from 'https';
import http from 'http';
import crypto from 'crypto';
import multer from 'multer';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || '3dprintables_secret_key';

// Use a file-based database for persistence
// In production (Cloud Run), DB_PATH points to the GCS FUSE mount
const dbPath = process.env.DB_PATH || join(__dirname, '3dprintables.db');
const db = new Database(dbPath);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Uploads directory for message attachments (persistent on GCS FUSE mount)
const uploadsDir = process.env.DB_PATH ? join(dirname(process.env.DB_PATH), 'uploads') : join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Multer config for image uploads
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadsDir),
        filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`)
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        cb(null, allowed.includes(file.mimetype));
    }
});

// Helper: fetch an image URL and return a Buffer
function fetchImageBuffer(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
            // Follow redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchImageBuffer(res.headers.location).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`Failed to fetch image: ${res.statusCode}`));
            }
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT,
    credits REAL DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    category TEXT,
    image TEXT,
    image_prompt TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    customer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    shipping_address TEXT,
    billing_address TEXT,
    total REAL NOT NULL,
    status TEXT DEFAULT 'quote_request',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    image TEXT,
    FOREIGN KEY(order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS blueprints (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT,
    image TEXT,
    image_prompt TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT DEFAULT 'New Design Chat',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    image TEXT,
    product_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES chat_sessions(id)
  );

  CREATE TABLE IF NOT EXISTS order_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    sender TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Migration: Add credits column if it doesn't exist
try {
    db.prepare('ALTER TABLE users ADD COLUMN credits REAL DEFAULT 10').run();
} catch (e) {
    // Column already exists
}

// Migration: Add chat_session_id to orders table
try {
    db.prepare('ALTER TABLE orders ADD COLUMN chat_session_id TEXT').run();
} catch (e) {
    // Column already exists
}

// Migration: Convert existing 'pending' status to 'quote_request'
try {
    db.prepare("UPDATE orders SET status = 'quote_request' WHERE status = 'pending'").run();
} catch (e) {
    // Migration already applied or no rows to update
}

// Migration: Add role column to users table
try {
    db.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'").run();
} catch (e) {
    // Column already exists
}

// Migration: Add image_url column to order_messages table
try {
    db.prepare("ALTER TABLE order_messages ADD COLUMN image_url TEXT").run();
} catch (e) {
    // Column already exists
}

// Migration: Add admin_last_read column to orders table (for message center unread tracking)
try {
    db.prepare("ALTER TABLE orders ADD COLUMN admin_last_read DATETIME").run();
} catch (e) {
    // Column already exists
}

// Seed: Set ab@abmodi.ai as admin
try {
    db.prepare("UPDATE users SET role = 'admin' WHERE email = 'ab@abmodi.ai'").run();
} catch (e) {
    // No-op if user doesn't exist yet
}

// Seed: Set arav@abmodi.ai as admin
try {
    db.prepare("UPDATE users SET role = 'admin' WHERE email = 'arav@abmodi.ai'").run();
} catch (e) {
    // No-op if user doesn't exist yet
}

// Auth middleware: verify JWT and attach user to req
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// Admin middleware: check that authenticated user has admin role
const requireAdmin = (req, res, next) => {
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user.id);
    if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Auth Endpoints
app.post('/api/auth/register', async (req, res) => {
    const { email, password, fullName } = req.body;
    const id = `user_${Date.now()}`;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const insert = db.prepare(`
      INSERT INTO users(id, email, password, full_name)
      VALUES(?, ?, ?, ?)
    `);
        insert.run(id, email, hashedPassword, fullName);

        const token = jwt.sign({ id, email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id, email, fullName, credits: 10, role: 'user' } });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            res.status(400).json({ error: 'Email already exists' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) return res.status(400).json({ error: 'User not found' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ error: 'Invalid password' });

        // Auto-promote admin emails on login (in case seed ran before registration)
        const adminEmails = ['ab@abmodi.ai', 'arav@abmodi.ai'];
        if (adminEmails.includes(user.email) && user.role !== 'admin') {
            db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(user.id);
            user.role = 'admin';
        }

        const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders WHERE user_id = ?').get(user.id).count;

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, email: user.email, fullName: user.full_name, credits: user.credits, orderCount, role: user.role || 'user' } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verify token and return current user data (used for admin verification)
app.get('/api/auth/me', authenticateToken, (req, res) => {
    try {
        const user = db.prepare('SELECT id, email, full_name, credits, role FROM users WHERE id = ?').get(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            credits: user.credits,
            role: user.role || 'user'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Forgot Password — generate reset token and send email
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    const genericResponse = { message: 'If an account with that email exists, we have sent a password reset link.' };

    if (!email || !email.includes('@')) {
        return res.json(genericResponse);
    }

    try {
        const user = db.prepare('SELECT id, email, full_name FROM users WHERE email = ?').get(email);

        if (!user) {
            return res.json(genericResponse);
        }

        // Invalidate any existing unused reset tokens for this user
        db.prepare('UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0').run(user.id);

        // Generate a secure random token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Store the SHA-256 hash of the token (not plaintext)
        const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Token expires in 1 hour
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        db.prepare('INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)').run(user.id, tokenHash, expiresAt);

        // Build the reset URL
        const baseUrl = process.env.APP_URL || 'https://3dprintables.ai';
        const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

        // Send reset email via Resend
        if (process.env.RESEND_API_KEY) {
            try {
                await resend.emails.send({
                    from: '3DPrintables.ai <hello@3dprintables.ai>',
                    to: [user.email],
                    subject: 'Reset Your Password — 3DPrintables.ai',
                    html: `
                        <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 16px; background: #ffffff; color: #111827;">
                            <div style="text-align: center; margin-bottom: 24px;">
                                <h1 style="color: #7c3aed; font-size: 24px; margin: 0;">3DPrintables.ai</h1>
                                <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Password Reset Request</p>
                            </div>
                            <div style="margin: 0 0 24px 0; padding: 20px; background: #faf5ff; border-radius: 12px; border: 1px solid #e9d5ff;">
                                <p style="color: #374151; margin: 0; font-size: 15px;">Hi <strong>${user.full_name || 'there'}</strong>,</p>
                                <p style="color: #374151; margin: 12px 0 0 0; font-size: 15px;">We received a request to reset your password. Click the button below to choose a new password.</p>
                            </div>
                            <div style="text-align: center; margin: 0 0 24px 0;">
                                <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #7c3aed, #6366f1); color: #ffffff; text-decoration: none; border-radius: 9999px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">Reset Password</a>
                            </div>
                            <div style="margin: 0 0 24px 0; padding: 16px 20px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
                                <p style="color: #6b7280; font-size: 13px; margin: 0;">This link will expire in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.</p>
                            </div>
                            <p style="color: #9ca3af; font-size: 11px; margin-top: 16px; text-align: center;">If the button doesn't work, copy and paste this URL into your browser:</p>
                            <p style="color: #7c3aed; font-size: 11px; text-align: center; word-break: break-all;">${resetUrl}</p>
                            <p style="color: #6b7280; font-size: 12px; margin-top: 16px; text-align: center;">&copy; ${new Date().getFullYear()} 3DPrintables.ai</p>
                        </div>
                    `
                });
                console.log(`Password reset email sent to ${user.email}`);
            } catch (emailErr) {
                console.error('Failed to send password reset email:', emailErr.message);
            }
        }

        res.json(genericResponse);
    } catch (error) {
        console.error('Forgot password error:', error.message);
        res.json(genericResponse);
    }
});

// Reset Password — validate token and update password
app.post('/api/auth/reset-password', async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ error: 'Token and new password are required.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    try {
        // Hash the incoming token to compare against stored hash
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Find a valid, unexpired, unused token
        const resetRecord = db.prepare(`
            SELECT pr.*, u.email FROM password_resets pr
            JOIN users u ON u.id = pr.user_id
            WHERE pr.token_hash = ? AND pr.used = 0 AND pr.expires_at > datetime('now')
        `).get(tokenHash);

        if (!resetRecord) {
            return res.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user password
        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, resetRecord.user_id);

        // Mark the token as used
        db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(resetRecord.id);

        // Also invalidate any other unused tokens for this user
        db.prepare('UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0').run(resetRecord.user_id);

        console.log(`Password reset successful for user ${resetRecord.email}`);

        res.json({ message: 'Your password has been reset successfully. You can now sign in with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error.message);
        res.status(500).json({ error: 'An error occurred. Please try again.' });
    }
});

// Image Upload (admin only) — for message attachments
app.post('/api/upload-image', authenticateToken, requireAdmin, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided or invalid file type. Accepted: jpeg, png, gif, webp (max 5MB).' });
    }
    res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.originalname });
});

// User Stats Endpoint
app.get('/api/users/:id/stats', (req, res) => {
    try {
        const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders WHERE user_id = ?').get(req.params.id).count;
        const blueprintCount = db.prepare('SELECT COUNT(*) as count FROM blueprints WHERE user_id = ?').get(req.params.id).count;
        res.json({ orderCount, blueprintCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API Endpoints

// Get all products
app.get('/api/products', (req, res) => {
    try {
        const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a new product (admin only)
app.post('/api/products', authenticateToken, requireAdmin, (req, res) => {
    const { name, price, description, category, image, image_prompt } = req.body;
    const id = `prod_${Date.now()}`;

    try {
        const insert = db.prepare(`
      INSERT INTO products(id, name, price, description, category, image, image_prompt)
      VALUES(?, ?, ?, ?, ?, ?, ?)
    `);
        insert.run(id, name, price, description, category, image, image_prompt);
        res.json({ id, name, price, description, category });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create an order
app.post('/api/orders', async (req, res) => {
    const { userId, customer_name, email, phone, shipping_address, billing_address, total, items, creditsUsed = 0, notes = '', chatSessionId = null } = req.body;
    const orderId = `quote_${Date.now()}`;

    const transaction = db.transaction(() => {
        // If credits were used, deduct them
        if (userId && creditsUsed > 0) {
            const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(userId);
            if (!user || user.credits < creditsUsed) {
                throw new Error('Insufficient credits');
            }
            db.prepare('UPDATE users SET credits = credits - ? WHERE id = ?').run(creditsUsed, userId);
        }

        // Insert quote request as order
        db.prepare(`
      INSERT INTO orders(id, user_id, customer_name, email, phone, shipping_address, billing_address, total, chat_session_id)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(orderId, userId || null, customer_name, email, phone, shipping_address || 'Quote Request', billing_address || 'Quote Request', total || 0, chatSessionId);

        // Insert items
        const insertItem = db.prepare(`
      INSERT INTO order_items(order_id, product_name, price, quantity, image)
      VALUES(?, ?, ?, ?, ?)
    `);

        for (const item of items) {
            insertItem.run(orderId, item.name, item.price, item.quantity, item.image);
        }
    });

    try {
        transaction();

        // Send Quote Request Notification Emails via Resend
        if (process.env.RESEND_API_KEY) {
            // Build image attachments from base64 data URIs or HTTP URLs
            const attachments = [];
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const safeName = item.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
                try {
                    if (item.image && item.image.startsWith('data:image/')) {
                        // Handle base64 data URIs (most AI-generated images)
                        const matches = item.image.match(/^data:image\/(\w+);base64,(.+)$/);
                        if (matches) {
                            const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
                            const imageBuffer = Buffer.from(matches[2], 'base64');
                            attachments.push({
                                filename: `${safeName}_${i + 1}.${ext}`,
                                content: imageBuffer
                            });
                            console.log(`Extracted base64 image for "${item.name}" (${(imageBuffer.length / 1024).toFixed(1)}KB)`);
                        }
                    } else if (item.image && (item.image.startsWith('http://') || item.image.startsWith('https://'))) {
                        // Handle remote image URLs
                        const imageBuffer = await fetchImageBuffer(item.image);
                        attachments.push({
                            filename: `${safeName}_${i + 1}.png`,
                            content: imageBuffer
                        });
                        console.log(`Fetched remote image for "${item.name}" (${(imageBuffer.length / 1024).toFixed(1)}KB)`);
                    }
                } catch (imgErr) {
                    console.error(`Failed to process image for "${item.name}":`, imgErr.message);
                }
            }

            // Build items HTML with inline image references (cid)
            const itemsList = items.map((item, i) => {
                const cidRef = attachments[i] ? `cid:design_${i}` : '';
                return `<tr>
                    <td style="padding: 16px 0; border-bottom: 1px solid #f3f4f6;">
                        ${cidRef ? `<img src="${cidRef}" alt="${item.name}" style="width: 100%; max-width: 400px; border-radius: 12px; margin-bottom: 12px; display: block;" />` : ''}
                        <strong style="color: #111827; font-size: 16px;">${item.name}</strong>
                        <br><span style="color: #6b7280; font-size: 13px;">Qty: ${item.quantity}</span>
                    </td>
                </tr>`;
            }).join('');

            // Customer-facing items list (same images)
            const customerItemsList = items.map((item, i) => {
                const cidRef = attachments[i] ? `cid:design_${i}` : '';
                return `<tr>
                    <td style="padding: 16px 0; border-bottom: 1px solid #f3f4f6;">
                        ${cidRef ? `<img src="${cidRef}" alt="${item.name}" style="width: 100%; max-width: 400px; border-radius: 12px; margin-bottom: 12px; display: block;" />` : ''}
                        <strong style="color: #111827; font-size: 16px;">${item.name}</strong>
                        <br><span style="color: #6b7280; font-size: 13px;">Qty: ${item.quantity}</span>
                    </td>
                </tr>`;
            }).join('');

            // Add contentId to attachments for inline display in email
            // Resend requires: content as base64 string, contentId in camelCase
            const emailAttachments = attachments.map((att, i) => ({
                filename: att.filename,
                content: att.content.toString('base64'),
                contentId: `design_${i}`
            }));

            // ---- EMAIL 1: Team notification ----
            try {
                await resend.emails.send({
                    from: '3DPrintables.ai <hello@3dprintables.ai>',
                    to: ['ab@abmodi.ai', 'arav@abmodi.ai'],
                    replyTo: email,
                    subject: `New Quote Request from ${customer_name} - ${orderId}`,
                    attachments: emailAttachments,
                    html: `
                        <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 16px; background: #ffffff; color: #111827;">
                            <div style="text-align: center; margin-bottom: 24px;">
                                <h1 style="color: #7c3aed; font-size: 24px; margin: 0;">3DPrintables.ai</h1>
                                <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">New Quote Request</p>
                            </div>

                            <div style="margin: 0 0 24px 0; padding: 20px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
                                <p style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-top: 0;">Customer Info</p>
                                <p style="margin: 4px 0; color: #374151;"><strong>Name:</strong> ${customer_name}</p>
                                <p style="margin: 4px 0; color: #374151;"><strong>Email:</strong> ${email}</p>
                                ${phone ? `<p style="margin: 4px 0; color: #374151;"><strong>Phone:</strong> ${phone}</p>` : ''}
                                <p style="margin: 4px 0; color: #374151;"><strong>Quote ID:</strong> ${orderId}</p>
                            </div>

                            <div style="margin: 0 0 24px 0; padding: 20px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
                                <p style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-top: 0;">Designs Requested</p>
                                <table style="width: 100%; border-collapse: collapse;">
                                    ${itemsList}
                                </table>
                            </div>

                            ${notes ? `
                            <div style="margin: 0 0 24px 0; padding: 20px; background: #fefce8; border-radius: 12px; border: 1px solid #fde68a;">
                                <p style="font-size: 12px; color: #92400e; text-transform: uppercase; letter-spacing: 1px; margin-top: 0;">Customer Notes</p>
                                <p style="color: #374151; font-style: italic; margin: 0;">"${notes}"</p>
                            </div>
                            ` : ''}

                            <div style="margin: 0 0 24px 0; padding: 16px 20px; background: #faf5ff; border-radius: 12px; border: 1px solid #e9d5ff;">
                                <p style="color: #7c3aed; font-weight: bold; font-size: 14px; margin: 0;">Hit reply to respond directly to ${customer_name} at ${email}</p>
                            </div>

                            <p style="color: #9ca3af; font-size: 11px; margin-top: 16px; text-align: center;">Design images are attached for your reference.</p>
                            <p style="color: #6b7280; font-size: 12px; margin-top: 8px; text-align: center;">© ${new Date().getFullYear()} 3DPrintables.ai — Custom 3D prints by Arav</p>
                        </div>
                    `
                });
                console.log(`✅ Team email sent to ab@abmodi.ai for ${customer_name} (${email}) with ${attachments.length} image(s)`);
            } catch (emailError) {
                console.error('❌ Failed to send team email:', emailError.message);
            }

            // ---- EMAIL 2: Customer confirmation ----
            try {
                await resend.emails.send({
                    from: '3DPrintables.ai <hello@3dprintables.ai>',
                    to: [email],
                    subject: `Your Quote Request — ${orderId}`,
                    attachments: emailAttachments,
                    html: `
                        <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 16px; background: #ffffff; color: #111827;">
                            <div style="text-align: center; margin-bottom: 24px;">
                                <h1 style="color: #7c3aed; font-size: 24px; margin: 0;">3DPrintables.ai</h1>
                                <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Quote Request Received!</p>
                            </div>

                            <div style="margin: 0 0 24px 0; padding: 20px; background: #faf5ff; border-radius: 12px; border: 1px solid #e9d5ff;">
                                <p style="color: #374151; margin: 0; font-size: 15px;">Hi <strong>${customer_name}</strong>,</p>
                                <p style="color: #374151; margin: 8px 0 0 0; font-size: 15px;">Thanks for submitting your designs! We've received your quote request and Arav will review your designs personally.</p>
                            </div>

                            <div style="margin: 0 0 24px 0; padding: 20px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">
                                <p style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-top: 0;">Your Designs</p>
                                <table style="width: 100%; border-collapse: collapse;">
                                    ${customerItemsList}
                                </table>
                            </div>

                            <div style="margin: 0 0 24px 0; padding: 20px; background: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0;">
                                <p style="font-size: 12px; color: #166534; text-transform: uppercase; letter-spacing: 1px; margin-top: 0; font-weight: bold;">What happens next?</p>
                                <p style="color: #374151; margin: 8px 0 4px 0; font-size: 14px;">✅ We'll review your designs and calculate pricing</p>
                                <p style="color: #374151; margin: 4px 0; font-size: 14px;">✅ You'll receive a detailed quote within 24-48 hours</p>
                                <p style="color: #374151; margin: 4px 0 0 0; font-size: 14px;">✅ Once you approve, Arav prints and ships your creations!</p>
                            </div>

                            <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 0;">Quote ID: <strong>${orderId}</strong></p>
                            <p style="color: #9ca3af; font-size: 11px; margin-top: 16px; text-align: center;">Your design images are attached for your records.</p>
                            <p style="color: #6b7280; font-size: 12px; margin-top: 8px; text-align: center;">© ${new Date().getFullYear()} 3DPrintables.ai — Custom 3D prints by Arav</p>
                        </div>
                    `
                });
                console.log(`✅ Customer confirmation email sent to ${email} with ${attachments.length} image(s)`);
            } catch (emailError) {
                console.error(`❌ Customer email to ${email} failed:`, emailError.message);
            }
        }

        res.json({ success: true, orderId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Use credits
app.post('/api/users/use-credits', (req, res) => {
    const { userId, amount } = req.body;
    try {
        const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(userId);
        if (!user || user.credits < amount) {
            return res.status(400).json({ error: 'Insufficient credits' });
        }
        db.prepare('UPDATE users SET credits = credits - ? WHERE id = ?').run(amount, userId);
        res.json({ success: true, remaining: (user.credits - amount).toFixed(2) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add credits (Admin only)
app.post('/api/users/add-credits', authenticateToken, requireAdmin, (req, res) => {
    const { userId, amount } = req.body;
    try {
        db.prepare('UPDATE users SET credits = credits + ? WHERE id = ?').run(amount, userId);
        const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(userId);
        res.json({ success: true, newBalance: user.credits.toFixed(2) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all orders (admin only) — includes message count
app.get('/api/orders', authenticateToken, requireAdmin, (req, res) => {
    try {
        const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
        for (const order of orders) {
            order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
            const msgCount = db.prepare('SELECT COUNT(*) as count FROM order_messages WHERE order_id = ?').get(order.id);
            order.messageCount = msgCount ? msgCount.count : 0;
        }
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all conversations for message center (admin only)
app.get('/api/admin/conversations', authenticateToken, requireAdmin, (req, res) => {
    try {
        const conversations = db.prepare(`
            SELECT
                o.id AS order_id,
                o.customer_name,
                o.email,
                o.status,
                o.admin_last_read,
                o.created_at AS order_created_at,
                (SELECT COUNT(*) FROM order_messages WHERE order_id = o.id) AS total_messages,
                (SELECT COUNT(*) FROM order_messages
                 WHERE order_id = o.id AND sender = 'customer'
                 AND created_at > COALESCE(o.admin_last_read, '1970-01-01')) AS unread_count,
                latest.message AS last_message,
                latest.sender AS last_sender,
                latest.created_at AS last_message_at,
                latest.image_url AS last_image_url
            FROM orders o
            LEFT JOIN order_messages latest ON latest.order_id = o.id
                AND latest.id = (SELECT id FROM order_messages WHERE order_id = o.id ORDER BY created_at DESC LIMIT 1)
            ORDER BY COALESCE(latest.created_at, o.created_at) DESC
        `).all();
        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark conversation as read (admin only)
app.patch('/api/orders/:orderId/read', authenticateToken, requireAdmin, (req, res) => {
    const { orderId } = req.params;
    try {
        db.prepare('UPDATE orders SET admin_last_read = CURRENT_TIMESTAMP WHERE id = ?').run(orderId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update order status (admin only)
app.patch('/api/orders/:orderId/status', authenticateToken, requireAdmin, async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['quote_request', 'waiting_payment', 'shipped_delivered'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    try {
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, orderId);

        // Send status change email to customer via Resend
        if (process.env.RESEND_API_KEY && order.email) {
            const statusLabels = {
                quote_request: 'Quote Requested',
                waiting_payment: 'Waiting for Payment',
                shipped_delivered: 'Shipped & Delivered',
                cancelled: 'Cancelled'
            };
            const statusMessages = {
                quote_request: 'Your quote request is being reviewed. We\'ll get back to you with pricing details soon.',
                waiting_payment: 'Great news! Your quote has been finalized. We\'re now waiting for your payment to proceed with production.',
                shipped_delivered: 'Your order has been shipped and is on its way! Thank you for choosing 3DPrintables.ai.',
                cancelled: 'Your order has been cancelled. If you have any questions, please reply to this email.'
            };
            const statusColors = {
                quote_request: '#7c3aed',
                waiting_payment: '#f59e0b',
                shipped_delivered: '#22c55e',
                cancelled: '#ef4444'
            };

            try {
                await resend.emails.send({
                    from: '3DPrintables.ai <hello@3dprintables.ai>',
                    to: [order.email],
                    subject: `Order Update: ${statusLabels[status]} — ${orderId}`,
                    html: `
                        <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 16px; background: #ffffff; color: #111827;">
                            <div style="text-align: center; margin-bottom: 24px;">
                                <h1 style="color: #7c3aed; font-size: 24px; margin: 0;">3DPrintables.ai</h1>
                                <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Order Status Update</p>
                            </div>
                            <div style="margin: 0 0 24px 0; padding: 20px; background: #faf5ff; border-radius: 12px; border: 1px solid #e9d5ff;">
                                <p style="color: #374151; margin: 0; font-size: 15px;">Hi <strong>${order.customer_name}</strong>,</p>
                                <p style="color: #374151; margin: 12px 0 0 0; font-size: 15px;">${statusMessages[status]}</p>
                            </div>
                            <div style="text-align: center; margin: 0 0 24px 0;">
                                <span style="display: inline-block; padding: 8px 20px; border-radius: 9999px; font-size: 13px; font-weight: 700; color: white; background: ${statusColors[status]};">${statusLabels[status]}</span>
                            </div>
                            <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 0;">Quote ID: <strong>${orderId}</strong></p>
                            <p style="color: #6b7280; font-size: 12px; margin-top: 16px; text-align: center;">&copy; ${new Date().getFullYear()} 3DPrintables.ai — Custom 3D prints by Arav</p>
                        </div>
                    `
                });
                console.log(`✅ Status change email sent to ${order.email} for ${orderId} → ${status}`);
            } catch (emailErr) {
                console.error(`❌ Status change email failed:`, emailErr.message);
            }
        }

        res.json({ success: true, orderId, status });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send a message for an order (admin only → customer email)
app.post('/api/orders/:orderId/messages', authenticateToken, requireAdmin, async (req, res) => {
    const { orderId } = req.params;
    const { message, sender = 'admin', image_url } = req.body;

    if ((!message || !message.trim()) && !image_url) {
        return res.status(400).json({ error: 'Message or image is required' });
    }

    try {
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        db.prepare('INSERT INTO order_messages(order_id, sender, message, image_url) VALUES(?, ?, ?, ?)').run(orderId, sender, (message || '').trim(), image_url || null);

        const savedMsg = db.prepare('SELECT * FROM order_messages WHERE order_id = ? ORDER BY id DESC LIMIT 1').get(orderId);

        // If admin sends a message, email the customer
        if (sender === 'admin' && process.env.RESEND_API_KEY && order.email) {
            try {
                // Build image section for email
                const baseUrl = process.env.APP_URL || 'https://3dprintables.ai';
                let imageHtml = '';
                let attachments = [];

                if (image_url) {
                    const fullImageUrl = `${baseUrl}${image_url}`;
                    imageHtml = `<div style="margin: 12px 0 0 0;"><img src="${fullImageUrl}" alt="Attachment" style="max-width: 100%; border-radius: 8px; border: 1px solid #e9d5ff;" /></div>`;

                    // Also attach the image file
                    const imagePath = join(uploadsDir, image_url.replace('/uploads/', ''));
                    if (fs.existsSync(imagePath)) {
                        const imageContent = fs.readFileSync(imagePath).toString('base64');
                        const filename = image_url.split('/').pop();
                        attachments.push({ content: imageContent, filename });
                    }
                }

                const replyToAddress = `order-${orderId}@reply.3dprintables.ai`;

                // Fetch previous messages for conversation thread (exclude the one we just inserted)
                const previousMessages = db.prepare('SELECT * FROM order_messages WHERE order_id = ? ORDER BY created_at ASC').all(orderId);
                // Remove the last message (the one we just sent) since it's shown as the main message
                const threadMessages = previousMessages.slice(0, -1);

                let threadHtml = '';
                if (threadMessages.length > 0) {
                    const threadItems = threadMessages.map(msg => {
                        const isAdmin = msg.sender === 'admin';
                        const senderLabel = isAdmin ? 'Arav (3DPrintables)' : order.customer_name;
                        const bgColor = isAdmin ? '#faf5ff' : '#f9fafb';
                        const borderColor = isAdmin ? '#e9d5ff' : '#e5e7eb';
                        const date = new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
                        let msgImageHtml = '';
                        if (msg.image_url) {
                            const fullUrl = `${baseUrl}${msg.image_url}`;
                            msgImageHtml = `<img src="${fullUrl}" alt="Attachment" style="max-width: 100%; border-radius: 8px; margin-top: 8px;" />`;
                        }
                        return `<div style="padding: 12px 16px; background: ${bgColor}; border-radius: 10px; border: 1px solid ${borderColor}; margin-bottom: 8px;">
                            <p style="margin: 0 0 4px 0; font-size: 11px; color: #9ca3af;"><strong>${senderLabel}</strong> &middot; ${date}</p>
                            ${msg.message ? `<p style="margin: 0; font-size: 14px; color: #374151; white-space: pre-wrap;">${msg.message}</p>` : ''}
                            ${msgImageHtml}
                        </div>`;
                    }).join('');

                    threadHtml = `
                        <div style="margin: 0 0 24px 0;">
                            <p style="font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0; padding-top: 16px; border-top: 1px solid #e5e7eb;">Previous Messages</p>
                            ${threadItems}
                        </div>
                    `;
                }

                const emailPayload = {
                    from: '3DPrintables.ai <hello@3dprintables.ai>',
                    to: [order.email],
                    replyTo: replyToAddress,
                    subject: `Message about your order ${orderId} — 3DPrintables.ai`,
                    html: `
                        <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 16px; background: #ffffff; color: #111827;">
                            <div style="text-align: center; margin-bottom: 24px;">
                                <h1 style="color: #7c3aed; font-size: 24px; margin: 0;">3DPrintables.ai</h1>
                                <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Message from Arav</p>
                            </div>
                            <div style="margin: 0 0 24px 0; padding: 20px; background: #faf5ff; border-radius: 12px; border: 1px solid #e9d5ff;">
                                <p style="color: #374151; margin: 0; font-size: 15px;">Hi <strong>${order.customer_name}</strong>,</p>
                                ${message && message.trim() ? `<p style="color: #374151; margin: 12px 0 0 0; font-size: 15px; white-space: pre-wrap;">${message.trim()}</p>` : ''}
                                ${imageHtml}
                            </div>
                            <div style="margin: 0 0 24px 0; padding: 16px 20px; background: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0;">
                                <p style="color: #166534; font-size: 13px; margin: 0;">You can reply directly to this email to respond.</p>
                            </div>
                            ${threadHtml}
                            <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 0;">Quote ID: <strong>${orderId}</strong></p>
                            <p style="color: #6b7280; font-size: 12px; margin-top: 16px; text-align: center;">&copy; ${new Date().getFullYear()} 3DPrintables.ai</p>
                        </div>
                    `
                };

                if (attachments.length > 0) emailPayload.attachments = attachments;

                await resend.emails.send(emailPayload);
                console.log(`Admin message email sent to ${order.email} for ${orderId}`);
            } catch (emailErr) {
                console.error(`Admin message email failed:`, emailErr.message);
            }
        }

        res.json(savedMsg);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all messages for an order (admin only)
app.get('/api/orders/:orderId/messages', authenticateToken, requireAdmin, (req, res) => {
    const { orderId } = req.params;
    try {
        const messages = db.prepare('SELECT * FROM order_messages WHERE order_id = ? ORDER BY created_at ASC').all(orderId);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Resend Inbound Email Webhook — auto-capture customer replies
app.post('/api/webhooks/resend', async (req, res) => {
    try {
        const event = req.body;
        console.log('📨 Webhook received:', JSON.stringify({ type: event.type, data_keys: Object.keys(event.data || {}), created_at: event.created_at }));

        // Verify webhook signature if signing secret is available
        if (process.env.RESEND_WEBHOOK_SECRET) {
            const svixId = req.headers['svix-id'];
            const svixTimestamp = req.headers['svix-timestamp'];
            const svixSignature = req.headers['svix-signature'];

            if (svixId && svixTimestamp && svixSignature) {
                const signedContent = `${svixId}.${svixTimestamp}.${JSON.stringify(req.body)}`;
                const secret = process.env.RESEND_WEBHOOK_SECRET.replace('whsec_', '');
                const secretBytes = Buffer.from(secret, 'base64');
                const expectedSignature = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64');

                const signatures = svixSignature.split(' ').map(s => s.replace('v1,', ''));
                const isValid = signatures.some(sig => sig === expectedSignature);
                if (!isValid) {
                    console.log('⚠️ Webhook: Invalid signature');
                    return res.status(401).json({ status: 'invalid_signature' });
                }
                console.log('✅ Webhook: Signature verified');
            }
        }

        // Only process email.received events
        if (event.type !== 'email.received') {
            console.log(`Webhook: Ignoring event type: ${event.type}`);
            return res.status(200).json({ status: 'ignored' });
        }

        const emailId = event.data?.email_id;
        console.log('Webhook: email_id =', emailId, 'to =', event.data?.to, 'from =', event.data?.from, 'subject =', event.data?.subject);

        if (!emailId) {
            console.log('Webhook: No email_id in event');
            return res.status(200).json({ status: 'no_email_id' });
        }

        // Extract order ID from the 'to' address (e.g., order-quote_1234@reply.3dprintables.ai)
        const toAddresses = event.data?.to || [];
        let orderId = null;
        for (const addr of toAddresses) {
            const match = addr.match(/order-([^@]+)@reply\.3dprintables\.ai/i);
            if (match) {
                orderId = match[1];
                break;
            }
        }

        if (!orderId) {
            console.log('Webhook: Could not extract order ID from to addresses:', toAddresses);
            return res.status(200).json({ status: 'no_order_id' });
        }

        // Verify order exists
        const order = db.prepare('SELECT id FROM orders WHERE id = ?').get(orderId);
        if (!order) {
            console.log(`Webhook: Order ${orderId} not found`);
            return res.status(200).json({ status: 'order_not_found' });
        }

        // Fetch the full email content from Resend API
        let emailBody = '';
        try {
            const emailRes = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
                headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` }
            });
            const emailData = await emailRes.json();
            console.log('Webhook: Fetched email data keys:', Object.keys(emailData));
            if (emailRes.ok) {
                // Prefer plain text, fall back to HTML with tags stripped
                let rawBody = emailData.text || (emailData.html ? emailData.html.replace(/<[^>]*>/g, '').trim() : '');

                // Extract only the latest reply — strip quoted thread and signatures
                // Cut at common reply markers: "On ... wrote:", "------", "> " quoted lines
                const replyMarkers = [
                    /\r?\nOn .{10,} wrote:\s*$/ms,          // "On Mon, Feb 16, 2026 ... wrote:"
                    /\r?\n-{3,}\s*Original Message/i,       // "--- Original Message"
                    /\r?\n_{3,}/,                            // "___" dividers
                    /\r?\n>{1,}\s/,                          // "> " quoted lines
                ];
                for (const marker of replyMarkers) {
                    const match = rawBody.match(marker);
                    if (match) {
                        rawBody = rawBody.substring(0, match.index);
                        break;
                    }
                }

                // Strip common email signatures (lines after "Sincerely," "Best," "Thanks," etc.)
                const sigMarkers = /\r?\n\s*(Sincerely|Best regards|Best|Thanks|Thank you|Regards|Cheers|Sent from my),?\s*\r?\n/i;
                const sigMatch = rawBody.match(sigMarkers);
                if (sigMatch) {
                    rawBody = rawBody.substring(0, sigMatch.index);
                }

                emailBody = rawBody.trim();
            } else {
                console.log(`Webhook: Failed to fetch email ${emailId}:`, emailRes.status, JSON.stringify(emailData));
            }
        } catch (fetchErr) {
            console.error('Webhook: Error fetching email:', fetchErr.message);
        }

        if (!emailBody.trim()) {
            // Use subject as fallback
            emailBody = event.data?.subject || '(Customer replied via email)';
        }

        // Save the customer reply as a message
        db.prepare('INSERT INTO order_messages(order_id, sender, message) VALUES(?, ?, ?)').run(orderId, 'customer', emailBody.trim());
        console.log(`✅ Webhook: Customer reply saved for order ${orderId}: "${emailBody.trim().substring(0, 100)}"`);

        res.status(200).json({ status: 'saved' });
    } catch (error) {
        console.error('❌ Webhook error:', error.message);
        res.status(200).json({ status: 'error' });
    }
});

// Get orders for a specific user
app.get('/api/orders/user/:userId', (req, res) => {
    const { userId } = req.params;
    try {
        const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(userId);
        for (const order of orders) {
            order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
        }
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save a blueprint
app.post('/api/blueprints', (req, res) => {
    const { userId, name, price, category, image, image_prompt } = req.body;
    const id = `blue_${Date.now()}`;

    try {
        const insert = db.prepare(`
      INSERT INTO blueprints(id, user_id, name, price, category, image, image_prompt)
      VALUES(?, ?, ?, ?, ?, ?, ?)
    `);
        insert.run(id, userId, name, price, category, image, image_prompt);
        res.json({ id, name, price, category });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get blueprints for a user
app.get('/api/blueprints/user/:userId', (req, res) => {
    const { userId } = req.params;
    try {
        const blueprints = db.prepare('SELECT * FROM blueprints WHERE user_id = ? ORDER BY created_at DESC').all(userId);
        res.json(blueprints);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ---- Chat Session Endpoints ----

// Create a new chat session
app.post('/api/chat/sessions', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const id = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    try {
        db.prepare(`INSERT INTO chat_sessions(id, user_id) VALUES(?, ?)`).run(id, userId);
        const session = db.prepare('SELECT * FROM chat_sessions WHERE id = ?').get(id);
        res.json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a message to a chat session
app.post('/api/chat/sessions/:sessionId/messages', (req, res) => {
    const { sessionId } = req.params;
    const { role, content, image, productJson } = req.body;

    if (!role || !content) return res.status(400).json({ error: 'role and content are required' });

    try {
        db.prepare(`
            INSERT INTO chat_messages(session_id, role, content, image, product_json)
            VALUES(?, ?, ?, ?, ?)
        `).run(sessionId, role, content, image || null, productJson || null);

        // Update session timestamp
        db.prepare('UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(sessionId);

        // Auto-set title from first user message (if still default)
        if (role === 'user') {
            const session = db.prepare('SELECT title FROM chat_sessions WHERE id = ?').get(sessionId);
            if (session && session.title === 'New Design Chat') {
                // Strip system prefixes and filament color suffixes for a clean title
                let cleanTitle = content
                    .replace(/^\(Filament Color:.*?\)\s*/i, '')
                    .replace(/\s*\(Filament Color:.*?\)$/i, '')
                    .replace(/^Convert this into a 3D printed PLA object\s*/i, '')
                    .trim();
                if (cleanTitle.length > 50) cleanTitle = cleanTitle.substring(0, 47) + '...';
                if (cleanTitle.length > 0) {
                    db.prepare('UPDATE chat_sessions SET title = ? WHERE id = ?').run(cleanTitle, sessionId);
                }
            }
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// List all chat sessions for a user
app.get('/api/chat/sessions/user/:userId', (req, res) => {
    const { userId } = req.params;
    try {
        const sessions = db.prepare(`
            SELECT cs.*,
                (SELECT COUNT(*) FROM chat_messages WHERE session_id = cs.id) as messageCount,
                (SELECT content FROM chat_messages WHERE session_id = cs.id ORDER BY created_at DESC LIMIT 1) as lastMessage
            FROM chat_sessions cs
            WHERE cs.user_id = ?
            ORDER BY cs.updated_at DESC
        `).all(userId);
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all messages for a chat session
app.get('/api/chat/sessions/:sessionId/messages', (req, res) => {
    const { sessionId } = req.params;
    try {
        const messages = db.prepare('SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC').all(sessionId);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get chat session linked to a specific order
app.get('/api/chat/sessions/order/:orderId', (req, res) => {
    const { orderId } = req.params;
    try {
        const order = db.prepare('SELECT chat_session_id FROM orders WHERE id = ?').get(orderId);
        if (!order || !order.chat_session_id) {
            return res.status(404).json({ error: 'No chat session linked to this order' });
        }

        const session = db.prepare('SELECT * FROM chat_sessions WHERE id = ?').get(order.chat_session_id);
        const messages = db.prepare('SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC').all(order.chat_session_id);
        res.json({ session, messages });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update chat session title
app.patch('/api/chat/sessions/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const { title } = req.body;
    try {
        db.prepare('UPDATE chat_sessions SET title = ? WHERE id = ?').run(title, sessionId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Newsletter Subscribe — sends notification email to team
app.post('/api/newsletter/subscribe', async (req, res) => {
    const { email } = req.body;
    if (!email || !email.includes('@') || !email.includes('.')) {
        return res.status(400).json({ error: 'Valid email is required' });
    }

    try {
        if (process.env.RESEND_API_KEY) {
            // Send notification to team
            await resend.emails.send({
                from: '3DPrintables.ai <hello@3dprintables.ai>',
                to: ['ab@abmodi.ai', 'arav@abmodi.ai'],
                subject: `New Newsletter Subscriber: ${email}`,
                html: `
                    <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 16px; background: #ffffff; color: #111827;">
                        <div style="text-align: center; margin-bottom: 24px;">
                            <h1 style="color: #7c3aed; font-size: 24px; margin: 0;">3DPrintables.ai</h1>
                            <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">New Newsletter Subscriber 🎉</p>
                        </div>
                        <div style="padding: 20px; background: #faf5ff; border-radius: 12px; border: 1px solid #e9d5ff; text-align: center;">
                            <p style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-top: 0;">Subscriber Email</p>
                            <p style="color: #7c3aed; font-size: 18px; font-weight: bold; margin: 8px 0 0 0;">${email}</p>
                        </div>
                        <p style="color: #9ca3af; font-size: 11px; margin-top: 20px; text-align: center;">Subscribed on ${new Date().toLocaleString()}</p>
                        <p style="color: #6b7280; font-size: 12px; margin-top: 8px; text-align: center;">&copy; ${new Date().getFullYear()} 3DPrintables.ai</p>
                    </div>
                `
            });
            console.log(`✅ Newsletter subscription notification sent for ${email}`);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('❌ Newsletter subscribe error:', error.message);
        res.status(500).json({ error: 'Failed to process subscription' });
    }
});

// Seed data from CSV if table is empty
const seedDatabase = () => {
    const count = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    if (count === 0) {
        console.log('🌱 Seeding database from CSV...');
        try {
            const csvPath = join(__dirname, '..', 'master_products.csv');
            if (fs.existsSync(csvPath)) {
                const content = fs.readFileSync(csvPath, 'utf-8');
                const lines = content.split('\n');
                const headers = lines[0].split(',');

                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i]) continue;
                    const values = lines[i].split(',');
                    // name,price,category,image,description
                    const product = {
                        id: `seed_${i}`,
                        name: values[0],
                        price: parseFloat(values[1]),
                        category: values[2],
                        image: values[3],
                        description: values[4]
                    };

                    db.prepare(`
            INSERT INTO products(id, name, price, description, category, image)
            VALUES(?, ?, ?, ?, ?, ?)
          `).run(product.id, product.name, product.price, product.description, product.category, product.image);
                }
                console.log('✅ Seeding complete!');
            }
        } catch (error) {
            console.error('❌ Seeding failed:', error);
        }
    }
};

seedDatabase();

// Serve built frontend in production
const distPath = join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    // SPA fallback — any non-API route serves index.html
    app.get('/{*splat}', (req, res) => {
        res.sendFile(join(distPath, 'index.html'));
    });
    console.log('📦 Serving static frontend from /dist');
}

app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📁 Database: ${dbPath}`);
});
