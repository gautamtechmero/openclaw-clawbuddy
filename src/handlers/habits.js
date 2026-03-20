const { getDb } = require('../database');
const { v4: uuidv4 } = require('uuid');

const habitHandlers = {
  list: async (req, res) => {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const habitsRaw = await db.all('SELECT * FROM habits');
      const habits = await Promise.all(habitsRaw.map(async (h) => {
        const logs = await db.all(
          'SELECT status FROM habit_logs WHERE habit_id = ? ORDER BY date DESC LIMIT 7',
          [h.id]
        );
        
        const history = logs.map(l => l.status === 1);
        while (history.length < 7) history.push(false);
        
        const todayDone = await db.get(
          'SELECT id FROM habit_logs WHERE habit_id = ? AND date = ?',
          [h.id, today]
        );

        return {
          id: h.id,
          name: h.name,
          icon: h.emoji || '⭐',
          description: h.description || '',
          streak: h.streak || 0,
          color: h.color || '#0A84FF',
          todayDone: !!todayDone,
          history: history.reverse()
        };
      }));
      
      res.json({ habits, total: habits.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create: async (req, res) => {
    const db = getDb();
    const { name, emoji, description, color } = req.body;
    const id = uuidv4();
    
    try {
      await db.run(
        'INSERT INTO habits (id, name, emoji, description, color, streak) VALUES (?, ?, ?, ?, ?, 0)',
        [id, name, emoji || '⭐', description || '', color || '#0A84FF']
      );
      
      const habit = await db.get('SELECT * FROM habits WHERE id = ?', [id]);
      console.log(`🎯 Habit created: "${name}"`);
      res.json({ success: true, habit });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  checkIn: async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const habit = await db.get('SELECT * FROM habits WHERE id = ?', [id]);
      if (!habit) return res.status(404).json({ error: 'Habit not found' });
      
      const session = await db.get(
        'SELECT id FROM habit_logs WHERE habit_id = ? AND date = ?',
        [id, today]
      );

      if (session) {
        await db.run('DELETE FROM habit_logs WHERE id = ?', [session.id]);
        await db.run('UPDATE habits SET streak = MAX(0, streak - 1) WHERE id = ?', [id]);
      } else {
        await db.run(
          'INSERT INTO habit_logs (habit_id, date, status) VALUES (?, ?, 1)',
          [id, today]
        );
        await db.run('UPDATE habits SET streak = streak + 1 WHERE id = ?', [id]);
      }
      
      const updated = await db.get('SELECT * FROM habits WHERE id = ?', [id]);
      console.log(`🎯 Habit check-in: "${updated.name}"`);
      res.json({ success: true, habit: updated });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = { habitHandlers };
