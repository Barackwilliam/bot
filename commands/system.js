// const helpers = require('../utils/helpers');
// const logger = require('../utils/logger');
// const database = require('../config/database');
// const config = require('../config/config');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

class SystemCommands {
    constructor() {
        this.commands = [
            'ping', 'status', 'uptime', 'stats', 'logs', 'restart',
            'backup', 'version', 'memory', 'disk', 'processes',
            'config', 'update', 'maintenance'
        ];
        
        this.startTime = Date.now();
    }

    async handle(sock, message, command, args, from) {
        try {
            // Check if user has system permissions
            const userRole = await this.getUserRole(from);
            const restrictedCommands = ['restart', 'backup', 'logs', 'config', 'maintenance'];
            
            if (restrictedCommands.includes(command) && !['owner', 'admin'].includes(userRole)) {
                await sock.sendMessage(from, {
                    text: '❌ Access denied! This command requires admin privileges.'
                });
                return;
            }

            switch (command) {
                case 'ping':
                    await this.pingCommand(sock, message, args, from);
                    break;
                    
                case 'status':
                    await this.statusCommand(sock, message, args, from);
                    break;
                    
                case 'uptime':
                    await this.uptimeCommand(sock, message, args, from);
                    break;
                    
                case 'stats':
                    await this.statsCommand(sock, message, args, from);
                    break;
                    
                case 'logs':
                    await this.logsCommand(sock, message, args, from);
                    break;
                    
                case 'restart':
                    await this.restartCommand(sock, message, args, from);
                    break;
                    
                case 'backup':
                    await this.backupCommand(sock, message, args, from);
                    break;
                    
                case 'version':
                    await this.versionCommand(sock, message, args, from);
                    break;
                    
                case 'memory':
                    await this.memoryCommand(sock, message, args, from);
                    break;
                    
                case 'disk':
                    await this.diskCommand(sock, message, args, from);
                    break;
                    
                case 'processes':
                    await this.processesCommand(sock, message, args, from);
                    break;
                    
                case 'config':
                    await this.configCommand(sock, message, args, from);
                    break;
                    
                case 'update':
                    await this.updateCommand(sock, message, args, from);
                    break;
                    
                case 'maintenance':
                    await this.maintenanceCommand(sock, message, args, from);
                    break;
                    
                default:
                    await sock.sendMessage(from, {
                        text: '❌ Unknown system command!'
                    });
            }
            
            // Log system command usage
            await database.addLog({
                type: 'system',
                message: `System command: ${command}`,
                userId: helpers.extractNumber(from),
                command: command
            });
            
        } catch (error) {
            logger.error('❌ Error in system command:', error);
            await sock.sendMessage(from, {
                text: '❌ System error occurred while processing your request.'
            });
        }
    }

    async getUserRole(from) {
        try {
            const user = await database.getUser(helpers.extractNumber(from));
            return user?.role || 'user';
        } catch (error) {
            return 'user';
        }
    }

    async pingCommand(sock, message, args, from) {
        const startTime = Date.now();
        
        const tempMessage = await sock.sendMessage(from, {
            text: '🏓 Calculating ping...'
        });
        
        const endTime = Date.now();
        const ping = endTime - startTime;
        
        // Edit the message with actual ping
        const result = `🏓 *Pong!*

⚡ *Response Time:* ${ping}ms
🟢 *Status:* Online
📡 *Server:* Healthy`;

        await sock.sendMessage(from, { text: result });
    }

    async statusCommand(sock, message, args, from) {
        const uptime = Date.now() - this.startTime;
        const uptimeStr = helpers.formatDuration(uptime);
        
        const memUsage = process.memoryUsage();
        const totalUsers = await database.getUserCount();
        const totalGroups = await database.getGroupCount();
        const totalCommands = await database.getCommandCount();

        const result = `📊 *Bot Status*

🟢 *Status:* Online & Running
⏰ *Uptime:* ${uptimeStr}
👥 *Total Users:* ${totalUsers}
👥 *Total Groups:* ${totalGroups}
🔧 *Commands Executed:* ${totalCommands}

💾 *Memory Usage:*
• Used: ${helpers.formatBytes(memUsage.used)}
• Total: ${helpers.formatBytes(memUsage.rss)}

🖥️ *System:*
• Node.js: ${process.version}
• Platform: ${os.platform()}
• Arch: ${os.arch()}`;

        await sock.sendMessage(from, { text: result });
    }

    async uptimeCommand(sock, message, args, from) {
        const botUptime = Date.now() - this.startTime;
        const systemUptime = os.uptime() * 1000;
        
        const result = `⏰ *Uptime Information*

🤖 *Bot Uptime:*
${helpers.formatDuration(botUptime)}

🖥️ *System Uptime:*
${helpers.formatDuration(systemUptime)}

📅 *Bot Started:*
${new Date(this.startTime).toLocaleString()}`;

        await sock.sendMessage(from, { text: result });
    }

    async statsCommand(sock, message, args, from) {
        try {
            const stats = await database.getDetailedStats();
            
            const result = `📈 *Detailed Statistics*

👥 *Users:*
• Total: ${stats.users.total}
• Active (24h): ${stats.users.active_24h}
• New (7d): ${stats.users.new_7d}

👥 *Groups:*
• Total: ${stats.groups.total}
• Active: ${stats.groups.active}

🔧 *Commands:*
• Total Executed: ${stats.commands.total}
• Today: ${stats.commands.today}
• Popular: ${stats.commands.popular}

💬 *Messages:*
• Total Processed: ${stats.messages.total}
• Today: ${stats.messages.today}
• Average/Day: ${stats.messages.avg_per_day}

🗄️ *Database:*
• Size: ${helpers.formatBytes(stats.database.size)}
• Tables: ${stats.database.tables}`;

            await sock.sendMessage(from, { text: result });
            
        } catch (error) {
            await sock.sendMessage(from, {
                text: '❌ Failed to retrieve statistics!'
            });
        }
    }

    async logsCommand(sock, message, args, from) {
        try {
            const type = args[0] || 'all';
            const limit = parseInt(args[1]) || 10;
            
            if (limit > 50) {
                await sock.sendMessage(from, {
                    text: '❌ Maximum 50 log entries allowed!'
                });
                return;
            }

            const logs = await database.getLogs(type, limit);
            
            let result = `📋 *System Logs (${type.toUpperCase()})*\n\n`;
            
            if (logs.length === 0) {
                result += '📭 No logs found.';
            } else {
                logs.forEach((log, index) => {
                    const timestamp = new Date(log.timestamp).toLocaleString();
                    result += `${index + 1}. 📅 ${timestamp}\n`;
                    result += `   📝 ${log.message}\n`;
                    if (log.userId) result += `   👤 User: ${log.userId}\n`;
                    result += '\n';
                });
            }

            await sock.sendMessage(from, { text: result });
            
        } catch (error) {
            await sock.sendMessage(from, {
                text: '❌ Failed to retrieve logs!'
            });
        }
    }

    async restartCommand(sock, message, args, from) {
        await sock.sendMessage(from, {
            text: '🔄 *Bot Restart Initiated*\n\n⚠️ Bot will restart in 5 seconds...\n🔄 Please wait for reconnection.'
        });
        
        // Log restart
        await database.addLog({
            type: 'system',
            message: 'Bot restart initiated',
            userId: helpers.extractNumber(from)
        });
        
        setTimeout(() => {
            process.exit(1); // Process manager should restart the bot
        }, 5000);
    }

    async backupCommand(sock, message, args, from) {
        try {
            await sock.sendMessage(from, {
                text: '💾 *Creating Backup*\n\n⏳ Please wait...'
            });
            
            const backupPath = await this.createBackup();
            
            const result = `✅ *Backup Created Successfully*

📁 *Location:* ${backupPath}
📅 *Created:* ${new Date().toLocaleString()}
💾 *Type:* Full Database Backup

🔒 Backup has been secured and stored.`;

            await sock.sendMessage(from, { text: result });
            
        } catch (error) {
            await sock.sendMessage(from, {
                text: '❌ Backup creation failed!'
            });
        }
    }

    async createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(__dirname, '../backups');
        const backupPath = path.join(backupDir, `backup-${timestamp}.json`);
        
        // Ensure backup directory exists
        try {
            await fs.mkdir(backupDir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }
        
        // Create backup data
        const backupData = {
            timestamp: new Date().toISOString(),
            version: config.BOT_VERSION,
            users: await database.getAllUsers(),
            groups: await database.getAllGroups(),
            logs: await database.getLogs('all', 1000),
            settings: await database.getAllSettings()
        };
        
        await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
        
        return backupPath;
    }

    async versionCommand(sock, message, args, from) {
        const packageJson = require('../package.json');
        
        const result = `📦 *Version Information*

🤖 *Bot Version:* ${config.BOT_VERSION || '1.0.0'}
📱 *WhatsApp Web Version:* ${packageJson.dependencies['@whiskeysockets/baileys']}
🟢 *Node.js Version:* ${process.version}
💾 *NPM Version:* ${process.env.npm_version || 'Unknown'}

🔧 *Dependencies:*
• Baileys: ${packageJson.dependencies['@whiskeysockets/baileys']}
• Axios: ${packageJson.dependencies['axios']}
• SQLite3: ${packageJson.dependencies['sqlite3']}

📅 *Last Updated:* ${new Date().toLocaleDateString()}`;

        await sock.sendMessage(from, { text: result });
    }

    async memoryCommand(sock, message, args, from) {
        const memUsage = process.memoryUsage();
        const systemMem = {
            total: os.totalmem(),
            free: os.freemem(),
            used: os.totalmem() - os.freemem()
        };
        
        const result = `🧠 *Memory Information*

🤖 *Bot Memory Usage:*
• RSS: ${helpers.formatBytes(memUsage.rss)}
• Heap Used: ${helpers.formatBytes(memUsage.heapUsed)}
• Heap Total: ${helpers.formatBytes(memUsage.heapTotal)}
• External: ${helpers.formatBytes(memUsage.external)}

🖥️ *System Memory:*
• Total: ${helpers.formatBytes(systemMem.total)}
• Used: ${helpers.formatBytes(systemMem.used)} (${((systemMem.used / systemMem.total) * 100).toFixed(1)}%)
• Free: ${helpers.formatBytes(systemMem.free)} (${((systemMem.free / systemMem.total) * 100).toFixed(1)}%)

📊 *Memory Efficiency:*
• Bot Usage: ${((memUsage.rss / systemMem.total) * 100).toFixed(2)}% of system memory`;

        await sock.sendMessage(from, { text: result });
    }

    async diskCommand(sock, message, args, from) {
        try {
            const stats = await fs.stat('./');
            const botSize = await this.getFolderSize('./');
            
            const result = `💽 *Disk Information*

📁 *Bot Directory:*
• Size: ${helpers.formatBytes(botSize)}
• Location: ${process.cwd()}

🗄️ *Database:*
• File: ${path.resolve('./database.sqlite')}
• Size: ${helpers.formatBytes(await this.getFileSize('./database.sqlite'))}

📋 *Logs:*
• Directory: ${path.resolve('./logs')}
• Size: ${helpers.formatBytes(await this.getFolderSize('./logs'))}

💾 *Backups:*
• Directory: ${path.resolve('./backups')}
• Size: ${helpers.formatBytes(await this.getFolderSize('./backups'))}`;

            await sock.sendMessage(from, { text: result });
            
               } catch (error) {
            await sock.sendMessage(from, {
                text: '❌ Failed to retrieve disk information!'
            });
        }
    }

    async processesCommand(sock, message, args, from) {
        const processes = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        const result = `⚙️ *Process Information*

🔧 *Main Process:*
• PID: ${process.pid}
• Title: ${process.title}
• Version: ${process.version}
• Platform: ${process.platform}
• Architecture: ${process.arch}

⏱️ *CPU Usage:*
• User: ${(cpuUsage.user / 1000000).toFixed(2)}ms
• System: ${(cpuUsage.system / 1000000).toFixed(2)}ms

🧵 *Environment:*
• Node Environment: ${process.env.NODE_ENV || 'development'}
• Working Directory: ${process.cwd()}
• Executable Path: ${process.execPath}

📊 *Resource Limits:*
• Max Old Space: ${(require('v8').getHeapStatistics().heap_size_limit / 1024 / 1024).toFixed(0)}MB
• Total Available: ${(require('v8').getHeapStatistics().total_available_size / 1024 / 1024).toFixed(0)}MB`;

        await sock.sendMessage(from, { text: result });
    }

    async configCommand(sock, message, args, from) {
        if (args.length === 0) {
            // Show current config
            const configInfo = {
                botName: config.BOT_NAME,
                version: config.BOT_VERSION,
                prefix: config.PREFIX,
                maxGroupSize: config.MAX_GROUP_SIZE,
                rateLimitWindow: config.RATE_LIMIT_WINDOW,
                rateLimitMax: config.RATE_LIMIT_MAX,
                logLevel: config.LOG_LEVEL
            };

            let result = `⚙️ *Bot Configuration*\n\n`;
            for (const [key, value] of Object.entries(configInfo)) {
                result += `📋 *${helpers.capitalizeFirst(key)}:* ${value}\n`;
            }
            
            result += `\n💡 *Usage:* .config <setting> <value> to modify`;

            await sock.sendMessage(from, { text: result });
            return;
        }

        const setting = args[0].toLowerCase();
        const value = args.slice(1).join(' ');

        if (!value) {
            await sock.sendMessage(from, {
                text: '❌ Please provide a value for the setting!'
            });
            return;
        }

        try {
            await this.updateConfig(setting, value);
            
            await sock.sendMessage(from, {
                text: `✅ *Configuration Updated*\n\n📋 *Setting:* ${setting}\n🔧 *New Value:* ${value}\n\n⚠️ Some changes may require a restart to take effect.`
            });
            
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ Failed to update configuration: ${error.message}`
            });
        }
    }

    async updateCommand(sock, message, args, from) {
        await sock.sendMessage(from, {
            text: '🔄 *Checking for Updates*\n\n⏳ Please wait...'
        });

        try {
            // Simulate update check (replace with actual update logic)
            const hasUpdate = await this.checkForUpdates();
            
            if (hasUpdate) {
                const result = `🆕 *Update Available*

📦 *Current Version:* ${config.BOT_VERSION || '1.0.0'}
📦 *Latest Version:* ${hasUpdate.version}

📋 *Changes:*
${hasUpdate.changes.map(change => `• ${change}`).join('\n')}

⚠️ *Note:* Manual update required. Please check the repository for update instructions.`;

                await sock.sendMessage(from, { text: result });
            } else {
                await sock.sendMessage(from, {
                    text: '✅ *Bot is Up to Date*\n\n📦 You are running the latest version!'
                });
            }
            
        } catch (error) {
            await sock.sendMessage(from, {
                text: '❌ Failed to check for updates!'
            });
        }
    }

    async maintenanceCommand(sock, message, args, from) {
        const action = args[0]?.toLowerCase();
        
        if (!action) {
            const status = global.maintenanceMode || false;
            
            const result = `🔧 *Maintenance Mode*

🔘 *Current Status:* ${status ? 'Enabled' : 'Disabled'}

*Commands:*
• .maintenance on - Enable maintenance mode
• .maintenance off - Disable maintenance mode
• .maintenance status - Check current status

⚠️ When enabled, only admins can use the bot.`;

            await sock.sendMessage(from, { text: result });
            return;
        }

        switch (action) {
            case 'on':
            case 'enable':
                global.maintenanceMode = true;
                await database.setSetting('maintenance_mode', 'true');
                await sock.sendMessage(from, {
                    text: '🔧 *Maintenance Mode Enabled*\n\n⚠️ Bot is now in maintenance mode. Only admins can use commands.'
                });
                break;

            case 'off':
            case 'disable':
                global.maintenanceMode = false;
                await database.setSetting('maintenance_mode', 'false');
                await sock.sendMessage(from, {
                    text: '✅ *Maintenance Mode Disabled*\n\n🟢 Bot is now available for all users.'
                });
                break;

            case 'status':
                const status = global.maintenanceMode || false;
                await sock.sendMessage(from, {
                    text: `🔧 *Maintenance Status*\n\n🔘 *Current Status:* ${status ? 'Enabled' : 'Disabled'}`
                });
                break;

            default:
                await sock.sendMessage(from, {
                    text: '❌ Invalid maintenance command! Use: on, off, or status'
                });
        }
    }

    // Helper methods
    async getFolderSize(folderPath) {
        try {
            const items = await fs.readdir(folderPath);
            let totalSize = 0;

            for (const item of items) {
                const itemPath = path.join(folderPath, item);
                const stats = await fs.stat(itemPath);
                
                if (stats.isDirectory()) {
                    totalSize += await this.getFolderSize(itemPath);
                } else {
                    totalSize += stats.size;
                }
            }

            return totalSize;
        } catch (error) {
            return 0;
        }
    }

    async getFileSize(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return stats.size;
        } catch (error) {
            return 0;
        }
    }

    async updateConfig(setting, value) {
        // Update configuration in database
        await database.setSetting(`config_${setting}`, value);
        
        // Update runtime config if applicable
        if (config[setting.toUpperCase()]) {
            config[setting.toUpperCase()] = value;
        }
    }

    async checkForUpdates() {
        // Simulate update check - replace with actual GitHub API call
        return new Promise((resolve) => {
            setTimeout(() => {
                // Randomly simulate update availability
                if (Math.random() > 0.7) {
                    resolve({
                        version: '1.1.0',
                        changes: [
                            'Added new fun commands',
                            'Improved system stability',
                            'Fixed memory leaks',
                            'Enhanced security features'
                        ]
                    });
                } else {
                    resolve(false);
                }
            }, 2000);
        });
    }

    getCommandList() {
        return {
            'system': {
                description: 'System administration and monitoring',
                commands: {
                    'ping': 'Check bot response time',
                    'status': 'View bot status and statistics',
                    'uptime': 'Check bot and system uptime',
                    'stats': 'Detailed usage statistics',
                    'logs': 'View system logs (admin only)',
                    'restart': 'Restart the bot (admin only)',
                    'backup': 'Create system backup (admin only)',
                    'version': 'View version information',
                    'memory': 'Check memory usage',
                    'disk': 'View disk usage information',
                    'processes': 'View process information',
                    'config': 'View/modify configuration (admin only)',
                    'update': 'Check for bot updates',
                    'maintenance': 'Toggle maintenance mode (admin only)'
                }
            }
        };
    }
}

module.exports = new SystemCommands();
