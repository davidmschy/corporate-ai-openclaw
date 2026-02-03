const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const KIMI_KEY = process.env.KIMI_API_KEY;

// Business Knowledge Context
const context = {
  user: "David Schy",
  businesses: ["FBX Developments", "Mike Schy Putting", "Genii AI", "Schy Household"],
  projects: ["Selma LOI", "Kerman Walk", "Parkview Appraisal", "Mike Golf Studio"],
  team: ["Amber Schy (COO)", "Tony Hunt (Real Estate)", "Jonathan Zumwalt (Maps)"]
};

// AI Provider: OpenAI (reliable) or Kimi (when working)
async function getAIResponse(message) {
  const systemPrompt = `You are Genii, Executive Assistant for David Schy. Help with: ${context.businesses.join(', ')}. Be natural and conversational.`;
  
  // Try OpenAI first
  if (OPENAI_KEY) {
    try {
      const res = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7
      }, {
        headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
        timeout: 15000
      });
      return { text: res.data.choices[0].message.content, source: 'OpenAI' };
    } catch (e) {
      console.log('OpenAI failed:', e.message);
    }
  }
  
  // Try Kimi
  if (KIMI_KEY) {
    try {
      const res = await axios.post('https://api.moonshot.cn/v1/chat/completions', {
        model: 'kimi-k2-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7
      }, {
        headers: { 'Authorization': `Bearer ${KIMI_KEY}`, 'Content-Type': 'application/json' },
        timeout: 15000
      });
      return { text: res.data.choices[0].message.content, source: 'Kimi' };
    } catch (e) {
      console.log('Kimi failed:', e.message);
    }
  }
  
  // Fallback
  return { text: `I'm your AI assistant. Currently running without AI connection. I know about your ${context.projects.length} projects and ${context.team.length} team members. What do you need?`, source: 'local' };
}

// Telegram webhook
app.post('/telegram', async (req, res) => {
  try {
    const msg = req.body.message;
    if (!msg) return res.send('OK');
    
    const ai = await getAIResponse(msg.text || '');
    const response = ai.source === 'local' ? ai.text : ai.text;
    
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: msg.chat.id,
      text: response
    });
    
    res.send('OK');
  } catch (e) {
    console.error(e.message);
    res.send('OK');
  }
});

app.get('/', (req, res) => res.json({ status: 'ok', ai: OPENAI_KEY ? 'OpenAI' : (KIMI_KEY ? 'Kimi' : 'local') }));

app.listen(PORT, () => console.log(`Server on ${PORT}, AI: ${OPENAI_KEY ? 'OpenAI' : (KIMI_KEY ? 'Kimi' : 'local')}`));
