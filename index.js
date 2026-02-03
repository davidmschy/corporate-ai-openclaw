// Corporate AI - Fixed Version with Proper Kimi Integration
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const KIMI_KEY = process.env.KIMI_API_KEY;

console.log('Starting Corporate AI Server...');
console.log('Kimi API Key present:', KIMI_KEY ? 'YES' : 'NO');
console.log('Kimi API Key length:', KIMI_KEY ? KIMI_KEY.length : 0);

// Context Graph - Your Business Knowledge
const contextGraph = {
  user: {
    name: 'David Schy',
    role: 'Chairman',
    businesses: ['FBX Developments', 'Mike Schy Putting', 'Genii AI', 'Schy Household', 'Investments']
  },
  projects: [
    { name: 'Selma LOI', status: 'negotiating', priority: 'high' },
    { name: 'Kerman Walk', status: 'scheduled', priority: 'medium' },
    { name: 'Parkview Appraisal', status: 'pending', priority: 'medium' },
    { name: 'Mike Golf Studio', status: 'in_progress', priority: 'high' }
  ],
  team: [
    { name: 'Amber Schy', role: 'COO', email: 'amber@geniinow.com' },
    { name: 'Tony Hunt', role: 'Real Estate', email: 'tony@fbx.homes' },
    { name: 'Jonathan Zumwalt', role: 'Tentative Maps' }
  ]
};

// Call Kimi API with full context
async function callKimi(userMessage, userName) {
  if (!KIMI_KEY) {
    throw new Error('KIMI_API_KEY not set');
  }
  
  const systemPrompt = `You are Genii, the Executive Assistant for David Schy.

You are running on a server and can help with:
- FBX Developments real estate projects
- Mike Schy Putting golf business
- Genii AI product
- Schy Household operations
- Investment portfolio

Your team includes:
- Amber Schy (COO) - amber@geniinow.com
- Tony Hunt (Real Estate) - tony@fbx.homes
- Jonathan Zumwalt (Tentative Maps)

Active projects:
- Selma LOI (negotiating, high priority)
- Kerman Walk (scheduled)
- Parkview Appraisal (pending)
- Mike Golf Studio (in progress, high priority)

Be conversational, helpful, and natural. Respond like a real executive assistant, not a template.`;

  try {
    console.log('Calling Kimi API...');
    
    const response = await axios.post('https://api.moonshot.cn/v1/chat/completions', {
      model: 'kimi-k2-5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${userName}: ${userMessage}` }
      ],
      temperature: 0.8,
      max_tokens: 2000
    }, {
      headers: {
        'Authorization': `Bearer ${KIMI_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('Kimi response received');
    return response.data.choices[0].message.content;
    
  } catch (error) {
    console.error('Kimi API Error:', error.response?.data || error.message);
    throw error;
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
    
    let responseText = '';
    
    try {
      // Try Kimi first
      responseText = await callKimi(text, from.first_name);
      console.log('Using Kimi AI response');
    } catch (kimiError) {
      console.log('Kimi failed, using fallback:', kimiError.message);
      responseText = generateSmartResponse(text, from.first_name);
    }
    
    // Send to Telegram
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: responseText,
      parse_mode: 'HTML'
    });
    
    res.send('OK');
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(200).send('Error handled');
  }
});

// Smart fallback response
function generateSmartResponse(text, name) {
  const lower = text.toLowerCase();
  
  // Simple pattern matching for common queries
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return `Hello ${name}! ðŸ‘‹\n\nI'm Genii, your Executive Assistant. I'm having trouble connecting to my AI brain right now, but I can still help you with your business info.\n\nWhat would you like to know about?`;
  }
  
  if (lower.match(/project|fbx|selma|kerman|parkview/)) {
    return `ðŸ“Š Your Real Estate Projects:\n\n<b>Selma LOI</b>\nStatus: Negotiating\nPriority: High\n\n<b>Kerman Walk</b>\nStatus: Scheduled\n\n<b>Parkview Appraisal</b>\nStatus: Pending\n\n<b>Mike Golf Studio</b>\nStatus: In Progress\nPriority: High\n\nWhich one needs your attention?`;
  }
  
  if (lower.match(/team|contact|amber|tony|jonathan/)) {
    return `ðŸ‘¥ Your Team:\n\n<b>Amber Schy</b>\nCOO / Operations\nðŸ“§ amber@geniinow.com\n\n<b>Tony Hunt</b>\nReal Estate Agent\nðŸ“§ tony@fbx.homes\n\n<b>Jonathan Zumwalt</b>\nTentative Maps\n\nWho do you need to reach?`;
  }
  
  if (lower.match(/goal|2026|priority/)) {
    return `ðŸŽ¯ 2026 Goals:\n\n1. <b>Corporate AI launch</b> - In progress\n2. <b>Complete 3 FBX projects</b>\n3. <b>Mike Schy ebook 10K sales</b>\n4. <b>Grow investment portfolio</b>\n5. <b>Family time prioritized</b>\n\nWhich goal are you working on today?`;
  }
  
  // Generic but helpful response
  return `I understand you're asking about "${text}"\n\nI'm currently running in local mode while my AI connection is being set up. I can help you with:\n\nâ€¢ <b>Projects</b> - View your FBX real estate projects\nâ€¢ <b>Team</b> - Contact Amber, Tony, or Jonathan\nâ€¢ <b>Goals</b> - See your 2026 priorities\nâ€¢ <b>Status</b> - Check system status\n\nWhat would you like to know?`;
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    kimi_configured: !!KIMI_KEY
  });
});

// Status
app.get('/status', (req, res) => {
  res.json({
    agent: 'Genii - Corporate AI',
    platform: 'Render.com',
    ai_engine: 'Kimi K2.5',
    ai_status: KIMI_KEY ? 'configured' : 'not configured',
    timestamp: new Date().toISOString()
  });
});

// Test Kimi endpoint
app.get('/test-kimi', async (req, res) => {
  try {
    const result = await callKimi('Hello, are you working?', 'Test');
    res.json({ success: true, response: result });
  } catch (error) {
    res.json({ 
      success: false, 
      error: error.message,
      details: error.response?.data || 'No additional details'
    });
  }
});

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'Corporate AI - Genii',
    version: '2.2.0',
    ai: KIMI_KEY ? 'Kimi K2.5' : 'Local mode',
    endpoints: ['/telegram', '/health', '/status', '/test-kimi']
  });
});

// Start
app.listen(PORT, () => {
  console.log(`\nðŸš€ Corporate AI Server v2.2.0 on port ${PORT}`);
  console.log(`ðŸ¤– AI: ${KIMI_KEY ? 'Kimi K2.5 configured' : 'LOCAL MODE (no API key)'}`);
  console.log(`ðŸ“Š Context: ${contextGraph.projects.length} projects, ${contextGraph.team.length} team members\n`);
});
