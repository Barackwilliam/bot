const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

class Helpers {
    
    // Time formatting
    formatUptime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleString();
    }

    // Text processing
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    sanitizeFilename(filename) {
        return filename.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
    }

    truncateText(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // File operations
    async downloadFile(url, outputPath, options = {}) {
        try {
            const response = await axios({
                method: 'GET',
                url: url,
                responseType: 'stream',
                timeout: options.timeout || 30000,
                headers: options.headers || {}
            });

            await fs.ensureDir(path.dirname(outputPath));
            
            const writer = fs.createWriteStream(outputPath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(outputPath));
                writer.on('error', reject);
            });

        } catch (error) {
            throw new Error(`Download failed: ${error.message}`);
        }
    }

    async getFileInfo(filePath) {
        try {
            const stats = await fs.stat(filePath);
            const ext = path.extname(filePath).toLowerCase();
            
            return {
                exists: true,
                size: stats.size,
                sizeFormatted: this.formatFileSize(stats.size),
                extension: ext,
                mimeType: this.getMimeType(ext),
                created: stats.birthtime,
                modified: stats.mtime
            };
        } catch (error) {
            return { exists: false };
        }
    }

    getMimeType(extension) {
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.mp4': 'video/mp4',
            '.mp3': 'audio/mpeg',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.txt': 'text/plain',
            '.zip': 'application/zip'
        };
        
        return mimeTypes[extension] || 'application/octet-stream';
    }

    // Validation
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    isValidPhoneNumber(number) {
        // Basic validation for WhatsApp numbers
        const phoneRegex = /^[\d+\-\s()]+$/;
        return phoneRegex.test(number) && number.replace(/\D/g, '').length >= 10;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Security
    generateRandomString(length = 16) {
        return crypto.randomBytes(length).toString('hex');
    }

    generateHash(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    // Array utilities
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    // Data processing
    extractMentions(text) {
        const mentionRegex = /@(\d+)/g;
        const mentions = [];
        let match;
        
        while ((match = mentionRegex.exec(text)) !== null) {
            mentions.push(match[1] + '@s.whatsapp.net');
        }
        
        return mentions;
    }

    extractUrls(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.match(urlRegex) || [];
    }

    extractHashtags(text) {
        const hashtagRegex = /#(\w+)/g;
        const hashtags = [];
        let match;
        
        while ((match = hashtagRegex.exec(text)) !== null) {
            hashtags.push(match[1]);
        }
        
        return hashtags;
    }

    // WhatsApp utilities
    formatJid(number) {
        // Ensure number has proper JID format
        if (number.includes('@')) return number;
        return number + '@s.whatsapp.net';
    }

    extractNumber(jid) {
        return jid.split('@')[0];
    }

    isGroupJid(jid) {
        return jid.endsWith('@g.us');
    }

    // Rate limiting helper
    createRateLimiter(maxRequests = 10, windowMs = 60000) {
        const requests = new Map();
        
        return (identifier) => {
            const now = Date.now();
            const userRequests = requests.get(identifier) || [];
            
            // Remove old requests outside the window
            const validRequests = userRequests.filter(time => now - time < windowMs);
            
            if (validRequests.length >= maxRequests) {
                return false; // Rate limit exceeded
            }
            
            validRequests.push(now);
            requests.set(identifier, validRequests);
            
            return true; // Request allowed
        };
    }

    // Command parsing
    parseCommand(text, prefix = '.') {
        if (!text.startsWith(prefix)) return null;
        
        const args = text.slice(prefix.length).trim().split(/\s+/);
        const command = args.shift().toLowerCase();
        
        return {
            command,
            args,
            fullArgs: args.join(' '),
            originalText: text
        };
    }

    // Message formatting
    createProgressBar(current, total, length = 20) {
        const percentage = Math.round((current / total) * 100);
        const filled = Math.round((current / total) * length);
        const empty = length - filled;
        
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        return `${bar} ${percentage}%`;
    }

    formatList(items, numbered = true) {
        return items.map((item, index) => {
            const prefix = numbered ? `${index + 1}.` : '•';
            return `${prefix} ${item}`;
        }).join('\n');
    }

    // Error handling
    async retryAsync(fn, maxRetries = 3, delay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                await this.sleep(delay * Math.pow(2, i)); // Exponential backoff
            }
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Performance monitoring
    createTimer() {
        const start = process.hrtime.bigint();
        
        return {
            stop: () => {
                const end = process.hrtime.bigint();
                const duration = Number(end - start) / 1000000; // Convert to milliseconds
                return Math.round(duration * 100) / 100; // Round to 2 decimal places
            }
        };
    }

    // Memory utilities
    getMemoryUsage() {
        const usage = process.memoryUsage();
        return {
            rss: this.formatFileSize(usage.rss),
            heapTotal: this.formatFileSize(usage.heapTotal),
            heapUsed: this.formatFileSize(usage.heapUsed),
            external: this.formatFileSize(usage.external)
        };
    }
}

module.exports = new Helpers();
