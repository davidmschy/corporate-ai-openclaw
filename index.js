// Corporate AI - OpenClaw Based Implementation
// Uses proper OpenClaw framework patterns

const express = require('express');
const axios = require('axios');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const KIMI_KEY = process.env.KIMI_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

// Database connection (PostgreSQL on Render)
const db = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } }) : null;

// Context Graph - Your Business Knowledge
const contextGraph = {
  david: {
    role: 'Chairman',
    businesses: ['fbx', 'mike_schy', 'genii_ai', 'home', 'investments']
  },
  businesses: {
    fbx: {
      name: 'FBX Developments',
      type: 'real_estate',
      projects: ['selma_loi', 'kerman_walk', 'parkview_appraisal'],
      team: ['amber', 'tony', 'jonathan']
    },
    mike_schy: {
      name: 'Mike Schy Putting',
      type: 'golf_instruction',
      products: ['putting_confidence_ebook'],
      goal: '10000_sales'
    },
    genii_ai: {
      name: 'Genii AI',
      type: 'ai_software',
      product: 'Corporate AI',
      status: 'launching'
    },
    home: {
      name: 'Schy Household',
      type: 'personal',
      focus: 'family_operations'
    },
    investments: {
      name: 'Schy Investments',
      type: 'portfolio',
      strategies: ['trading', 'real_estate', 'equity']
    }
  },
  team: {
    amber: { name: 'Amber Schy', role: 'COO', email: 'amber@geniinow.com', businesses: ['fbx', 'home'] },
    tony: { name: 'Tony Hunt', role: 'Real Estate Agent', email: 'tony@fbx.homes', businesses: ['fbx'] },
    jonathan: { name: 'Jonathan Zumwalt', role: 'Tentative Maps', businesses: ['fbx'] }
  },
  projects: {
    selma_loi: { name: 'Selma LOI', status: 'negotiating', priority: 1, business: 'fbx' },
    kerman_walk: { name: 'Kerman Walk', status: 'scheduled', priority: 2, business: 'fbx' },
    parkview_appraisal: { name: 'Parkview Appraisal', status: 'pending', priority: 2, business: 'fbx' },
    mike_golf_loi: { name: 'Mike Golf Studio LOI', status: 'in_progress', priority: 1, business: 'mike_schy' },
    corporate_ai_deploy: { name: 'Corporate AI Deploy', status: 'active', priority: 1, business: 'genii_ai' }
  },
  goals_2026: [
    'Corporate AI launch and sales',
    'FBX 3 projects to completion',
    'Mike Schy ebook 10K sales',
    'Investment portfolio growth',
    'Family time prioritized'
  ]
};

// Query context graph for relevant info
function queryContext(query, userId) {
  const lower = query.toLowerCase();
  const results = [];
  
  // Check for business mentions
  for (const [id, business] of Object.entries(contextGraph.businesses)) {
    if (lower.includes(id) || lower.includes(business.name.toLowerCase())) {
      results.push({ type: 'business', data: business });
    }
  }
  
  // Check for project mentions
  for (const [id, project] of Object.entries(contextGraph.projects)) {
    if (lower.includes(id.replace('_', ' ')) || lower.includes(project.name.toLowerCase())) {
      results.push({ type: 'project', data: project });
    }
  }
  
  // Check for team mentions
  for (const [id, person] of Object.entries(contextGraph.team)) {
    if (lower.includes(id) || lower.includes(person.name.toLowerCase())) {
      results.push({ type: 'contact', data: person });
    }
  }
  
  // Check for goals
  if (lower.includes('goal') || lower.includes('2026') || lower.includes('priority')) {
    results.push({ type: 'goals', data: contextGraph.goals_2026 });
  }
  
  return results;
}

// Call Kimi API with full context
async function askKimi(question, context, user) {
  try {
    const response = await axios.post('https://api.moonshot.cn/v1/chat/completions', {
      model: 'kimi-k2-5',
      messages: [
        {
          role: 'system',
          content: `You are Genii, Executive Assistant for ${user.name || 'David Schy'}.

CONTEXT:
${JSON.stringify(context, null, 2)}

You manage multiple businesses and coordinate with the team. Be helpful, concise, and action-oriented.`
        },
        {
          role: 'user',
          content: question
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    }, {
      headers: {
        'Authorization': `Bearer ${KIMI_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Kimi API error:', error.response?.data || error.message);
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
    
    console.log(`[${new Date().toISOString()}] ${from.first_name}: ${text}`);
    
    // Query context graph
    const context = queryContext(text, from.id);
    
    // Get AI response
    let response;
    try {
      response = await askKimi(text, context, from);
    } catch (kimiError) {
      // Fallback to local knowledge
      response = generateLocalResponse(text, context, from);
    }
    
    // Send response
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: response
    });
    
    // Log to database if available
    if (db) {
      await db.query(
        'INSERT INTO conversations (chat_id, user_name, message, response, timestamp) VALUES ($1, $2, $3, $4, $5)',
        [chatId, from.first_name, text, response, new Date()]
      );
    }
    
    res.send('OK');
  } catch (error) {
    console.error('Error:', error);
    res.status(200).send('Error handled');
  }
});

// Local response generator (fallback)
function generateLocalResponse(text, context, user) {
  const lower = text.toLowerCase();
  let response = '';
  
  // Use context data if available
  for (const item of context) {
    if (item.type === 'project') {
      response += `ðŸ“Š Project: ${item.data.name}\n`;
      response += `Status: ${item.data.status}\n\n`;
    }
    if (item.type === 'contact') {
      response += `ðŸ‘¤ ${item.data.name}\n`;
      response += `Role: ${item.data.role}\n`;
      response += `Email: ${item.data.email || 'N/A'}\n\n`;
    }
    if (item.type === 'goals') {
      response += 'ðŸŽ¯ 2026 Goals:\n';
      item.data.forEach((g, i) => response += `${i+1}. ${g}\n`);
      response += '\n';
    }
  }
  
  if (!response) {
    response = `I understand you're asking about: "${text}"\n\n`;
    response += `I have your full business context loaded:\n`;
    response += `â€¢ 5 businesses (FBX, Mike Schy, Genii AI, Home, Investments)\n`;
    response += `â€¢ 5 active projects\n`;
    response += `â€¢ 3 team members\n`;
    response += `â€¢ 2026 goals\n\n`;
    response += `What specifically would you like to know?`;
  }
  
  return response;
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    ai: 'Kimi K2.5',
    context_graph: 'loaded',
    database: db ? 'connected' : 'not configured'
  });
});

// Status
app.get('/status', (req, res) => {
  res.json({
    agent: 'Genii - Corporate AI',
    framework: 'OpenClaw Pattern',
    platform: 'Render.com',
    businesses: Object.keys(contextGraph.businesses).length,
    projects: Object.keys(contextGraph.projects).length,
    team: Object.keys(contextGraph.team).length,
    timestamp: new Date().toISOString()
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    name: 'Corporate AI - Genii',
    version: '2.0.0',
    framework: 'OpenClaw-based',
    endpoints: ['/telegram', '/health', '/status']
  });
});

// Initialize database
async function initDb() {
  if (!db) return;
  
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        chat_id TEXT NOT NULL,
        user_name TEXT,
        message TEXT,
        response TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('âœ… Database initialized');
  } catch (error) {
    console.error('Database init error:', error);
  }
}

// Start server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`ðŸš€ Corporate AI Server v2.0 (OpenClaw-based) on port ${PORT}`);
    console.log(`ðŸ§  Context Graph: ${Object.keys(contextGraph.businesses).length} businesses loaded`);
    console.log(`ðŸ¤– Kimi K2.5: ${KIMI_KEY ? 'configured' : 'not configured'}`);
    console.log(`ðŸ’¾ Database: ${db ? 'connected' : 'not connected'}`);
  });
});
