const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROQ_KEY = process.env.GROQ_API_KEY;

// Ultra simple webhook
app.post('/telegram', async (req, res) => {
  // Send OK immediately to Telegram
  res.send('OK');
  
  try {
    const msg = req.body?.message;
    if (!msg || !msg.text) return;
    
    const chatId = msg.chat.id;
    const text = msg.text;
    
    // Quick response first
    let reply = "Thinking...";
    
    // Try AI
    if (GROQ_KEY) {
      try {
        const ai = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are Genii, assistant for David Schy. Help with business, real estate, and projects. Be natural and conversational.' },
            { role: 'user', content: text }
          ],
          temperature: 0.7,
          max_tokens: 1000
        }, {
          headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
          timeout: 8000
        });
        reply = ai.data.choices[0].message.content;
      } catch (e) {
        reply = `I received: "${text}"\n\nI'm having AI connection issues. Try again?`;
      }
    } else {
      reply = `I received: "${text}"\n\nAI not configured yet.`;
    }
    
    // Send response
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: reply
    });
    
  } catch (e) {
    console.error('Error:', e.message);
  }
});

app.get('/', (req, res) => res.json({ status: 'ok', groq: !!GROQ_KEY }));

app.listen(PORT, () => console.log(`Server on ${PORT}`));
