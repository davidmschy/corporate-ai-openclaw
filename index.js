// Corporate AI - Simplified Working Version
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const KIMI_KEY = process.env.KIMI_API_KEY;

// Your Business Knowledge (Context Graph)
const knowledge = {
  businesses: {
    fbx: { name: 'FBX Developments', projects: ['Selma LOI', 'Kerman Walk', 'Parkview Appraisal'] },
    mike_schy: { name: 'Mike Schy Putting', product: 'Putting Confidence Ebook', goal: '10K sales' },
    genii_ai: { name: 'Genii AI', product: 'Corporate AI', status: 'launching' }
  },
  team: {
    amber: { name: 'Amber Schy', role: 'COO', email: 'amber@geniinow.com' },
    tony: { name: 'Tony Hunt', role: 'Real Estate', email: 'tony@fbx.homes' }
  },
  goals: ['Corporate AI launch', 'Complete 3 FBX projects', '10K ebook sales', 'Grow investments']
};

// Telegram webhook
app.post('/telegram', async (req, res) => {
  try {
    const update = req.body;
    if (!update.message) return res.send('OK');
    
    const msg = update.message;
    const chatId = msg.chat.id;
    const text = msg.text || '';
    const from = msg.from;
    
    console.log(`[${new Date().toISOString()}] ${from.first_name}: ${text}`);
    
    // Get response
    let response = '';
    
    try {
      if (KIMI_KEY) {
        // Try Kimi API
        const kimiRes = await axios.post('https://api.moonshot.cn/v1/chat/completions', {
          model: 'kimi-k2-5',
          messages: [
            { role: 'system', content: 'You are Genii, Executive Assistant for David Schy. Help with business projects.' },
            { role: 'user', content: text }
          ],
          temperature: 0.7,
          max_tokens: 1000
        }, {
          headers: { 'Authorization': `Bearer ${KIMI_KEY}`, 'Content-Type': 'application/json' },
          timeout: 15000
        });
        response = kimiRes.data.choices[0].message.content;
      } else {
        throw new Error('No API key');
      }
    } catch (err) {
      // Fallback to local knowledge
      response = localResponse(text, from.first_name);
    }
    
    // Send to Telegram
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: response
    });
    
    res.send('OK');
  } catch (error) {
    console.error('Error:', error.message);
    res.status(200).send('Error handled');
  }
});

// Local response (fallback)
function localResponse(text, name) {
  const lower = text.toLowerCase();
  
  if (lower.includes('hello') || lower.includes('hi')) {
    return `Hello ${name}! ðŸ‘‹\n\nI'm Genii, your Executive Assistant.\n\nI can help with:\nâ€¢ FBX projects\nâ€¢ Mike Schy business\nâ€¢ Your team\nâ€¢ Goals\n\nWhat would you like to work on?`;
  }
  
  if (lower.includes('project') || lower.includes('fbx')) {
    return `ðŸ“Š FBX Projects:\n\nâ€¢ Selma LOI\nâ€¢ Kerman Walk\nâ€¢ Parkview Appraisal\n\nWhich needs attention?`;
  }
  
  if (lower.includes('contact') || lower.includes('team')) {
    return `ðŸ‘¥ Your Team:\n\nâ€¢ Amber Schy - COO\nâ€¢ Tony Hunt - Real Estate\n\nNeed to reach someone?`;
  }
  
  if (lower.includes('goal')) {
    return `ðŸŽ¯ 2026 Goals:\n\n1. Corporate AI launch\n2. Complete 3 FBX projects\n3. 10K ebook sales\n4. Grow investments`;
  }
  
  return `I received: "${text}"\n\nI can help with projects, team info, or goals. What do you need?`;
}

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Status
app.get('/status', (req, res) => res.json({
  agent: 'Genii - Corporate AI',
  platform: 'Render.com',
  ai: KIMI_KEY ? 'Kimi K2.5 configured' : 'Local mode',
  timestamp: new Date().toISOString()
}));

// Root
app.get('/', (req, res) => res.json({ message: 'Corporate AI - Genii', version: '2.1.0' }));

// Start
app.listen(PORT, () => {
  console.log(`ðŸš€ Corporate AI Server on port ${PORT}`);
  console.log(`ðŸ¤– AI: ${KIMI_KEY ? 'Kimi configured' : 'Local mode'}`);
});
