// const helpers = require('../utils/helpers');
// const db = require('../config/database');

const groupCommands = {
    // Promote user to admin
    promote: {
        description: "Promote a user to group admin",
        usage: ".promote @user",
        adminOnly: true,
        groupOnly: true,
        execute: async (sock, msg, args,db, helpers) => {
            if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
                return "❌ Please mention a user to promote!";
            }
            
            const targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            
            try {
                await sock.groupParticipantsUpdate(msg.key.remoteJid, [targetJid], 'promote');
                return `✅ User has been promoted to admin!`;
            } catch (error) {
                return "❌ Failed to promote user! Make sure I'm an admin.";
            }
        }
    },
    
    // Demote admin to member
    demote: {
        description: "Demote a group admin to member",
        usage: ".demote @user",
        adminOnly: true,
        groupOnly: true,
        execute: async (sock, msg, args) => {
            if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
                return "❌ Please mention a user to demote!";
            }
            
            const targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            
            try {
                await sock.groupParticipantsUpdate(msg.key.remoteJid, [targetJid], 'demote');
                return `✅ User has been demoted to member!`;
            } catch (error) {
                return "❌ Failed to demote user! Make sure I'm an admin.";
            }
        }
    },
    
    // Kick user from group
    kick: {
        description: "Remove a user from the group",
        usage: ".kick @user",
        adminOnly: true,
        groupOnly: true,
        execute: async (sock, msg, args) => {
            if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
                return "❌ Please mention a user to kick!";
            }
            
            const targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            
            try {
                await sock.groupParticipantsUpdate(msg.key.remoteJid, [targetJid], 'remove');
                return `✅ User has been removed from the group!`;
            } catch (error) {
                return "❌ Failed to remove user! Make sure I'm an admin.";
            }
        }
    },
    
    // Add user to group
    add: {
        description: "Add a user to the group",
        usage: ".add <phone_number>",
        adminOnly: true,
        groupOnly: true,
        execute: async (sock, msg, args) => {
            if (args.length === 0) {
                return "❌ Please provide a phone number to add!";
            }
            
            let number = args[0].replace(/[^0-9]/g, '');
            if (!number.startsWith('255')) {
                number = '255' + number;
            }
            
            const targetJid = number + '@s.whatsapp.net';
            
            try {
                await sock.groupParticipantsUpdate(msg.key.remoteJid, [targetJid], 'add');
                return `✅ User ${number} has been added to the group!`;
            } catch (error) {
                return "❌ Failed to add user! They might have privacy settings preventing this.";
            }
        }
    },
    
    // Get group info
    groupinfo: {
        description: "Get group information",
        usage: ".groupinfo",
        groupOnly: true,
        execute: async (sock, msg, args) => {
            try {
                const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
                const participants = groupMetadata.participants;
                const admins = participants.filter(p => p.admin).length;
                const members = participants.length - admins;
                const creationDate = new Date(groupMetadata.creation * 1000);
                
                return `📊 *GROUP INFORMATION*\n\n` +
                       `📝 Name: ${groupMetadata.subject}\n` +
                       `👥 Total Members: ${participants.length}\n` +
                       `👑 Admins: ${admins}\n` +
                       `👤 Members: ${members}\n` +
                       `📅 Created: ${creationDate.toLocaleDateString()}\n` +
                       `🆔 Group ID: ${groupMetadata.id}\n` +
                       `📄 Description: ${groupMetadata.desc || 'No description'}`;
            } catch (error) {
                return "❌ Failed to get group information!";
            }
        }
    },
    
    // Tag all members
    tagall: {
        description: "Tag all group members",
        usage: ".tagall [message]",
        adminOnly: true,
        groupOnly: true,
        execute: async (sock, msg, args) => {
            try {
                const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
                const participants = groupMetadata.participants.map(p => p.id);
                
                const message = args.length > 0 ? args.join(' ') : 'Group notification!';
                
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `📢 *GROUP ANNOUNCEMENT*\n\n${message}`,
                    mentions: participants
                });
                
                return null; // Already sent the message
            } catch (error) {
                return "❌ Failed to tag all members!";
            }
        }
    },
    
       // Set group description
    setdesc: {
        description: "Set group description",
        usage: ".setdesc <description>",
        adminOnly: true,
        groupOnly: true,
        execute: async (sock, msg, args) => {
            if (args.length === 0) {
                return "❌ Please provide a description!";
            }
            
            const description = args.join(' ');
            
            try {
                await sock.groupUpdateDescription(msg.key.remoteJid, description);
                return `✅ Group description updated successfully!`;
            } catch (error) {
                return "❌ Failed to update group description! Make sure I'm an admin.";
            }
        }
    },
    
    // Set group name
    setname: {
        description: "Set group name",
        usage: ".setname <name>",
        adminOnly: true,
        groupOnly: true,
        execute: async (sock, msg, args) => {
            if (args.length === 0) {
                return "❌ Please provide a group name!";
            }
            
            const name = args.join(' ');
            
            try {
                await sock.groupUpdateSubject(msg.key.remoteJid, name);
                return `✅ Group name updated to: ${name}`;
            } catch (error) {
                return "❌ Failed to update group name! Make sure I'm an admin.";
            }
        }
    },
    
    // Close group (admins only)
    close: {
        description: "Close group (only admins can send messages)",
        usage: ".close",
        adminOnly: true,
        groupOnly: true,
        execute: async (sock, msg, args) => {
            try {
                await sock.groupSettingUpdate(msg.key.remoteJid, 'announcement');
                return `🔒 Group has been closed! Only admins can send messages now.`;
            } catch (error) {
                return "❌ Failed to close group! Make sure I'm an admin.";
            }
        }
    },
    
    // Open group (everyone can send messages)
    open: {
        description: "Open group (everyone can send messages)",
        usage: ".open",
        adminOnly: true,
        groupOnly: true,
        execute: async (sock, msg, args) => {
            try {
                await sock.groupSettingUpdate(msg.key.remoteJid, 'not_announcement');
                return `🔓 Group has been opened! Everyone can send messages now.`;
            } catch (error) {
                return "❌ Failed to open group! Make sure I'm an admin.";
            }
        }
    },
    
    // Group link
    link: {
        description: "Get group invite link",
        usage: ".link",
        adminOnly: true,
        groupOnly: true,
        execute: async (sock, msg, args) => {
            try {
                const inviteCode = await sock.groupInviteCode(msg.key.remoteJid);
                const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
                
                return `🔗 *GROUP INVITE LINK*\n\n${inviteLink}\n\n⚠️ Share this link carefully!`;
            } catch (error) {
                return "❌ Failed to get group link! Make sure I'm an admin.";
            }
        }
    },
    
    // Revoke group link
    revoke: {
        description: "Revoke group invite link",
        usage: ".revoke",
        adminOnly: true,
        groupOnly: true,
        execute: async (sock, msg, args) => {
            try {
                await sock.groupRevokeInvite(msg.key.remoteJid);
                return `✅ Group invite link has been revoked! Old links will no longer work.`;
            } catch (error) {
                return "❌ Failed to revoke group link! Make sure I'm an admin.";
            }
        }
    },
    
    // List group admins
    admins: {
        description: "List all group admins",
        usage: ".admins",
        groupOnly: true,
        execute: async (sock, msg, args) => {
            try {
                const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
                const admins = groupMetadata.participants.filter(p => p.admin);
                
                if (admins.length === 0) {
                    return "❌ No admins found in this group!";
                }
                
                let adminList = "👑 *GROUP ADMINS*\n\n";
                admins.forEach((admin, index) => {
                    const number = admin.id.split('@')[0];
                    const role = admin.admin === 'superadmin' ? '👑 Owner' : '🛡️ Admin';
                    adminList += `${index + 1}. ${role} +${number}\n`;
                });
                
                return adminList;
            } catch (error) {
                return "❌ Failed to get admin list!";
            }
        }
    },
    
    // Mute user (remove and add back)
    mute: {
        description: "Temporarily mute a user",
        usage: ".mute @user",
        adminOnly: true,
        groupOnly: true,
        execute: async (sock, msg, args) => {
            if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
                return "❌ Please mention a user to mute!";
            }
            
            const targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            const targetNumber = targetJid.split('@')[0];
            
            // Save mute status to database
            await db.saveUser(targetNumber, { 
                isMuted: true, 
                mutedAt: Date.now(),
                mutedBy: msg.key.participant || msg.key.remoteJid
            });
            
            return `🔇 User has been muted! They cannot use bot commands for 30 minutes.`;
        }
    },
    
    // Unmute user
    unmute: {
        description: "Unmute a user",
        usage: ".unmute @user",
        adminOnly: true,
        groupOnly: true,
        execute: async (sock, msg, args) => {
            if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
                return "❌ Please mention a user to unmute!";
            }
            
            const targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            const targetNumber = targetJid.split('@')[0];
            
            // Remove mute status from database
            await db.saveUser(targetNumber, { 
                isMuted: false, 
                mutedAt: null,
                mutedBy: null
            });
            
            return `🔊 User has been unmuted! They can now use bot commands.`;
        }
    }
};

module.exports = groupCommands;
