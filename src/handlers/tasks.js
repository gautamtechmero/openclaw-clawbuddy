const { getDb } = require('../database');
const { v4: uuidv4 } = require('uuid');

const taskHandlers = {
  list: async (req, res) => {
    const db = getDb();
    const { filter } = req.query; // today, upcoming, completed
    
    try {
      let query = 'SELECT * FROM tasks';
      let params = [];
      
      if (filter === 'completed') {
        query += ' WHERE done = 1';
      } else if (filter === 'today') {
        query += ' WHERE done = 0';
      }
      
      const tasks = await db.all(query, params);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create: async (req, res) => {
    const db = getDb();
    const { title, description, time, priority, channel, section } = req.body;
    const id = uuidv4();
    
    try {
      await db.run(
        `INSERT INTO tasks (id, title, description, time, priority, channel, section, done) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [id, title, description || '', time || '', priority || 'medium', channel || null, section || 'Morning']
      );
      
      const task = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
      console.log(`📋 Task created: "${title}"`);
      res.json({ success: true, task });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  update: async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    
    try {
      const existing = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
      if (!existing) return res.status(404).json({ error: 'Task not found' });
      
      const updates = req.body;
      const fields = Object.keys(updates).filter(f => f !== 'id');
      const setClause = fields.map(f => `${f} = ?`).join(', ');
      const params = fields.map(f => updates[f] === true ? 1 : (updates[f] === false ? 0 : updates[f]));
      params.push(id);

      if (fields.length > 0) {
        await db.run(`UPDATE tasks SET ${setClause} WHERE id = ?`, params);
      }
      
      const task = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
      console.log(`📋 Task updated: "${task.title}"`);
      res.json({ success: true, task });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  remove: async (req, res) => {
    const db = getDb();
    const { id } = req.params;
    
    try {
      const task = await db.get('SELECT * FROM tasks WHERE id = ?', [id]);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      
      await db.run('DELETE FROM tasks WHERE id = ?', [id]);
      console.log(`🗑️ Task deleted: "${task.title}"`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = { taskHandlers };
