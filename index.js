const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROQ_KEY = process.env.GROQ_API_KEY;

// Debug logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.post('/telegram', async (req, res) => {
  console.log('Webhook received:', JSON.stringify(req.body).substring(0, 500));
  
  // Respond immediately
  res.send('OK');
  
  try {
    const update = req.body;
    
    // Handle both message and edited_message
    const msg = update.message || update.edited_message;
    if (!msg) {
      console.log('No message in update');
      return;
    }
    
    const chatId = msg.chat?.id;
    const text = msg.text || '';
    const userName = msg.from?.first_name || 'User';
    
    if (!chatId) {
      console.log('No chat ID');
      return;
    }
    
    console.log(`Processing: ${userName} said "${text}"`);
    
    // Get AI response
    let reply = '';
    
    if (GROQ_KEY && text) {
      try {
        console.log('Calling Groq...');
        const ai = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are Genii, the AI assistant for David Schy. Help with his businesses: FBX Developments (real estate), Mike Schy Putting (golf), Genii AI (software). Be conversational and helpful.' },
            { role: 'user', content: text }
          ],
          temperature: 0.7,
          max_tokens: 1500
        }, {
          headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
          timeout: 10000
        });
        
        reply = ai.data.choices[0].message.content;
        console.log('Groq response:', reply.substring(0, 100) + '...');
      } catch (e) {
        console.error('Groq error:', e.response?.data?.error?.message || e.message);
        reply = `I received your message but had trouble processing it. Error: ${e.response?.data?.error?.message || e.message}`;
      }
    } else {
      reply = `Hello ${userName}! I received: "${text}"\n\n(Groq key: ${GROQ_KEY ? 'YES' : 'NO'})`;
    }
    
    // Send to Telegram
    console.log('Sending reply to Telegram...');
    const tgRes = await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: reply,
      parse_mode: 'HTML'
    });
    
    console.log('Telegram response:', tgRes.data.ok ? 'OK' : 'FAILED');
    
  } catch (e) {
    console.error('Webhook error:', e.message);
  }
});

app.get('/', (req, res) => res.json({ status: 'ok', groq: !!GROQ_KEY, time: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`ðŸš€ Genii AI Server on port ${PORT}`);
  console.log(`Groq: ${GROQ_KEY ? 'Configured' : 'NOT SET'}`);
});
