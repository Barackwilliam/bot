const axios = require('axios');

const helpers = {
    randomChoice: (arr) => arr[Math.floor(Math.random() * arr.length)],
    delay: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

const funCommands = {
    // Random joke
    joke: {
        description: "Pata utani wa random",
        usage: ".joke",
        execute: async (sock, msg, args) => {
            try {
                const response = await axios.get('https://official-joke-api.appspot.com/random_joke');
                const joke = response.data;
                return `😄 *UTANI WA RANDOM*\n\n${joke.setup}\n\n${joke.punchline}`;
            } catch (error) {
                const jokes = [
                    "Kwa nini wanasayansi hawaamini atomu? Kwa sababu zinatengeneza kila kitu!",
                    "Kwa nini kitabu cha hesabu kilikuwa na huzuni? Kwa sababu kilikuwa na matatizo mengi!",
                    "Ni nini kinaitwa pasta bandia? Impasta!",
                    "Kwa nini kahawa ilifungua ripoti ya polisi? Ilinyang'anywa!",
                    "Kwa nini mayai hayaambii utani? Yatapasuka!"
                ];
                return `😄 *UTANI WA RANDOM*\n\n${helpers.randomChoice(jokes)}`;
            }
        }
    },

    // Random quote
    quote: {
        description: "Pata msemo wa kichochezi",
        usage: ".quote",
        execute: async (sock, msg, args) => {
            const quotes = [
                { text: "Njia pekee ya kufanya kazi nzuri ni kupenda unachofanya.", author: "Steve Jobs" },
                { text: "Uvumbuzi ndio unaotofautisha kiongozi na mfuasi.", author: "Steve Jobs" },
                { text: "Maisha ni yanayotokea wakati unapanga mambo mengine.", author: "John Lennon" },
                { text: "Kesho ni ya wale wanaoamini uzuri wa ndoto zao.", author: "Eleanor Roosevelt" },
                { text: "Usiogope kushindwa. Ogopa kutojaribu.", author: "Babe Ruth" },
                { text: "Kila siku ni fursa mpya ya kuanza upya.", author: "Unknown" }
            ];
            const randomQuote = helpers.randomChoice(quotes);
            return `💭 *MSEMO WA KICHOCHEZI*\n\n"${randomQuote.text}"\n\n_- ${randomQuote.author}_`;
        }
    },

    // 8Ball
    '8ball': {
        description: "Uliza swali kwa mpira wa uchawi",
        usage: ".8ball <swali>",
        execute: async (sock, msg, args) => {
            if (args.length === 0) {
                return "❌ Tafadhali uliza swali!";
            }
            
            const answers = [
                "🎱 Hakika kabisa",
                "🎱 Ndio bila shaka",
                "🎱 Bila shaka",
                "🎱 Ndio kabisa",
                "🎱 Unaweza kutegemea",
                "🎱 Kama ninavyoona, ndio",
                "🎱 Uwezekano mkubwa",
                "🎱 Matarajio mazuri",
                "🎱 Ndio",
                "🎱 Dalili zinaonesha ndio",
                "🎱 Jibu si wazi, jaribu tena",
                "🎱 Uliza tena baadaye",
                "🎱 Bora nisikuambie sasa",
                "🎱 Siwezi kutabiri sasa",
                "🎱 Zingatia na uliza tena",
                "🎱 Usitegemee",
                "🎱 Jibu langu ni hapana",
                "🎱 Vyanzo vyangu vinasema hapana",
                "🎱 Matarajio si mazuri",
                "🎱 Nina shaka kubwa"
            ];
            
            const question = args.join(' ');
            const answer = helpers.randomChoice(answers);
            
            return `🎱 *MPIRA WA UCHAWI*\n\n❓ Swali: ${question}\n🎯 Jibu: ${answer}`;
        }
    },

    // Dice roll
    dice: {
        description: "Rusha kete",
        usage: ".dice [upande]",
        execute: async (sock, msg, args) => {
            const sides = args[0] ? parseInt(args[0]) : 6;
            
            if (isNaN(sides) || sides < 2 || sides > 100) {
                return "❌ Toa namba sahihi ya upande (2-100)!";
            }
            
            const result = Math.floor(Math.random() * sides) + 1;
            return `🎲 *RUSHA KETE*\n\n🎯 Umerusha: **${result}** (kete ya upande ${sides})`;
        }
    },

    // Coin flip
    flip: {
        description: "Rusha sarafu",
        usage: ".flip",
        execute: async (sock, msg, args) => {
            const result = Math.random() < 0.5 ? 'Kichwa' : 'Mkia';
            const emoji = result === 'Kichwa' ? '👑' : '⚡';
            return `🪙 *RUSHA SARAFU*\n\n${emoji} Matokeo: **${result}**`;
        }
    },

    // Truth or Dare
    tod: {
        description: "Mchezo wa Ukweli au Changamoto",
        usage: ".tod [ukweli/changamoto]",
        execute: async (sock, msg, args) => {
            const truths = [
                "Ni nini cha aibu zaidi umeshawahi kufanya?",
                "Ni hofu gani kubwa zaidi unayo?",
                "Ni uongo gani mbaya zaidi umeshawahi sema?",
                "Ni talanta gani ya ajabu unayo?",
                "Ni chakula gani cha ajabu umeshawahi kula?",
                "Umewahi kupenda mtu bila amjue?",
                "Ni siri gani kubwa zaidi unayo?",
                "Umewahi kufanya nini kwa siri?",
                "Ni mtu gani umemwona akiwa uchi?",
                "Umewahi kuiba nini?"
            ];
            
            const dares = [
                "Tuma ujumbe wa sauti ukiimba wimbo wako unaoupenda",
                "Tuma picha ya kicheko",
                "Andika kwa mpenzi wako 'Nakupenda!'",
                "Fanya push-ups 10 na utume video",
                "Piga simu mtu yoyote na useme 'Nakupenda'",
                "Cheza ngoma kwa dakika moja",
                "Andika kitu cha aibu kwa status yako",
                "Piga kelele kwa dakika moja",
                "Cheka kwa sauti kwa dakika mbili",
                "Imba wimbo wa watoto"
            ];
            
            const type = args[0]?.toLowerCase();
            
            if (type === 'ukweli' || type === 'truth') {
                return `🤔 *UKWELI*\n\n${helpers.randomChoice(truths)}`;
            } else if (type === 'changamoto' || type === 'dare') {
                return `😈 *CHANGAMOTO*\n\n${helpers.randomChoice(dares)}`;
            } else {
                const choice = helpers.randomChoice(['ukweli', 'changamoto']);
                const question = choice === 'ukweli' ? helpers.randomChoice(truths) : helpers.randomChoice(dares);
                return `🎮 *UKWELI AU CHANGAMOTO*\n\n${choice === 'ukweli' ? '🤔' : '😈'} **${choice.toUpperCase()}**\n\n${question}`;
            }
        }
    },

    // Would you rather
    wyr: {
        description: "Mchezo wa 'Ungependa zaidi'",
        usage: ".wyr",
        execute: async (sock, msg, args) => {
            const questions = [
                "Ungependa zaidi kuwa na uwezo wa kuruka au kuwa invisible?",
                "Ungependa zaidi kuchelewa dakika 10 au kufika mapema dakika 20?",
                "Ungependa zaidi kupoteza pesa zako zote au picha zako zote?",
                "Ungependa zaidi kusoma mawazo au kutabiri maisha?",
                "Ungependa zaidi kutokula chakula chako unacho kipenzi au kula chakula hicho tu?",
                "Ungependa zaidi kuishi bila internet au bila AC?",
                "Ungependa zaidi kusema kila kitu kilichoakili mwako au kutosema kabisa?",
                "Ungependa zaidi kuwa maarufu lakini maskini au kutojulikana lakini tajiri?"
            ];
            
            return `🤔 *UNGEPENDA ZAIDI*\n\n${helpers.randomChoice(questions)}`;
        }
    },

    // Riddle
    riddle: {
        description: "Pata fumbo",
        usage: ".riddle",
        execute: async (sock, msg, args) => {
            const riddles = [
                { q: "Nina miguu lakini siwezi kutembea. Ni nini?", a: "Meza" },
                { q: "Ninachukua lakini sitoi. Ni nini?", a: "Picha" },
                { q: "Nina macho lakini sioni. Ni nini?", a: "Sindano" },
                { q: "Ninazunguka dunia lakini nibaki pembeni. Ni nini?", a: "Stempu" },
                { q: "Ninalala mchana na kuamka usiku. Ni nini?", a: "Nyota" },
                { q: "Nina kichwa lakini sina ubongo. Ni nini?", a: "Msumari" },
                { q: "Ninakuwa mkubwa ninapokula na mdogo ninapokunywa. Ni nini?", a: "Moto" }
            ];
            
            const riddle = helpers.randomChoice(riddles);
            return `🧩 *FUMBO*\n\n❓ ${riddle.q}\n\n_Jibu litakuja baada ya sekunde 30..._`;
        }
    },

    // Rock Paper Scissors
    rps: {
        description: "Mchezo wa Jiwe, Karatasi, Mkasi",
        usage: ".rps <jiwe/karatasi/mkasi>",
        execute: async (sock, msg, args) => {
            if (args.length === 0) {
                return "❌ Chagua: jiwe, karatasi, au mkasi";
            }
            
            const choices = ['jiwe', 'karatasi', 'mkasi'];
            const playerChoice = args[0].toLowerCase();
            
            if (!choices.includes(playerChoice)) {
                return "❌ Chagua: jiwe, karatasi, au mkasi";
            }
            
            const botChoice = helpers.randomChoice(choices);
            
            let result;
            if (playerChoice === botChoice) {
                result = "🤝 Sare!";
            } else if (
                (playerChoice === 'jiwe' && botChoice === 'mkasi') ||
                (playerChoice === 'karatasi' && botChoice === 'jiwe') ||
                (playerChoice === 'mkasi' && botChoice === 'karatasi')
            ) {
                result = "🎉 Umeshinda!";
            } else {
                result = "😔 Umeshindwa!";
            }
            
            const emojis = {
                jiwe: '🗿',
                karatasi: '📄',
                mkasi: '✂️'
            };
            
            return `🎮 *JIWE, KARATASI, MKASI*\n\n👤 Wewe: ${emojis[playerChoice]} ${playerChoice}\n🤖 Bot: ${emojis[botChoice]} ${botChoice}\n\n${result}`;
        }
    }
};

module.exports = funCommands;
