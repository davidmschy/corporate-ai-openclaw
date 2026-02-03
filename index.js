// Corporate AI - Debug Version
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const KIMI_KEY = process.env.KIMI_API_KEY;

console.log('=== SERVER START ===');
console.log('Timestamp:', new Date().toISOString());
console.log('Telegram Token:', TELEGRAM_TOKEN ? 'SET (length: ' + TELEGRAM_TOKEN.length + ')' : 'NOT SET');
console.log('Kimi Key:', KIMI_KEY ? 'SET (length: ' + KIMI_KEY.length + ')' : 'NOT SET');
console.log('Kimi Key Preview:', KIMI_KEY ? KIMI_KEY.substring(0, 20) + '...' : 'N/A');
console.log('====================');

// Test Kimi on startup
async function testKimiOnStartup() {
  if (!KIMI_KEY) {
    console.log('âš ï¸  No Kimi API key - will use local responses');
    return;
  }
  
  try {
    console.log('Testing Kimi API...');
    const response = await axios.post('https://api.moonshot.cn/v1/chat/completions', {
      model: 'kimi-k2-5',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Kimi API is working" and nothing else.' }
      ],
      temperature: 0.3,
      max_tokens: 50
    }, {
      headers: {
        'Authorization': `Bearer ${KIMI_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('âœ… Kimi API Test SUCCESS');
    console.log('Response:', response.data.choices[0].message.content);
  } catch (error) {
    console.error('âŒ Kimi API Test FAILED');
    console.error('Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

// Telegram webhook
app.post('/telegram', async (req, res) => {
  try {
    const update = req.body;
    if (!update.message) return res.send('OK');
    
    const msg = update.message;
    const chatId = msg.chat.id;
    const text = msg.text || '';
    const from = msg.from;
    
    console.log(`\n[${new Date().toISOString()}] ${from.first_name}: ${text}`);
    console.log('Kimi Key available:', !!KIMI_KEY);
    
    let responseText = '';
    
    if (KIMI_KEY) {
      try {
        console.log('Calling Kimi API...');
        const kimiRes = await axios.post('https://api.moonshot.cn/v1/chat/completions', {
          model: 'kimi-k2-5',
          messages: [
            { 
              role: 'system', 
              content: 'You are Genii, Executive Assistant for David Schy. You help with FBX Developments, Mike Schy Putting, Genii AI, and personal tasks. Be conversational and natural.' 
            },
            { role: 'user', content: text }
          ],
          temperature: 0.7,
          max_tokens: 1500
        }, {
          headers: {
            'Authorization': `Bearer ${KIMI_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 20000
        });
        
        responseText = kimiRes.data.choices[0].message.content;
        console.log('âœ… Kimi responded successfully');
        
      } catch (kimiError) {
        console.error('âŒ Kimi API error:', kimiError.response?.status, kimiError.response?.data?.error?.message || kimiError.message);
        responseText = `I'm having trouble connecting to my AI brain right now. Error: ${kimiError.response?.data?.error?.message || 'Unknown error'}\n\nBut I can still help! What would you like to know about your projects or team?`;
      }
    } else {
      console.log('âš ï¸  No Kimi key, using local response');
      responseText = `Hello ${from.first_name}! I don't have my AI brain connected yet, but I can help with your business info. What do you need?`;
    }
    
    // Send to Telegram
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: responseText
    });
    
    res.send('OK');
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(200).send('Error handled');
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    kimi_configured: !!KIMI_KEY,
    timestamp: new Date().toISOString()
  });
});

// Status with more info
app.get('/status', (req, res) => {
  res.json({
    agent: 'Genii - Corporate AI',
    platform: 'Render.com',
    kimi_key_present: !!KIMI_KEY,
    kimi_key_length: KIMI_KEY ? KIMI_KEY.length : 0,
    timestamp: new Date().toISOString()
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'Corporate AI - Genii',
    version: '2.3.0-debug',
    kimi: KIMI_KEY ? 'configured' : 'not configured'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\nðŸš€ Server on port ${PORT}`);
  
  // Test Kimi after server starts
  setTimeout(() => {
    testKimiOnStartup();
  }, 1000);
});
