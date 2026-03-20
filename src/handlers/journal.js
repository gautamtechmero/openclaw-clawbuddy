const { getDb } = require('../database');
const { v4: uuidv4 } = require('uuid');

const journalHandlers = {
  list: async (req, res) => {
    const db = getDb();
    
    try {
      const entriesRaw = await db.all('SELECT * FROM journal ORDER BY date DESC');
      const entries = entriesRaw.map(e => ({
        id: e.id,
        content: e.content,
        mood: e.mood,
        date: e.date
      }));
      res.json({ entries, total: entries.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create: async (req, res) => {
    const db = getDb();
    const { mood, content } = req.body;
    const id = uuidv4();
    const now = new Date();
    const date = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    try {
      await db.run(
        'INSERT INTO journal (id, content, mood, date) VALUES (?, ?, ?, ?)',
        [id, content, mood || 3, date]
      );
      
      const entry = await db.get('SELECT * FROM journal WHERE id = ?', [id]);
      console.log(`📓 Journal entry saved: "${content?.substring(0, 30)}..."`);
      res.json({ success: true, entry });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = { journalHandlers };
