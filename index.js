const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const KIMI_KEY = process.env.KIMI_API_KEY;

console.log('=== SERVER STARTED ===');
console.log('Kimi Key:', KIMI_KEY ? 'SET' : 'NOT SET');

// Simple test endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', kimi: !!KIMI_KEY });
});

// Telegram webhook - simplified
app.post('/telegram', async (req, res) => {
  console.log('Webhook received:', JSON.stringify(req.body).substring(0, 200));
  
  try {
    const msg = req.body.message;
    if (!msg) return res.send('OK');
    
    const chatId = msg.chat.id;
    const text = msg.text || '';
    
    // Simple response without Kimi for now
    let response = `Received: "${text}"\n\nServer is working! Kimi key: ${KIMI_KEY ? 'YES' : 'NO'}`;
    
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: response
    });
    
    res.send('OK');
  } catch (error) {
    console.error('Error:', error.message);
    res.send('OK'); // Always return OK to Telegram
  }
});

app.listen(PORT, () => {
  console.log(`Server on port ${PORT}`);
});
