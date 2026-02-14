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

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'printpalooza_secret_laboratory_key';

// Use a file-based database for persistence
const dbPath = join(__dirname, 'printpalooza.db');
const db = new Database(dbPath);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

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
`);

// Migration: Add credits column if it doesn't exist
try {
    db.prepare('ALTER TABLE users ADD COLUMN credits REAL DEFAULT 10').run();
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
    const { userId, customer_name, email, phone, shipping_address, billing_address, total, items, creditsUsed = 0 } = req.body;
    const orderId = `ord_${Date.now()}`;

    const transaction = db.transaction(() => {
        // If credits were used, deduct them
        if (userId && creditsUsed > 0) {
            const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(userId);
            if (!user || user.credits < creditsUsed) {
                throw new Error('Insufficient credits');
            }
            db.prepare('UPDATE users SET credits = credits - ? WHERE id = ?').run(creditsUsed, userId);
        }

        // Insert order
        db.prepare(`
      INSERT INTO orders(id, user_id, customer_name, email, phone, shipping_address, billing_address, total)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?)
    `).run(orderId, userId || null, customer_name, email, phone, shipping_address, billing_address, total);

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

        // Reward credits (Elite Engineer Protocol)
        if (userId) {
            const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders WHERE user_id = ?').get(userId).count;
            if (orderCount >= 50) {
                const reward = total * 0.15;
                db.prepare('UPDATE users SET credits = credits + ? WHERE id = ?').run(reward, userId);
                console.log(`💎 Elite Reward: ${reward.toFixed(2)} credits granted to user ${userId}`);
            }
        }

        // Send Order Confirmation Email via Resend
        if (process.env.RESEND_API_KEY) {
            try {
                await resend.emails.send({
                    from: 'PrintPalooza <orders@resend.dev>', // Default Resend test domain
                    to: [email, 'arav@abmodi.ai'],
                    subject: `Order Confirmed: ${orderId}`,
                    html: `
                        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #333; background: #000; color: #fff;">
                            <h1 style="color: #a855f7; text-transform: uppercase; letter-spacing: 2px;">Order Confirmed!</h1>
                            <p>Design ID: <strong>${orderId}</strong></p>
                            <div style="margin: 20px 0; padding: 15px; background: #111; border-radius: 10px;">
                                <h2 style="font-size: 14px; color: #71717a; text-transform: uppercase;">Manifest Summary</h2>
                                <ul>
                                    ${items.map(item => `<li style="margin-bottom: 5px;">${item.quantity}x ${item.name} - $${item.price}</li>`).join('')}
                                </ul>
                                <hr style="border: 0; border-top: 1px solid #333; margin: 15px 0;">
                                <p style="font-size: 18px; font-weight: bold;">Production Total: $${total}</p>
                            </div>
                            <p style="color: #71717a; font-size: 12px;">Transmission from the PrintPalooza Laboratory. Fabrication underway.</p>
                        </div>
                    `
                });
                console.log(`✉️ Confirmation email sent to ${email}`);
            } catch (emailError) {
                console.error('❌ Failed to send confirmation email:', emailError);
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

app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});
