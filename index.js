const allCommands = require('./commands');
const db = require('./config/db');
const helpers = require('./config/helpers');
global.botStartTime = Date.now();

const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const fs = require('fs-extra');
const pino = require('pino');

const config = {
    botName: "William Md",
    ownerNumber: "255657126789",
    prefix: ".",
    sessionName: "debug-session"
};

// Kazi ya kupamba maandiko kwa muonekano wa robot
function formatRobotResponse(text) {
    // Ongeza herufi za robot na mchanganyiko wa sauti
    const robotSymbols = ['🤖', '⚡', '🔧', '💻', '🛠️', '⚙️', '🎯', '🎮', '📡', '🚀'];
    const randomSymbol = robotSymbols[Math.floor(Math.random() * robotSymbols.length)];
    
    // Unda muundo wa kipekee wa robot
    const robotHeader = `╔═══════════════════════╗\n║ ${randomSymbol} WILLIAM-MD ROBOT ${randomSymbol} ║\n╚═══════════════════════╝\n\n`;
    
    // Badilisha maandiko yawe na muundo wa robot
    let formattedText = text
        .replace(/\n/g, '\n🔸 ')  // Ongeza alama mbele ya kila mstari
        .replace(/•/g, '⚡')      // Badilisha nukta za kawaida
        .replace(/\*/g, '💫')     // Badilisha nyota
        .replace(/✅/g, '🟢')     // Badilisha alama za mafanikio
        .replace(/❌/g, '🔴');    // Badilisha alama za makosa
    
    // Ongeza footer ya robot
    const robotFooter = `\n\n╭─────────────────────╮\n│ 🤖 POWERED BY AI    │\n│ ⚡ RESPONSE TIME: ${Date.now() % 1000}ms │\n╰─────────────────────╯`;
    
    return `${robotHeader}🔸 ${formattedText}${robotFooter}`;
}

// Kazi ya kuongeza mipangilio ya kiteknolojia
function addTechVibes(text) {
    const techPrefixes = [
        '```SYSTEM OUTPUT```\n',
        '```PROCESSING REQUEST```\n',
        '```AI_RESPONSE_GENERATED```\n',
        '```BOT_PROTOCOL_ACTIVE```\n'
    ];
    
    const randomPrefix = techPrefixes[Math.floor(Math.random() * techPrefixes.length)];
    
    // Ongeza mstari wa nambari za binary (random)
    const binaryLine = Array.from({length: 20}, () => Math.random() > 0.5 ? '1' : '0').join('');
    
    return `${randomPrefix}🔢 ${binaryLine}\n\n${text}\n\n⏱️ TIMESTAMP: ${new Date().toISOString()}\n🔋 STATUS: OPERATIONAL`;
}

console.log('🔍 DEBUGGING VERSION - Starting...');

function getMessageText(message) {
    if (message.conversation) return message.conversation;
    if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
    if (message.imageMessage?.caption) return message.imageMessage.caption;
    if (message.videoMessage?.caption) return message.videoMessage.caption;
    return '';
}

async function startDebugBot() {
    try {
        // const { state, saveCreds } = await useMultiFileAuthState('./debug_auth');
        const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${config.ownerNumber}`);


        const sock = makeWASocket({
            auth: state,
            logger: pino({ level: 'silent' }),
            browser: ["NyumbaChap", "Chrome", "1.0.0"]
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('\n📱 SCAN THIS QR CODE:');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'open') {
                console.log('✅ BOT CONNECTED!');
                try {
                    const startupMessage = formatRobotResponse('WILLIAM-MD ROBOT IS NOW ONLINE AND READY TO SERVE!\n\nSYSTEM STATUS: FULLY OPERATIONAL\nAI ENGINE: ACTIVATED\nCOMMAND PROCESSOR: READY');
                    
                    await sock.sendMessage(config.ownerNumber + '@s.whatsapp.net', {
                        text: addTechVibes(startupMessage)
                    });
                } catch (error) {
                    console.log('❌ Failed to send startup message:', error.message);
                }
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('❌ Connection closed. Reconnecting?', shouldReconnect);
                if (shouldReconnect) setTimeout(startDebugBot, 3000);
            }
        });

        sock.ev.on('messages.upsert', async (msg) => {
            try {
                const message = msg.messages[0];
                if (!message || !message.message) return;

                const from = message.key.remoteJid;
                const messageText = getMessageText(message.message);

                const isCommand = messageText.startsWith(config.prefix);
                if (!isCommand) return;

                const withoutPrefix = messageText.slice(config.prefix.length);
                const trimmed = withoutPrefix.trim();
                const args = trimmed.split(/\s+/);
                const command = args[0].toLowerCase();

                switch (command) {
                    case 'help':
                    case 'menu':
                        try {
                            let helpText = 'COMMAND DATABASE ACCESS GRANTED\n\nAVAILABLE PROTOCOLS:\n\n';
                            for (const [name, cmd] of Object.entries(allCommands)) {
                                helpText += `⚡ .${name} → ${cmd.description || 'Protocol description unavailable'}\n`;
                            }
                            helpText += `\nCOMMAND PREFIX: "${config.prefix}"\nROBOT DESIGNATION: ${config.botName}\nSYSTEM VERSION: 2.0.1`;
                            
                            const formattedHelp = formatRobotResponse(helpText);
                            await sock.sendMessage(from, { text: addTechVibes(formattedHelp) });
                        } catch (error) {
                            console.log('❌ Help error:', error);
                        }
                        break;

                    case 'ping':
                        try {
                            const start = Date.now();
                            const pingResponse = formatRobotResponse('PING PROTOCOL EXECUTED\n\nLATENCY TEST SUCCESSFUL\nCONNECTION STATUS: STABLE');
                            await sock.sendMessage(from, { text: addTechVibes(pingResponse) });
                            const end = Date.now();
                            console.log(`✅ Ping responded in ${end - start}ms`);
                        } catch (error) {
                            console.log('❌ Ping error:', error);
                        }
                        break;

                    case 'test':
                        try {
                            const testResponse = formatRobotResponse('TEST PROTOCOL INITIATED\n\nSYSTEM DIAGNOSTICS: PASSED\nALL MODULES: FUNCTIONAL\nROBOT STATUS: OPERATIONAL');
                            await sock.sendMessage(from, {
                                text: addTechVibes(testResponse)
                            });
                        } catch (error) {
                            console.log('❌ Test error:', error);
                        }
                        break;

                    case 'debug':
                        try {
                            const debugInfo = `DEBUG PROTOCOL ACTIVATED\n\nCOMMAND PARSED: ${command}\nPARAMETERS: ${args.join(' ')}\nORIGIN JID: ${from}\nTIMESTAMP: ${new Date().toLocaleString()}`;
                            const debugResponse = formatRobotResponse(debugInfo);
                            await sock.sendMessage(from, {
                                text: addTechVibes(debugResponse)
                            });
                        } catch (error) {
                            console.log('❌ Debug error:', error);
                        }
                        break;

                    case 'info':
                        try {
                            const infoText = `ROBOT INFORMATION DATABASE\n\nDESIGNATION: ${config.botName}\nOWNER ID: ${config.ownerNumber}\nOPERATIONAL STATUS: ONLINE\nCOMMAND PREFIX: ${config.prefix}\nUPTIME: ${Math.floor((Date.now() - global.botStartTime) / 1000)}s`;
                            const infoResponse = formatRobotResponse(infoText);
                            await sock.sendMessage(from, {
                                text: addTechVibes(infoResponse)
                            });
                        } catch (error) {
                            console.log('❌ Info error:', error);
                        }
                        break;

                    default:
                        if (allCommands[command]) {
                            try {
                                const response = await allCommands[command].execute(sock, message, args, db, helpers);
                                const robotResponse = formatRobotResponse(response);
                                await sock.sendMessage(from, { text: addTechVibes(robotResponse) });
                            } catch (error) {
                                console.log(`❌ Error executing "${command}":`, error);
                                const errorResponse = formatRobotResponse(`COMMAND EXECUTION FAILED\n\nERROR IN PROTOCOL: .${command}\nSYSTEM MESSAGE: UNABLE TO PROCESS REQUEST`);
                                await sock.sendMessage(from, { text: addTechVibes(errorResponse) });
                            }
                        } else {
                            const unknownResponse = formatRobotResponse(`COMMAND NOT RECOGNIZED\n\nUNKNOWN PROTOCOL: .${command}\n\nSUGGESTION: Execute .help for available commands`);
                            await sock.sendMessage(from, {
                                text: addTechVibes(unknownResponse)
                            });
                        }
                        break;
                }
            } catch (error) {
                console.error('❌ Message handler error:', error);
            }
        });

        return sock;
    } catch (error) {
        console.error('❌ Startup error:', error);
        setTimeout(startDebugBot, 5000);
    }
}

process.on('SIGINT', () => {
    console.log('\n🛑 Debug bot shutting down...');
    process.exit(0);
});

console.log('🚀 Starting debug bot...');
startDebugBot().catch(console.error);



module.exports = {
    startBotWithNumber: async function (number, qrCallback) {
        config.ownerNumber = number;

        try {
            const { state, saveCreds } = await useMultiFileAuthState(`./sessions/${number}`);
            const sock = makeWASocket({
                auth: state,
                logger: pino({ level: 'silent' }),
                browser: ["NyumbaChap", "Chrome", "1.0.0"],
                connectTimeoutMs: 60_000 // ⏱️ ongeza muda wa timeout
            });

            sock.ev.on('creds.update', saveCreds);

            let reconnectAttempts = 0;

            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr && qrCallback) {
                    console.log(`🔑 QR code generated for ${number}`);
                    qrCallback(qr);
                }

                if (connection === 'open') {
                    console.log(`✅ BOT CONNECTED for ${number}`);
                    reconnectAttempts = 0;

                    // ⚠️ Chelewesha na ujaribu ku-check kama socket iko ready kabisa
                    setTimeout(async () => {
                        if (!sock.user) {
                            console.log("⚠️ Still not fully connected. Skipping startup message.");
                            return;
                        }

                        try {
                            const startupMessage = formatRobotResponse('WILLIAM-MD ROBOT IS NOW ONLINE...\nSYSTEM STATUS: READY');
                            await sock.sendMessage(`${number}@s.whatsapp.net`, {
                                text: addTechVibes(startupMessage)
                            });
                        } catch (error) {
                            console.log('❌ Failed to send startup message:', error.message);
                        }
                    }, 7000); // ongeza delay hadi 7 sek
                }

                if (connection === 'close') {
                    const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                    console.log('❌ Connection closed. Reconnecting?', shouldReconnect);

                    if (shouldReconnect) {
                        reconnectAttempts += 1;
                        const backoff = Math.min(30000, 5000 * reconnectAttempts); // max 30 sek
                        console.log(`🔁 Reconnecting in ${backoff / 1000} seconds...`);
                        setTimeout(() => {
                            module.exports.startBotWithNumber(number, qrCallback);
                        }, backoff);
                    }
                }
            });

            sock.ev.on('messages.upsert', async (msg) => {
                if (!sock?.user) {
                    console.log('⚠️ Bot not fully connected yet — skipping message.');
                    return;
                }

                try {
                    const message = msg.messages[0];
                    if (!message || !message.message) return;

                    const from = message.key.remoteJid;
                    const messageText = getMessageText(message.message);

                    const isCommand = messageText.startsWith(config.prefix);
                    if (!isCommand) return;

                    const withoutPrefix = messageText.slice(config.prefix.length);
                    const trimmed = withoutPrefix.trim();
                    const args = trimmed.split(/\s+/);
                    const command = args[0].toLowerCase();

                    // Hapa weka logic zako za command kama .help, .info, etc.

                } catch (err) {
                    console.log("❌ Message handler error:", err.message);
                }
            });

        } catch (err) {
            console.error('❌ Failed to start bot:', err.message);
        }
    }
}
