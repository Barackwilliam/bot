const fs = require('fs-extra');
const axios = require('axios');
// const helpers = require('../utils/helpers');
// const logger = require('../utils/logger');
// const database = require('../config/database');

class UtilityCommands {
    constructor() {
        this.commands = [
            'weather', 'translate', 'qr', 'shorturl', 'ping', 'info',
            'time', 'calc', 'search', 'wiki', 'joke', 'quote',
            'base64encode', 'base64decode', 'hash', 'uuid'
        ];
    }

    async handle(sock, message, command, args, from) {
        try {
            switch (command) {
                case 'weather':
                    await this.weatherCommand(sock, message, args, from);
                    break;
                    
                case 'translate':
                    await this.translateCommand(sock, message, args, from);
                    break;
                    
                case 'qr':
                    await this.qrCommand(sock, message, args, from);
                    break;
                    
                case 'shorturl':
                    await this.shorturlCommand(sock, message, args, from);
                    break;
                    
                case 'info':
                    await this.infoCommand(sock, message, args, from);
                    break;
                    
                case 'time':
                    await this.timeCommand(sock, message, args, from);
                    break;
                    
                case 'calc':
                    await this.calcCommand(sock, message, args, from);
                    break;
                    
                case 'search':
                    await this.searchCommand(sock, message, args, from);
                    break;
                    
                case 'wiki':
                    await this.wikiCommand(sock, message, args, from);
                    break;
                    
                case 'joke':
                    await this.jokeCommand(sock, message, args, from);
                    break;
                    
                case 'quote':
                    await this.quoteCommand(sock, message, args, from);
                    break;
                    
                case 'base64encode':
                    await this.base64EncodeCommand(sock, message, args, from);
                    break;
                    
                case 'base64decode':
                    await this.base64DecodeCommand(sock, message, args, from);
                    break;
                    
                case 'hash':
                    await this.hashCommand(sock, message, args, from);
                    break;
                    
                case 'uuid':
                    await this.uuidCommand(sock, message, args, from);
                    break;
                    
                default:
                    await sock.sendMessage(from, {
                        text: '❌ Unknown utility command!'
                    });
            }
            
            // Log command usage
            await database.addLog({
                type: 'command',
                message: `Utility command: ${command}`,
                userId: helpers.extractNumber(from),
                command: command
            });
            
        } catch (error) {
            logger.error('❌ Error in utility command:', error);
            await sock.sendMessage(from, {
                text: '❌ An error occurred while processing your request.'
            });
        }
    }

    async weatherCommand(sock, message, args, from) {
        if (args.length === 0) {
            await sock.sendMessage(from, {
                text: '❌ Please provide a city name!\n\nExample: .weather nairobi'
            });
            return;
        }

        const city = args.join(' ');
        
        try {
            // Using free weather API (replace with your API key)
            const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=YOUR_API_KEY&units=metric`);
            const data = response.data;
            
                       const weatherText = `🌤️ *Weather in ${data.name}, ${data.sys.country}*

🌡️ *Temperature:* ${data.main.temp}°C (feels like ${data.main.feels_like}°C)
📊 *Condition:* ${helpers.capitalizeFirst(data.weather[0].description)}
💨 *Wind:* ${data.wind.speed} m/s
💧 *Humidity:* ${data.main.humidity}%
🔽 *Pressure:* ${data.main.pressure} hPa
👁️ *Visibility:* ${data.visibility / 1000} km

🌅 *Sunrise:* ${new Date(data.sys.sunrise * 1000).toLocaleTimeString()}
🌇 *Sunset:* ${new Date(data.sys.sunset * 1000).toLocaleTimeString()}`;

            await sock.sendMessage(from, { text: weatherText });
            
        } catch (error) {
            if (error.response?.status === 404) {
                await sock.sendMessage(from, {
                    text: '❌ City not found! Please check the spelling and try again.'
                });
            } else {
                await sock.sendMessage(from, {
                    text: '❌ Weather service temporarily unavailable. Please try again later.'
                });
            }
        }
    }

    async translateCommand(sock, message, args, from) {
        if (args.length < 2) {
            await sock.sendMessage(from, {
                text: `❌ Usage: .translate <target_language> <text>

*Examples:*
• .translate spanish Hello world
• .translate sw How are you?
• .translate fr Good morning

*Common language codes:*
en - English, sw - Swahili, fr - French, es - Spanish, de - German, ar - Arabic`
            });
            return;
        }

        const targetLang = args[0].toLowerCase();
        const textToTranslate = args.slice(1).join(' ');

        try {
            // Using Google Translate API (free tier)
            const response = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`);
            
            const translatedText = response.data[0][0][0];
            const detectedLang = response.data[2];

            const result = `🌐 *Translation Result*

📝 *Original:* ${textToTranslate}
🔍 *Detected Language:* ${detectedLang || 'Auto'}
🎯 *Target Language:* ${targetLang.toUpperCase()}
✅ *Translation:* ${translatedText}`;

            await sock.sendMessage(from, { text: result });

        } catch (error) {
            await sock.sendMessage(from, {
                text: '❌ Translation failed! Please check the language code and try again.'
            });
        }
    }

    async qrCommand(sock, message, args, from) {
        if (args.length === 0) {
            await sock.sendMessage(from, {
                text: '❌ Please provide text to generate QR code!\n\nExample: .qr https://github.com'
            });
            return;
        }

        const text = args.join(' ');
        
        try {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
            
            const response = await axios.get(qrUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);

            await sock.sendMessage(from, {
                image: buffer,
                caption: `📱 *QR Code Generated*\n\n📝 *Content:* ${helpers.truncateText(text, 100)}`
            });

        } catch (error) {
            await sock.sendMessage(from, {
                text: '❌ Failed to generate QR code!'
            });
        }
    }

    async shorturlCommand(sock, message, args, from) {
        if (args.length === 0) {
            await sock.sendMessage(from, {
                text: '❌ Please provide a URL to shorten!\n\nExample: .shorturl https://www.example.com'
            });
            return;
        }

        const url = args[0];
        
        if (!helpers.isValidUrl(url)) {
            await sock.sendMessage(from, {
                text: '❌ Please provide a valid URL!'
            });
            return;
        }

        try {
            // Using TinyURL API
            const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
            const shortUrl = response.data;

            const result = `🔗 *URL Shortened Successfully*

📝 *Original URL:* ${helpers.truncateText(url, 50)}
✂️ *Short URL:* ${shortUrl}
📊 *Saved Characters:* ${url.length - shortUrl.length}`;

            await sock.sendMessage(from, { text: result });

        } catch (error) {
            await sock.sendMessage(from, {
                text: '❌ Failed to shorten URL! Please try again.'
            });
        }
    }

    async infoCommand(sock, message, args, from) {
        const user = await database.getUser(helpers.extractNumber(from));
        const stats = await database.getStats();
        const memoryUsage = helpers.getMemoryUsage();
        const uptime = helpers.formatUptime(Date.now() - process.uptime() * 1000);

        const info = `ℹ️ *Bot Information*

🤖 *Bot Name:* Enhanced WhatsApp Bot
📱 *Version:* 2.0.0
⚡ *Status:* Online & Active
🕒 *Uptime:* ${uptime}

📊 *Statistics:*
👥 Total Users: ${stats.totalUsers}
👥 Total Groups: ${stats.totalGroups}
💬 Total Messages: ${stats.totalMessages}
⚙️ Total Commands: ${stats.totalCommands}

💾 *Memory Usage:*
📈 Heap Used: ${memoryUsage.heapUsed}
📊 Heap Total: ${memoryUsage.heapTotal}
🔄 RSS: ${memoryUsage.rss}

👤 *Your Stats:*
📝 Messages: ${user?.messageCount || 0}
⚙️ Commands: ${user?.commandCount || 0}
🕒 First Seen: ${user ? helpers.formatTime(user.firstSeen) : 'Now'}`;

        await sock.sendMessage(from, { text: info });
    }

    async timeCommand(sock, message, args, from) {
        if (args.length === 0) {
            const now = new Date();
            const result = `🕒 *Current Time*

🌍 *UTC:* ${now.toUTCString()}
📅 *Local:* ${now.toLocaleString()}
📆 *Date:* ${now.toDateString()}
⏰ *Time:* ${now.toLocaleTimeString()}
📊 *Timestamp:* ${now.getTime()}`;

            await sock.sendMessage(from, { text: result });
            return;
        }

        const timezone = args[0];
        
        try {
            const now = new Date();
            const options = { 
                timeZone: timezone,
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            };
            
            const timeInZone = now.toLocaleString('en-US', options);
            
            const result = `🕒 *Time in ${timezone}*

📅 *Date & Time:* ${timeInZone}
🌍 *Timezone:* ${timezone}`;

            await sock.sendMessage(from, { text: result });

        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ Invalid timezone! 

*Examples:*
• .time Africa/Nairobi
• .time America/New_York
• .time Europe/London
• .time Asia/Tokyo`
            });
        }
    }

    async calcCommand(sock, message, args, from) {
        if (args.length === 0) {
            await sock.sendMessage(from, {
                text: `🧮 *Calculator*

*Usage:* .calc <expression>

*Examples:*
• .calc 2 + 2
• .calc 10 * 5 - 3
• .calc sqrt(16)
• .calc pow(2, 3)
• .calc sin(90)

*Supported functions:*
sqrt, pow, sin, cos, tan, log, abs, round, ceil, floor`
            });
            return;
        }

        const expression = args.join(' ');
        
        try {
            // Safely evaluate mathematical expressions
            const allowedChars = /^[0-9+\-*/.() \s,sqrtpowsincoatbslgroundceflx]+$/;
            
            if (!allowedChars.test(expression.toLowerCase())) {
                await sock.sendMessage(from, {
                    text: '❌ Invalid characters in expression!'
                });
                return;
            }

            // Replace function names with Math object calls
            let safeExpression = expression
                .replace(/sqrt/g, 'Math.sqrt')
                .replace(/pow/g, 'Math.pow')
                .replace(/sin/g, 'Math.sin')
                .replace(/cos/g, 'Math.cos')
                .replace(/tan/g, 'Math.tan')
                .replace(/log/g, 'Math.log')
                .replace(/abs/g, 'Math.abs')
                .replace(/round/g, 'Math.round')
                .replace(/ceil/g, 'Math.ceil')
                .replace(/floor/g, 'Math.floor');

            const result = Function('"use strict"; return (' + safeExpression + ')')();
            
            const output = `🧮 *Calculation Result*

📝 *Expression:* ${expression}
✅ *Result:* ${result}`;

            await sock.sendMessage(from, { text: output });

        } catch (error) {
            await sock.sendMessage(from, {
                text: '❌ Invalid mathematical expression!'
            });
        }
    }

    async searchCommand(sock, message, args, from) {
        if (args.length === 0) {
            await sock.sendMessage(from, {
                text: '❌ Please provide search terms!\n\nExample: .search artificial intelligence'
            });
            return;
        }

        const query = args.join(' ');
        
        try {
            // Using DuckDuckGo Instant Answer API
            const response = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
            const data = response.data;

            if (data.AbstractText) {
                const result = `🔍 *Search Results for "${query}"*

📄 *Summary:* ${data.AbstractText}
🔗 *Source:* ${data.AbstractURL || 'DuckDuckGo'}`;

                await sock.sendMessage(from, { text: result });
            } else {
                const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
                await sock.sendMessage(from, {
                    text: `🔍 *Search Results*\n\nNo instant answer available for "${query}"\n\n🌐 *Search manually:* ${searchUrl}`
                });
            }

        } catch (error) {
            const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
            await sock.sendMessage(from, {
                text: `🔍 *Search "${query}"*\n\n🌐 *Search URL:* ${searchUrl}`
            });
        }
    }

    async wikiCommand(sock, message, args, from) {
        if (args.length === 0) {
            await sock.sendMessage(from, {
                text: '❌ Please provide a topic to search!\n\nExample: .wiki artificial intelligence'
            });
            return;
        }

        const topic = args.join(' ');
        
        try {
            const response = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`);
            const data = response.data;

            if (data.type === 'standard') {
                const result = `📖 *Wikipedia: ${data.title}*

📝 *Summary:* ${helpers.truncateText(data.extract, 500)}

🔗 *Read more:* ${data.content_urls.desktop.page}`;

                await sock.sendMessage(from, { text: result });
            } else {
                await sock.sendMessage(from, {
                    text: `❌ Article "${topic}" not found on Wikipedia!`
                });
            }

        } catch (error) {
            await sock.sendMessage(from, {
                text: '❌ Failed to fetch Wikipedia article!'
            });
        }
    }

    async jokeCommand(sock, message, args, from) {
        try {
            const response = await axios.get('https://official-joke-api.appspot.com/random_joke');
            const joke = response.data;

            const result = `😂 *Random Joke*

${joke.setup}

${joke.punchline} 🤣`;

            await sock.sendMessage(from, { text: result });

        } catch (error) {
            const fallbackJokes = [
                "Why don't scientists trust atoms? Because they make up everything!",
                "Why did the scarecrow win an award? He was outstanding in his field!",
                "Why don't eggs tell jokes? They'd crack each other up!",
                "What do you call a fake noodle? An impasta!",
                "Why did the math book look so sad? Because it was full of problems!"
            ];
            
            const randomJoke = helpers.getRandomElement(fallbackJokes);
            await sock.sendMessage(from, {
                text: `😂 *Random Joke*\n\n${randomJoke}`
            });
        }
    }

    async quoteCommand(sock, message, args, from) {
        try {
            const response = await axios.get('https://api.quotable.io/random');
            const quote = response.data;

            const result = `💭 *Inspirational Quote*

"${quote.content}"

— *${quote.author}*`;

            await sock.sendMessage(from, { text: result });

        } catch (error) {
            const fallbackQuotes = [
                { content: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
                { content: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
                { content: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
                { content: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
                { content: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" }
            ];
            
            const randomQuote = helpers.getRandomElement(fallbackQuotes);
            await sock.sendMessage(from, {
                text: `💭 *Inspirational Quote*\n\n"${randomQuote.content}"\n\n— *${randomQuote.author}*`
            });
        }
    }

       async base64EncodeCommand(sock, message, args, from) {
        if (args.length === 0) {
            await sock.sendMessage(from, {
                text: '❌ Please provide text to encode!\n\nExample: .base64encode Hello World'
            });
            return;
        }

        const text = args.join(' ');
        const encoded = Buffer.from(text, 'utf8').toString('base64');

        const result = `🔐 *Base64 Encode*

📝 *Original:* ${text}
🔒 *Encoded:* ${encoded}`;

        await sock.sendMessage(from, { text: result });
    }

    async base64DecodeCommand(sock, message, args, from) {
        if (args.length === 0) {
            await sock.sendMessage(from, {
                text: '❌ Please provide base64 text to decode!\n\nExample: .base64decode SGVsbG8gV29ybGQ='
            });
            return;
        }

        const encodedText = args.join(' ');
        
        try {
            const decoded = Buffer.from(encodedText, 'base64').toString('utf8');

            const result = `🔓 *Base64 Decode*

🔒 *Encoded:* ${encodedText}
📝 *Decoded:* ${decoded}`;

            await sock.sendMessage(from, { text: result });

        } catch (error) {
            await sock.sendMessage(from, {
                text: '❌ Invalid base64 string!'
            });
        }
    }

    async hashCommand(sock, message, args, from) {
        if (args.length === 0) {
            await sock.sendMessage(from, {
                text: '❌ Please provide text to hash!\n\nExample: .hash Hello World'
            });
            return;
        }

        const text = args.join(' ');
        const crypto = require('crypto');

        const md5 = crypto.createHash('md5').update(text).digest('hex');
        const sha1 = crypto.createHash('sha1').update(text).digest('hex');
        const sha256 = crypto.createHash('sha256').update(text).digest('hex');

        const result = `🔐 *Hash Generator*

📝 *Original:* ${text}

🔹 *MD5:* ${md5}
🔸 *SHA1:* ${sha1}
🔺 *SHA256:* ${sha256}`;

        await sock.sendMessage(from, { text: result });
    }

    async uuidCommand(sock, message, args, from) {
        const { v4: uuidv4, v1: uuidv1 } = require('uuid');
        
        const uuid4 = uuidv4();
        const uuid1 = uuidv1();

        const result = `🆔 *UUID Generator*

🔹 *UUID v4 (Random):* 
${uuid4}

🔸 *UUID v1 (Timestamp):* 
${uuid1}

💡 *Note:* UUID v4 is cryptographically random, UUID v1 includes timestamp and MAC address.`;

        await sock.sendMessage(from, { text: result });
    }

    getCommandList() {
        return {
            'utility': {
                description: 'Utility and productivity commands',
                commands: {
                    'weather': 'Get weather information for a city',
                    'translate': 'Translate text to different languages',
                    'qr': 'Generate QR codes',
                    'shorturl': 'Shorten long URLs',
                    'info': 'Get bot information and statistics',
                    'time': 'Get current time or time in specific timezone',
                    'calc': 'Perform mathematical calculations',
                    'search': 'Search the web',
                    'wiki': 'Search Wikipedia articles',
                    'joke': 'Get a random joke',
                    'quote': 'Get an inspirational quote',
                    'base64encode': 'Encode text to base64',
                    'base64decode': 'Decode base64 text',
                    'hash': 'Generate MD5, SHA1, and SHA256 hashes',
                    'uuid': 'Generate UUID identifiers'
                }
            }
        };
    }
}

module.exports = new UtilityCommands();

