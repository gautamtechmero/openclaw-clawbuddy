/**
 * Journal handlers — in-memory store for demo/testing
 */

const moods = ['😔', '😐', '🙂', '😊', '🤩'];

let entries = [
  { id: '1', date: '2024-03-20', time: '8:45 PM', mood: '🤩', moodLabel: 'Inspired', text: 'Had an amazing day at the park with friends. The weather was perfect and I finished reading Atomic Habits.', tags: ['#Friends', '#Nature', '#Reading'] },
  { id: '2', date: '2024-03-19', time: '10:12 PM', mood: '😊', moodLabel: 'Happy', text: 'Productive day at work. Finished the design review and got great feedback from the team.', tags: ['#Work', '#Design'] },
  { id: '3', date: '2024-03-18', time: '9:30 PM', mood: '😐', moodLabel: 'Neutral', text: 'Regular day. Nothing special happened but managed to complete my habits.', tags: ['#Routine'] },
];

let nextId = 4;

const journalHandlers = {
  list: (req, res) => {
    res.json({ entries, total: entries.length });
  },

  create: (req, res) => {
    const { mood, text, tags } = req.body;
    const now = new Date();
    const entry = {
      id: String(nextId++),
      date: now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      mood: mood || '🙂',
      moodLabel: getMoodLabel(mood || '🙂'),
      text: text || '',
      tags: tags || [],
    };
    entries.unshift(entry);
    console.log(`📓 Journal entry: ${entry.mood} "${text?.substring(0, 50)}..."`);
    res.json({ success: true, entry });
  },
};

function getMoodLabel(mood) {
  const labels = { '😔': 'Sad', '😐': 'Neutral', '🙂': 'Okay', '😊': 'Happy', '🤩': 'Inspired' };
  return labels[mood] || 'Okay';
}

module.exports = { journalHandlers };
