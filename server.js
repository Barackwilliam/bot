// server.js
const express = require('express');
const fs = require('fs');
const QRCode = require('qrcode');
const app = express();
const PORT = process.env.PORT || 3000;

let qrStore = {};  // kuhifadhi QR temporarily kwa kila namba

app.use(express.static('public'));
app.use(express.json());

app.post('/start-bot', async (req, res) => {
    const number = req.body.number;
    if (!number) return res.status(400).json({ error: 'Number required' });

    qrStore[number] = null;  // clear QR before start

    const { startBotWithNumber } = require('./index');
    startBotWithNumber(number, async (qr) => {
        try {
            const url = await QRCode.toDataURL(qr);
            qrStore[number] = url;
            console.log(`✅ QR code generated for ${number}`);
        } catch (err) {
            console.error('QR conversion error:', err.message);
        }
    });

    res.json({ message: 'Bot is starting...' });
});

app.get('/qr/:number', (req, res) => {
    const number = req.params.number;
    const qrUrl = qrStore[number];
    if (!qrUrl) {
        return res.send('<p>⏳ QR not ready yet... please wait a few seconds and refresh</p>');
    }
    res.send(`<img src="${qrUrl}" width="300"/><p>Scan to login for ${number}</p>`);
});

app.listen(PORT, () => {
    console.log(`🌐 Server running at http://localhost:${PORT}`);
});
