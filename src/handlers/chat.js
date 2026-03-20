/**
 * Chat handler — AI-like responses for Claw Buddy
 * 
 * In production, this would forward to the actual Openclaw AI engine.
 * For testing, it provides contextual canned responses.
 */

const CLAW_RESPONSES = [
  {
    keywords: ['hi', 'hello', 'hey', 'sup'],
    response: "Hey there! 🐾 I'm Claw, your AI buddy. What can I help you with today?",
    actions: [
      { label: 'Show my tasks', type: 'navigate', target: 'tasks' },
      { label: 'How am I doing?', type: 'summary' },
    ],
  },
  {
    keywords: ['task', 'todo', 'remind'],
    response: "You have 4 tasks today. The most urgent one is 'Review Q3 Report' at 10:00 AM. Want me to help you prioritize?",
    actions: [
      { label: 'Show all tasks', type: 'navigate', target: 'tasks' },
      { label: 'Add a new task', type: 'navigate', target: 'tasks/new' },
    ],
  },
  {
    keywords: ['habit', 'streak', 'water', 'meditat'],
    response: "Great progress! 💧 Your water habit has a 45-day streak going. Your meditation streak is at 12 days. Keep it up!",
    actions: [
      { label: 'Check in now', type: 'navigate', target: 'habits' },
    ],
  },
  {
    keywords: ['spend', 'money', 'budget', 'expense'],
    response: "You've spent ₹840 today out of your ₹1,200 daily budget. Food was your biggest category at ₹450. Want to log something?",
    actions: [
      { label: 'Log expense', type: 'navigate', target: 'expenses/new' },
      { label: 'See breakdown', type: 'navigate', target: 'expenses' },
    ],
  },
  {
    keywords: ['journal', 'mood', 'feel', 'day'],
    response: "I noticed you've been feeling great this week! 🤩 Your mood trend is on the rise. Want to journal about today?",
    actions: [
      { label: 'Write entry', type: 'navigate', target: 'journal' },
    ],
  },
  {
    keywords: ['calendar', 'schedule', 'meeting', 'event'],
    response: "You have 3 events today: Design Review at 10 AM, Daily Workout at 5 PM, and Anniversary Dinner at 8 PM. Busy day ahead!",
    actions: [
      { label: 'View calendar', type: 'navigate', target: 'calendar' },
    ],
  },
  {
    keywords: ['help', 'what can you do', 'feature'],
    response: "I can help you with:\n• 📋 Managing tasks & reminders\n• 🎯 Tracking habits & streaks\n• 💰 Logging expenses & budgets\n• 📓 Journaling & mood tracking\n• 📅 Calendar & scheduling\n\nJust ask me anything!",
    actions: [],
  },
];

const DEFAULT_RESPONSE = {
  response: "That's interesting! I'm still learning, but I'm here to help. Try asking me about your tasks, habits, expenses, or mood! 🐾",
  actions: [
    { label: 'Show my tasks', type: 'navigate', target: 'tasks' },
    { label: 'Daily summary', type: 'summary' },
  ],
};

async function chatHandler(message, userName) {
  // Simulate thinking delay
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 1000));

  const lower = message.toLowerCase();

  for (const entry of CLAW_RESPONSES) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return {
        message: entry.response,
        actions: entry.actions,
        timestamp: Date.now(),
      };
    }
  }

  return {
    message: DEFAULT_RESPONSE.response,
    actions: DEFAULT_RESPONSE.actions,
    timestamp: Date.now(),
  };
}

module.exports = { chatHandler };
