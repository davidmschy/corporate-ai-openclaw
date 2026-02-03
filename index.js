const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// API Keys
const PROVIDERS = {
  groq: { key: process.env.GROQ_API_KEY, name: 'Groq Llama', model: 'llama-3.3-70b-versatile', url: 'https://api.groq.com/openai/v1/chat/completions' },
  deepseek: { key: process.env.DEEPSEEK_API_KEY, name: 'DeepSeek', model: 'deepseek-chat', url: 'https://api.deepseek.com/chat/completions' },
  kimi: { key: process.env.KIMI_API_KEY, name: 'Kimi', model: 'kimi-k2-5', url: 'https://api.moonshot.cn/v1/chat/completions' }
};

// Business Context
const CONTEXT = `You are Genii, Executive Assistant for David Schy. Help with: FBX Developments (real estate), Mike Schy Putting (golf ebook), Genii AI (software), and Schy Household.

Active projects: Selma LOI, Kerman Walk, Parkview Appraisal, Mike Golf Studio.
Team: Amber Schy (COO), Tony Hunt (Real Estate), Jonathan Zumwalt (Maps).

Be conversational, professional, and helpful.`;

// Try providers in order until one works
async function getAIResponse(message) {
  const messages = [
    { role: 'system', content: CONTEXT },
    { role: 'user', content: message }
  ];

  // Try Groq first (fastest)
  if (PROVIDERS.groq.key) {
    try {
      const res = await axios.post(PROVIDERS.groq.url, {
        model: PROVIDERS.groq.model,
        messages,
        temperature: 0.7,
        max_tokens: 1500
      }, {
        headers: { 'Authorization': `Bearer ${PROVIDERS.groq.key}`, 'Content-Type': 'application/json' },
        timeout: 10000
      });
      return { text: res.data.choices[0].message.content, provider: 'Groq' };
    } catch (e) { console.log('Groq failed:', e.message.substring(0, 50)); }
  }

  // Try DeepSeek
  if (PROVIDERS.deepseek.key) {
    try {
      const res = await axios.post(PROVIDERS.deepseek.url, {
        model: PROVIDERS.deepseek.model,
        messages,
        temperature: 0.7,
        max_tokens: 1500
      }, {
        headers: { 'Authorization': `Bearer ${PROVIDERS.deepseek.key}`, 'Content-Type': 'application/json' },
        timeout: 10000
      });
      return { text: res.data.choices[0].message.content, provider: 'DeepSeek' };
    } catch (e) { console.log('DeepSeek failed:', e.message.substring(0, 50)); }
  }

  // Try Kimi
  if (PROVIDERS.kimi.key) {
    try {
      const res = await axios.post(PROVIDERS.kimi.url, {
        model: PROVIDERS.kimi.model,
        messages,
        temperature: 0.7,
        max_tokens: 1500
      }, {
        headers: { 'Authorization': `Bearer ${PROVIDERS.kimi.key}`, 'Content-Type': 'application/json' },
        timeout: 10000
      });
      return { text: res.data.choices[0].message.content, provider: 'Kimi' };
    } catch (e) { console.log('Kimi failed:', e.message.substring(0, 50)); }
  }

  return { text: "I'm here to help! Currently all AI providers are unavailable. Please try again in a moment.", provider: 'fallback' };
}

// Telegram webhook
app.post('/telegram', async (req, res) => {
  try {
    const msg = req.body.message;
    if (!msg || !msg.text) return res.send('OK');

    const ai = await getAIResponse(msg.text);
    
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: msg.chat.id,
      text: ai.text
    });

    console.log(`[${ai.provider}] ${msg.from.first_name}: ${msg.text.substring(0, 30)}...`);
    res.send('OK');
  } catch (e) {
    console.error('Error:', e.message);
    res.send('OK');
  }
});

// Health check
app.get('/', (req, res) => res.json({ 
  status: 'ok', 
  providers: {
    groq: !!PROVIDERS.groq.key,
    deepseek: !!PROVIDERS.deepseek.key,
    kimi: !!PROVIDERS.kimi.key
  }
}));

app.listen(PORT, () => {
  console.log(`ðŸš€ Genii AI on port ${PORT}`);
  console.log(`Providers: Groq=${!!PROVIDERS.groq.key}, DeepSeek=${!!PROVIDERS.deepseek.key}, Kimi=${!!PROVIDERS.kimi.key}`);
});
