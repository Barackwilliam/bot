
// const startFormatted = stats.botStartTime 
//     ? moment(stats.botStartTime).format('DD/MM/YYYY HH:mm')
//     : 'Unavailable';

const moment = require('moment');


const adminCommands = {
    // Ban user from using bot
    ban: {
        description: "Ban a user from using the bot",
        usage: ".ban @user",
        adminOnly: true,
        execute: async (sock, msg, args,db, helpers) => {
            if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
                return "❌ Please mention a user to ban!";
            }
            
            const targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            const targetNumber = helpers.extractNumber(targetJid);
            
            if (helpers.isAdmin(targetJid)) {
                return "❌ Cannot ban an admin!";
            }
            
            await db.saveUser(targetNumber, { banned: true, bannedAt: Date.now() });
            return `✅ User @${targetNumber} has been banned from using the bot!`;
        }
    },
    
    // Unban user
    unban: {
        description: "Unban a user",
        usage: ".unban @user",
        adminOnly: true,
        execute: async (sock, msg, args,db, helpers) => {
            if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
                return "❌ Please mention a user to unban!";
            }
            
            const targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            const targetNumber = helpers.extractNumber(targetJid);
            
            await db.saveUser(targetNumber, { banned: false, unbannedAt: Date.now() });
            return `✅ User @${targetNumber} has been unbanned!`;
        }
    },
    
    // Broadcast message to all users
    broadcast: {
        description: "Broadcast a message to all users",
        usage: ".broadcast <message>",
        ownerOnly: true,
        execute: async (sock, msg, args,db, helpers) => {
            if (args.length === 0) {
                return "❌ Please provide a message to broadcast!";
            }
            
            const message = args.join(' ');
            const users = await db.getUsers();
            const userIds = Object.keys(users);
            
            let sent = 0;
            let failed = 0;
            
            for (const userId of userIds) {
                try {
                    await sock.sendMessage(userId + '@s.whatsapp.net', {
                        text: `📢 *BROADCAST MESSAGE*\n\n${message}\n\n_This message was sent to all bot users_`
                    });
                    sent++;
                    await helpers.sleep(1000); // Avoid spam
                } catch (error) {
                    failed++;
                }
            }
            
            return `📢 Broadcast completed!\n✅ Sent: ${sent}\n❌ Failed: ${failed}`;
        }
    },
    
    // Get bot statistics
    // stats: {
    //     description: "Get detailed bot statistics",
    //     usage: ".stats",
    //     adminOnly: true,
    //     execute: async (sock, msg, args,db, helpers) => {
    //         const stats = await db.getStats();
    //         const users = await db.getUsers();
    //         const totalUsers = Object.keys(users).length;
    //         const activeUsers = Object.values(users).filter(u => 
    //             Date.now() - u.lastSeen < 24 * 60 * 60 * 1000
    //         ).length;
    //         const bannedUsers = Object.values(users).filter(u => u.banned).length;
    //         const uptime = helpers.formatTime(Date.now() - stats.botStartTime);
            
    //         return `📊 *BOT STATISTICS*\n\n` +
    //                `👥 Total Users: ${totalUsers}\n` +
    //                `🟢 Active Users (24h): ${activeUsers}\n` +
    //                `🔴 Banned Users: ${bannedUsers}\n` +
    //                `⚡ Total Commands: ${stats.totalCommands || 0}\n` +
    //                `⏱️ Uptime: ${uptime}\n` +
    //             //    `🤖 Bot Version: 2.0.0` 
    //                `📅 Started: ${moment(stats.botStartTime).format('DD/MM/YYYY HH:mm')}`;
    //     }
    // },


    stats: {
    description: "Get detailed bot statistics",
    usage: ".stats",
    adminOnly: true,
    execute: async (sock, msg, args, db, helpers) => {
        const stats = await db.getStats();
        const totalUsers = stats.totalUsers || 0;
        const activeUsers = 0; // unaweza kuongeza logic ya active users
        const bannedUsers = stats.bannedUsers || 0;

        const uptime = helpers.formatTime(Date.now() - (stats.botStartTime || global.botStartTime || Date.now()));

        // const startFormatted = stats.botStartTime
        //     ? moment(stats.botStartTime).format('DD/MM/YYYY HH:mm')
        //     : 'Unavailable';

        const startFormatted = stats.botStartTime 
    ? moment(stats.botStartTime).format('DD/MM/YYYY HH:mm')
    : 'Unavailable';


        return `📊 *BOT STATISTICS*\n\n` +
               `👥 Total Users: ${totalUsers}\n` +
               `🟢 Active Users (24h): ${activeUsers}\n` +
               `🔴 Banned Users: ${bannedUsers}\n` +
               `⚡ Total Commands: ${stats.totalCommands || 0}\n` +
               `⏱️ Uptime: ${uptime}\n` +
               `📅 Started: ${startFormatted}`;
    }
    },

    
    // Execute system commands (DANGEROUS - Owner only)
    exec: {
        description: "Execute system command",
        usage: ".exec <command>",
        ownerOnly: true,
        execute: async (sock, msg, args,db, helpers) => {
            if (args.length === 0) {
                return "❌ Please provide a command to execute!";
            }
            
            const { exec } = require('child_process');
            const command = args.join(' ');
            
            return new Promise((resolve) => {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        resolve(`❌ Error:\n${error.message}`);
                        return;
                    }
                    if (stderr) {
                        resolve(`⚠️ Warning:\n${stderr}`);
                        return;
                    }
                    resolve(`✅ Output:\n${stdout || 'Command executed successfully'}`);
                });
            });
        }
    },
    
    // Add/Remove admins
    addadmin: {
        description: "Add a new admin",
        usage: ".addadmin @user",
        ownerOnly: true,
        execute: async (sock, msg, args,db, helpers) => {
            if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
                return "❌ Please mention a user to make admin!";
            }
            
            const targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            const targetNumber = helpers.extractNumber(targetJid);
            
            if (!config.admins.includes(targetNumber)) {
                config.admins.push(targetNumber);
                await db.saveUser(targetNumber, { isAdmin: true, adminSince: Date.now() });
                return `✅ @${targetNumber} is now an admin!`;
            } else {
                return `❌ @${targetNumber} is already an admin!`;
            }
        }
    }
};

module.exports = adminCommands;
                                                    