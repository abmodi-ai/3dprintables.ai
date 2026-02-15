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
    status TEXT DEFAULT 'pending',
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

        const token = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id, email, fullName, credits: 10 } });
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

        const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders WHERE userId = ?').get(user.id).count;

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, email: user.email, fullName: user.full_name, credits: user.credits, orderCount } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// User Stats Endpoint
app.get('/api/users/:id/stats', (req, res) => {
    try {
        const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders WHERE userId = ?').get(req.params.id).count;
        const blueprintCount = db.prepare('SELECT COUNT(*) as count FROM blueprints WHERE userId = ?').get(req.params.id).count;
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

// Add a new product
app.post('/api/products', (req, res) => {
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

            // ---- EMAIL 1: Team notification to ab@abmodi.ai ----
            try {
                await resend.emails.send({
                    from: '3DPrintables.ai <hello@3dprintables.ai>',
                    to: ['ab@abmodi.ai'],
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

// Add credits (Admin/Grant feature)
app.post('/api/users/add-credits', (req, res) => {
    const { userId, amount } = req.body;
    try {
        db.prepare('UPDATE users SET credits = credits + ? WHERE id = ?').run(amount, userId);
        const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(userId);
        res.json({ success: true, newBalance: user.credits.toFixed(2) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all orders (for admin)
app.get('/api/orders', (req, res) => {
    try {
        const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
        for (const order of orders) {
            order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
        }
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
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
