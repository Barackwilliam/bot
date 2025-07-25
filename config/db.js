const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'bot.db');

class Database {
    constructor() {
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('❌ Error opening database:', err.message);
            } else {
                console.log('✅ Connected to SQLite database');
                this.initializeTables();
            }
        });
    }

    initializeTables() {
        const tables = [
            // Users table
            `CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT,
                phone TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                message_count INTEGER DEFAULT 0,
                is_admin BOOLEAN DEFAULT 0,
                is_banned BOOLEAN DEFAULT 0,
                warnings INTEGER DEFAULT 0
            )`,
            
            // Groups table
            `CREATE TABLE IF NOT EXISTS groups (
                id TEXT PRIMARY KEY,
                name TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                member_count INTEGER DEFAULT 0,
                message_count INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT 1
            )`,
            
            // Messages table
            `CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                group_id TEXT,
                message TEXT,
                message_type TEXT DEFAULT 'text',
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`,
            
            // Commands table
            `CREATE TABLE IF NOT EXISTS commands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                command TEXT,
                args TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                success BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`,
            
            // Bot stats table
            `CREATE TABLE IF NOT EXISTS bot_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                total_messages INTEGER DEFAULT 0,
                total_commands INTEGER DEFAULT 0,
                total_users INTEGER DEFAULT 0,
                total_groups INTEGER DEFAULT 0,
                uptime_seconds INTEGER DEFAULT 0,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        tables.forEach(sql => {
            this.db.run(sql, (err) => {
                if (err) {
                    console.error('❌ Error creating table:', err.message);
                }
            });
        });

        // Initialize bot stats if not exists
        this.db.run(`INSERT OR IGNORE INTO bot_stats (id) VALUES (1)`);
    }

    // User methods
    async addUser(userId, name = '', phone = '') {
        return new Promise((resolve, reject) => {
            const sql = `INSERT OR REPLACE INTO users (id, name, phone, last_seen) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`;
            this.db.run(sql, [userId, name, phone], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async getUser(userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM users WHERE id = ?`;
            this.db.get(sql, [userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async getUsers() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM users ORDER BY last_seen DESC`;
            this.db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    async updateUserActivity(userId) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE users SET last_seen = CURRENT_TIMESTAMP, message_count = message_count + 1 WHERE id = ?`;
            this.db.run(sql, [userId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    async banUser(userId) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE users SET is_banned = 1 WHERE id = ?`;
            this.db.run(sql, [userId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    async unbanUser(userId) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE users SET is_banned = 0, warnings = 0 WHERE id = ?`;
            this.db.run(sql, [userId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    async warnUser(userId) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE users SET warnings = warnings + 1 WHERE id = ?`;
            this.db.run(sql, [userId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    async makeAdmin(userId) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE users SET is_admin = 1 WHERE id = ?`;
            this.db.run(sql, [userId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    async removeAdmin(userId) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE users SET is_admin = 0 WHERE id = ?`;
            this.db.run(sql, [userId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    // Group methods
    async addGroup(groupId, name = '') {
        return new Promise((resolve, reject) => {
            const sql = `INSERT OR REPLACE INTO groups (id, name) VALUES (?, ?)`;
            this.db.run(sql, [groupId, name], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async getGroups() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM groups ORDER BY created_at DESC`;
            this.db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    async updateGroupActivity(groupId) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE groups SET message_count = message_count + 1 WHERE id = ?`;
            this.db.run(sql, [groupId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    // Message methods
    async addMessage(userId, groupId, message, messageType = 'text') {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO messages (user_id, group_id, message, message_type) VALUES (?, ?, ?, ?)`;
            this.db.run(sql, [userId, groupId, message, messageType], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async getMessages(limit = 100) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM messages ORDER BY timestamp DESC LIMIT ?`;
            this.db.all(sql, [limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    // Command methods
    async logCommand(userId, command, args = '', success = true) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO commands (user_id, command, args, success) VALUES (?, ?, ?, ?)`;
            this.db.run(sql, [userId, command, args, success ? 1 : 0], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async getCommands(limit = 100) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM commands ORDER BY timestamp DESC LIMIT ?`;
            this.db.all(sql, [limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    // Stats methods
    async getStats() {
        return new Promise((resolve, reject) => {
            const queries = [
                'SELECT COUNT(*) as total_users FROM users',
                'SELECT COUNT(*) as total_groups FROM groups',
                'SELECT COUNT(*) as total_messages FROM messages',
                'SELECT COUNT(*) as total_commands FROM commands',
                'SELECT COUNT(*) as banned_users FROM users WHERE is_banned = 1',
                'SELECT COUNT(*) as admin_users FROM users WHERE is_admin = 1'
            ];

            Promise.all(queries.map(query => 
                new Promise((res, rej) => {
                    this.db.get(query, [], (err, row) => {
                        if (err) rej(err);
                        else res(row);
                    });
                })
            )).then(results => {
                resolve({
                        totalUsers: results[0].total_users || 0,
                        totalGroups: results[1].total_groups || 0,
                        totalMessages: results[2].total_messages || 0,
                        totalCommands: results[3].total_commands || 0,
                        bannedUsers: results[4].banned_users || 0,
                        adminUsers: results[5].admin_users || 0,
                        botStartTime: global.botStartTime // 👈 lazima hii iwepo!
                    });

            }).catch(reject);
        });
    }

    async updateStats() {
        const stats = await this.getStats();
        return new Promise((resolve, reject) => {
            const sql = `UPDATE bot_stats SET 
                total_users = ?, 
                total_groups = ?, 
                total_messages = ?, 
                total_commands = ?,
                last_updated = CURRENT_TIMESTAMP 
                WHERE id = 1`;
            
            this.db.run(sql, [
                stats.totalUsers,
                stats.totalGroups, 
                stats.totalMessages,
                stats.totalCommands
            ], function(err) {
                if (err) reject(err);
                else resolve(stats);
            });
        });
    }

    // Utility methods
    async close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async backup() {
        // Create backup of database
        const backupPath = path.join(dbDir, `backup_${Date.now()}.db`);
        return new Promise((resolve, reject) => {
            const backup = this.db.backup(backupPath);
            backup.step(-1, (err) => {
                if (err) reject(err);
                else {
                    backup.finish((err) => {
                        if (err) reject(err);
                        else resolve(backupPath);
                    });
                }
            });
        });
    }
}

// Create and export singleton instance
const database = new Database();

module.exports = database;
