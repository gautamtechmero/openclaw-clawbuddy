/**
 * Task handlers — in-memory store for demo/testing
 */

let tasks = [
  { id: '1', title: 'Review Q3 Report', description: 'Go through the final quarterly report', time: '10:00 AM', priority: 'high', channel: 'Telegram', section: 'Morning', done: false, subtasks: [
    { id: 's1', title: 'Check revenue metrics', done: true },
    { id: 's2', title: 'Verify user growth data', done: false },
    { id: 's3', title: 'Draft summary email', done: false },
  ] },
  { id: '2', title: 'Call with Architecture Team', description: 'Discuss new microservices plan', time: '1:30 PM', priority: 'medium', section: 'Afternoon', done: false, subtasks: [] },
  { id: '3', title: 'Update Design System', description: 'Sync Figma tokens with code', time: '4:00 PM', priority: 'low', section: 'Afternoon', done: false, subtasks: [] },
  { id: '4', title: 'Buy Groceries', description: 'Milk, eggs, bread, coffee', time: '6:30 PM', priority: 'low', channel: 'WhatsApp', section: 'Evening', done: false, subtasks: [] },
];

let nextId = 5;

const taskHandlers = {
  list: (req, res) => {
    const { filter } = req.query; // today, upcoming, completed
    let filtered = tasks;
    if (filter === 'completed') {
      filtered = tasks.filter(t => t.done);
    } else if (filter === 'today') {
      filtered = tasks.filter(t => !t.done);
    }
    res.json({ tasks: filtered, total: filtered.length });
  },

  create: (req, res) => {
    const { title, description, time, priority, channel, section } = req.body;
    const task = {
      id: String(nextId++),
      title,
      description: description || '',
      time: time || '',
      priority: priority || 'medium',
      channel: channel || null,
      section: section || 'Morning',
      done: false,
      subtasks: [],
    };
    tasks.push(task);
    console.log(`📋 Task created: "${title}"`);
    res.json({ success: true, task });
  },

  update: (req, res) => {
    const { id } = req.params;
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Task not found' });
    tasks[idx] = { ...tasks[idx], ...req.body };
    console.log(`📋 Task updated: "${tasks[idx].title}"`);
    res.json({ success: true, task: tasks[idx] });
  },

  remove: (req, res) => {
    const { id } = req.params;
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Task not found' });
    const removed = tasks.splice(idx, 1)[0];
    console.log(`🗑️ Task deleted: "${removed.title}"`);
    res.json({ success: true });
  },
};

module.exports = { taskHandlers };
