// const helpers = require('../utils/helpers');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const mediaCommands = {
    // Text to speech
    tts: {
        description: "Convert text to speech",
        usage: ".tts <text>",
        execute: async (sock, msg, args,db, helpers) => {
            if (args.length === 0) {
                return "❌ Please provide text to convert to speech!";
            }
            
            try {
                const text = args.join(' ');
                
                // Using Google TTS API (demo - replace with actual implementation)
                const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(text)}`;
                
                const response = await axios.get(ttsUrl, { responseType: 'arraybuffer' });
                const audioBuffer = Buffer.from(response.data);
                
                await sock.sendMessage(msg.key.remoteJid, {
                    audio: audioBuffer,
                    mimetype: 'audio/mpeg',
                    caption: `🔊 *TEXT TO SPEECH*\n\n📝 Text: ${text}`
                });
                
                return null; // Already sent the audio
            } catch (error) {
                return "❌ Failed to generate speech! Please try again.";
            }
        }
    },
    
    // Generate meme
    meme: {
        description: "Generate a meme with custom text",
        usage: ".meme <top_text> | <bottom_text>",
        execute: async (sock, msg, args,db, helpers) => {
            if (args.length === 0) {
                return "❌ Please provide meme text!\n\n📝 Example: .meme When you code | But it works first try";
            }
            
            const text = args.join(' ');
            const [topText, bottomText] = text.split('|').map(t => t.trim());
            
            if (!topText || !bottomText) {
                return "❌ Please separate top and bottom text with '|'\n\n📝 Example: .meme Top text | Bottom text";
            }
            
            try {
                // Using imgflip API (demo - requires actual API key)
                const memeTemplates = [
                    '181913649', // Drake meme
                    '87743020',  // Two buttons
                    '129242436', // Change my mind
                    '222403160', // Bernie meme
                    '131087935'  // Running away balloon
                ];
                
                const templateId = helpers.randomChoice(memeTemplates);
                
                return `🎭 *MEME GENERATOR*\n\n` +
                       `📝 Top: ${topText}\n` +
                       `📝 Bottom: ${bottomText}\n\n` +
                       `🎨 Meme generated! (Demo response)\n` +
                       `_In production, this would generate an actual meme image_`;
                       
            } catch (error) {
                return "❌ Failed to generate meme! Please try again.";
            }
        }
    },
    
    // Image filters
    filter: {
        description: "Apply filters to images",
        usage: ".filter <filter_name> (reply to image)",
        execute: async (sock, msg, args,db, helpers) => {
            if (args.length === 0) {
                return "❌ Please specify a filter!\n\n✅ Available: blur, sepia, invert, grayscale";
            }
            
            const filter = args[0].toLowerCase();
            const availableFilters = ['blur', 'sepia', 'invert', 'grayscale', 'vintage', 'brightness'];
            
            if (!availableFilters.includes(filter)) {
                return `❌ Invalid filter!\n\n✅ Available: ${availableFilters.join(', ')}`;
            }
            
            // Check if replying to an image
            if (!msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
                return "❌ Please reply to an image to apply the filter!";
            }
            
            try {
                return `🎨 *IMAGE FILTER*\n\n` +
                       `🖼️ Filter: ${filter}\n` +
                       `⏳ Processing image...\n\n` +
                       `_In production, this would process the actual image_`;
                       
            } catch (error) {
                return "❌ Failed to apply filter! Please try again.";
            }
        }
    },
    
    // Image information
    imginfo: {
        description: "Get image information",
        usage: ".imginfo (reply to image)",
        execute: async (sock, msg, args,db, helpers) => {
            if (!msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
                return "❌ Please reply to an image!";
            }
            
            try {
                const imageMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
                
                return `📸 *IMAGE INFORMATION*\n\n` +
                       `📏 Width: ${imageMsg.width || 'Unknown'}px\n` +
                       `📐 Height: ${imageMsg.height || 'Unknown'}px\n` +
                       `💾 File Size: ${helpers.formatBytes(imageMsg.fileLength || 0)}\n` +
                       `🔗 MIME Type: ${imageMsg.mimetype || 'Unknown'}\n` +
                       `📅 Upload Time: ${new Date().toLocaleString()}`;
                       
            } catch (error) {
                return "❌ Failed to get image information!";
            }
        }
    },
    
    // Sticker maker
    sticker: {
        description: "Convert image to sticker",
        usage: ".sticker (reply to image)",
        execute: async (sock, msg, args,db, helpers) => {
            if (!msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
                return "❌ Please reply to an image to convert to sticker!";
            }
            
            try {
                // In production, you would:
                // 1. Download the image
                // 2. Convert to WebP format
                // 3. Resize to 512x512
                // 4. Send as sticker
                
                return `🎭 *STICKER MAKER*\n\n` +
                       `⏳ Converting image to sticker...\n` +
                       `📏 Resizing to 512x512\n` +
                       `🔄 Converting to WebP format\n\n` +
                       `_In production, this would create an actual sticker_`;
                       
            } catch (error) {
                return "❌ Failed to create sticker! Please try again.";
            }
        }
    },
    
    // Audio information
    audioinfo: {
        description: "Get audio file information",
        usage: ".audioinfo (reply to audio)",
        execute: async (sock, msg, args,db, helpers) => {
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            
            if (!quotedMsg?.audioMessage && !quotedMsg?.voiceMessage) {
                return "❌ Please reply to an audio file or voice message!";
            }
            
            try {
                const audioMsg = quotedMsg.audioMessage || quotedMsg.voiceMessage;
                const duration = audioMsg.seconds || 0;
                const minutes = Math.floor(duration / 60);
                const seconds = duration % 60;
                
                return `🎵 *AUDIO INFORMATION*\n\n` +
                       `⏱️ Duration: ${minutes}:${seconds.toString().padStart(2, '0')}\n` +
                       `💾 File Size: ${helpers.formatBytes(audioMsg.fileLength || 0)}\n` +
                       `🔗 MIME Type: ${audioMsg.mimetype || 'Unknown'}\n` +
                       `🎤 Type: ${quotedMsg.voiceMessage ? 'Voice Message' : 'Audio File'}\n` +
                       `📅 Received: ${new Date().toLocaleString()}`;
                       
            } catch (error) {
                return "❌ Failed to get audio information!";
            }
        }
    },
    
       // YouTube search (demo)
    ytmusic: {
        description: "Search for music on YouTube",
        usage: ".ytmusic <song name>",
        execute: async (sock, msg, args,db, helpers) => {
            if (args.length === 0) {
                return "❌ Please provide a song name to search!";
            }
            
            const query = args.join(' ');
            
            try {
                // Demo response - in production, integrate with YouTube API
                const demoResults = [
                    {
                        title: `${query} - Official Music Video`,
                        duration: "3:45",
                        views: "1.2M views",
                        channel: "Artist Official"
                    },
                    {
                        title: `${query} (Lyrics)`,
                        duration: "3:42",
                        views: "850K views", 
                        channel: "Lyrics Channel"
                    },
                    {
                        title: `${query} - Live Performance`,
                        duration: "4:12",
                        views: "520K views",
                        channel: "Concert TV"
                    }
                ];
                
                let result = `🎵 *YOUTUBE MUSIC SEARCH*\n\n🔍 Query: ${query}\n\n`;
                
                demoResults.forEach((song, index) => {
                    result += `${index + 1}. *${song.title}*\n`;
                    result += `   ⏱️ ${song.duration} | 👁️ ${song.views}\n`;
                    result += `   📺 ${song.channel}\n\n`;
                });
                
                result += `_Reply with number to download (Demo)_`;
                
                return result;
                
            } catch (error) {
                return "❌ Failed to search YouTube! Please try again.";
            }
        }
    },
    
    // Image search
    image: {
        description: "Search for images",
        usage: ".image <query>",
        execute: async (sock, msg, args,db, helpers) => {
            if (args.length === 0) {
                return "❌ Please provide a search query!";
            }
            
            const query = args.join(' ');
            
            try {
                // Demo response - in production, use proper image search API
                return `🖼️ *IMAGE SEARCH*\n\n` +
                       `🔍 Query: ${query}\n` +
                       `📊 Found: 1,000+ results\n\n` +
                       `⏳ Fetching random image...\n\n` +
                       `_In production, this would send actual images from search results_`;
                       
            } catch (error) {
                return "❌ Failed to search images! Please try again.";
            }
        }
    },
    
    // Video to GIF converter
    gif: {
        description: "Convert video to GIF",
        usage: ".gif [start_time] [duration] (reply to video)",
        execute: async (sock, msg, args,db, helpers) => {
            if (!msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage) {
                return "❌ Please reply to a video to convert to GIF!";
            }
            
            const startTime = args[0] ? parseInt(args[0]) : 0;
            const duration = args[1] ? parseInt(args[1]) : 5;
            
            if (duration > 10) {
                return "❌ Maximum GIF duration is 10 seconds!";
            }
            
            try {
                return `🎬 *VIDEO TO GIF*\n\n` +
                       `⏱️ Start Time: ${startTime}s\n` +
                       `⏳ Duration: ${duration}s\n` +
                       `🔄 Converting video to GIF...\n\n` +
                       `_In production, this would process the actual video_`;
                       
            } catch (error) {
                return "❌ Failed to convert video! Please try again.";
            }
        }
    },
    
    // Audio speed changer
    speed: {
        description: "Change audio playback speed",
        usage: ".speed <multiplier> (reply to audio)",
        execute: async (sock, msg, args,db, helpers) => {
            if (!msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.audioMessage) {
                return "❌ Please reply to an audio file!";
            }
            
            if (args.length === 0) {
                return "❌ Please provide speed multiplier!\n\n📝 Example: .speed 1.5 (1.5x faster)\n📝 Range: 0.5 - 2.0";
            }
            
            const speed = parseFloat(args[0]);
            
            if (isNaN(speed) || speed < 0.5 || speed > 2.0) {
                return "❌ Speed must be between 0.5 and 2.0!";
            }
            
            try {
                return `🎵 *AUDIO SPEED CHANGER*\n\n` +
                       `⚡ Speed: ${speed}x\n` +
                       `🔄 Processing audio...\n\n` +
                       `_In production, this would modify the actual audio file_`;
                       
            } catch (error) {
                return "❌ Failed to change audio speed! Please try again.";
            }
        }
    },
    
    // Compress image
    compress: {
        description: "Compress image file",
        usage: ".compress [quality] (reply to image)",
        execute: async (sock, msg, args,db, helpers) => {
            if (!msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
                return "❌ Please reply to an image to compress!";
            }
            
            const quality = args[0] ? parseInt(args[0]) : 80;
            
            if (quality < 10 || quality > 100) {
                return "❌ Quality must be between 10 and 100!";
            }
            
            try {
                const originalSize = msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage.fileLength || 0;
                const estimatedSize = Math.floor(originalSize * (quality / 100));
                
                return `🗜️ *IMAGE COMPRESSOR*\n\n` +
                       `📊 Quality: ${quality}%\n` +
                       `📏 Original Size: ${helpers.formatBytes(originalSize)}\n` +
                       `📉 Estimated Size: ${helpers.formatBytes(estimatedSize)}\n` +
                       `🔄 Compressing image...\n\n` +
                       `_In production, this would compress the actual image_`;
                       
            } catch (error) {
                return "❌ Failed to compress image! Please try again.";
            }
        }
    },
    
    // Create thumbnail
    thumbnail: {
        description: "Create thumbnail from video",
        usage: ".thumbnail [timestamp] (reply to video)",
        execute: async (sock, msg, args,db, helpers) => {
            if (!msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage) {
                return "❌ Please reply to a video!";
            }
            
            const timestamp = args[0] ? args[0] : "00:00:01";
            
            try {
                return `🖼️ *THUMBNAIL GENERATOR*\n\n` +
                       `⏱️ Timestamp: ${timestamp}\n` +
                       `🎬 Extracting frame from video...\n` +
                       `🖼️ Creating thumbnail...\n\n` +
                       `_In production, this would extract an actual frame_`;
                       
            } catch (error) {
                return "❌ Failed to create thumbnail! Please try again.";
            }
        }
    }
};

module.exports = mediaCommands;
