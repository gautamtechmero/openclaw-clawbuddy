/**
 * Habit handlers — in-memory store for demo/testing
 */

let habits = [
  { id: '1', name: 'Drink Water', icon: '💧', description: '2L daily hydration', frequency: 'daily', currentStreak: 45, bestStreak: 82, completionRate: 94, todayDone: false, history: [true, true, false, true, true, true, true] },
  { id: '2', name: 'Meditation', icon: '🧘', description: '15 min morning zen', frequency: 'daily', currentStreak: 12, bestStreak: 30, completionRate: 78, todayDone: false, history: [true, true, true, false, true, true, false] },
  { id: '3', name: 'Exercise', icon: '🏃', description: '30 min workout', frequency: 'daily', currentStreak: 3, bestStreak: 21, completionRate: 65, todayDone: false, history: [false, true, true, true, false, false, true] },
  { id: '4', name: 'Reading', icon: '📚', description: '20 pages daily', frequency: 'daily', currentStreak: 0, bestStreak: 15, completionRate: 42, todayDone: false, history: [false, false, true, false, false, true, false] },
  { id: '5', name: 'Clean Eating', icon: '🍎', description: 'No processed food', frequency: 'daily', currentStreak: 15, bestStreak: 60, completionRate: 88, todayDone: false, history: [true, true, true, true, true, true, false] },
];

let nextId = 6;

const habitHandlers = {
  list: (req, res) => {
    res.json({ habits, total: habits.length });
  },

  create: (req, res) => {
    const { name, icon, description, frequency } = req.body;
    const habit = {
      id: String(nextId++),
      name,
      icon: icon || '⭐',
      description: description || '',
      frequency: frequency || 'daily',
      currentStreak: 0,
      bestStreak: 0,
      completionRate: 0,
      todayDone: false,
      history: [false, false, false, false, false, false, false],
    };
    habits.push(habit);
    console.log(`🎯 Habit created: "${name}"`);
    res.json({ success: true, habit });
  },

  checkIn: (req, res) => {
    const { id } = req.params;
    const idx = habits.findIndex(h => h.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Habit not found' });

    habits[idx].todayDone = !habits[idx].todayDone;
    if (habits[idx].todayDone) {
      habits[idx].currentStreak++;
      if (habits[idx].currentStreak > habits[idx].bestStreak) {
        habits[idx].bestStreak = habits[idx].currentStreak;
      }
    } else {
      habits[idx].currentStreak = Math.max(0, habits[idx].currentStreak - 1);
    }
    console.log(`🎯 Habit check-in: "${habits[idx].name}" → ${habits[idx].todayDone ? '✓' : '✗'}`);
    res.json({ success: true, habit: habits[idx] });
  },
};

module.exports = { habitHandlers };
