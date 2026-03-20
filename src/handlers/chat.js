/**
 * Chat handler — AI-like responses for Claw Buddy
 * 
 * In production, this would forward to the actual Openclaw AI engine.
 * For testing, it provides contextual canned responses.
 */

const { getDb } = require('../database');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function getOpenclawToken() {
  try {
    const configPath = path.join(os.homedir(), '.openclaw', 'openclaw.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config?.gateway?.auth?.token || null;
    }
  } catch (e) {
    console.error("Could not read Openclaw config:", e);
  }
  return null;
}

async function chatHandler(message, userName, contextData) {
  const db = getDb();
  
  try {
    // 1. Gather Real-Time Context from SQLite
    const tasks = await db.all('SELECT * FROM tasks WHERE done = 0 ORDER BY time ASC');
    const spending = await db.get('SELECT SUM(amount) as spent FROM expenses');
    const budgetRow = await db.get('SELECT amount FROM budget WHERE id = 1');
    const habits = await db.all('SELECT * FROM habits');
    
    let locationContext = '';
    if (contextData && contextData.location) {
      locationContext = `User's current GPS location: ${contextData.location.lat.toFixed(4)}, ${contextData.location.lon.toFixed(4)}.`;
    }

    const systemPrompt = `You are Claw, a highly intelligent and affectionate AI companion for ${userName || 'the user'}. Use paw print emojis (🐾) occasionally. 
You live in the Claw Buddy mobile app. 

LIVE DATA:
- Tasks: ${tasks.length > 0 ? tasks.map(t => `- ${t.title} at ${t.time || 'no time'}`).join('\n') : 'No pending tasks.'}
- Budget: Spent ₹${spending?.spent || 0} out of ₹${budgetRow?.amount || 20000}.
- Habits being tracked: ${habits.length > 0 ? habits.map(h => `${h.name} (streak: ${h.streak})`).join(', ') : 'None.'}
${locationContext}

Always respond concisely and helpfully. Keep answers short (1-3 sentences) suitable for a mobile app chat interface.`;

    // 2. Connect to the real Openclaw AI Engine (local gateway)
    const token = await getOpenclawToken();
    if (!token) {
      // Fallback if Openclaw is not running or securely configured
      return { message: "I couldn't securely connect to my Openclaw AI brain. Please check your core Openclaw installation!" };
    }

    const aiRequest = await fetch('http://127.0.0.1:18789/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'primary',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 150
      })
    });

    if (aiRequest.ok) {
      const responseData = await aiRequest.json();
      const aiResponseText = responseData.choices?.[0]?.message?.content || "I'm speechless!";
      return {
        message: aiResponseText,
        actions: [] // Actions can be dynamically parsed later if needed
      };
    } else {
      console.error("Openclaw AI Error:", await aiRequest.text());
      return { message: "My AI cognitive engine (Openclaw) is currently unreachable. Make sure Openclaw is running!" };
    }

  } catch (error) {
    console.error("Chat routing error:", error);
    return { message: "Oops, I encountered a circuit error connecting to my AI brain." };
  }
}

module.exports = { chatHandler };

