const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let db;

async function initDb() {
  db = await open({
    filename: path.join(__dirname, '../data/openclaw.db'),
    driver: sqlite3.Database
  });

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      time TEXT,
      priority TEXT DEFAULT 'medium',
      channel TEXT,
      section TEXT DEFAULT 'Morning',
      done INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT,
      description TEXT,
      color TEXT DEFAULT '#0A84FF',
      streak INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id TEXT,
      date TEXT NOT NULL,
      status INTEGER DEFAULT 1,
      FOREIGN KEY(habit_id) REFERENCES habits(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      amount INTEGER NOT NULL,
      category TEXT,
      date TEXT,
      icon TEXT,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS budget (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      amount INTEGER DEFAULT 20000
    );

    CREATE TABLE IF NOT EXISTS journal (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      mood INTEGER DEFAULT 3,
      date TEXT NOT NULL
    );
  `);

  // Initialize budget if not exists
  const budget = await db.get('SELECT * FROM budget WHERE id = 1');
  if (!budget) {
    await db.run('INSERT INTO budget (id, amount) VALUES (1, 20000)');
  }

  // Seed initial data for demo if tables are empty
  const taskCount = await db.get('SELECT COUNT(*) as count FROM tasks');
  if (taskCount.count === 0) {
    await db.run(`INSERT INTO tasks (id, title, description, time, priority, section, done) VALUES 
      ('1', 'Review Q3 Report', 'Go through the final quarterly report', '10:00 AM', 'high', 'Morning', 0),
      ('2', 'Call with Architecture Team', 'Discuss new microservices plan', '1:30 PM', 'medium', 'Afternoon', 0),
      ('3', 'Update Design System', 'Sync Figma tokens with code', '4:00 PM', 'low', 'Afternoon', 0)`);
  }

  const habitCount = await db.get('SELECT COUNT(*) as count FROM habits');
  if (habitCount.count === 0) {
    await db.run(`INSERT INTO habits (id, name, emoji, streak, color) VALUES 
      ('1', 'Stay hydrated', '💧', 12, '#0A84FF'),
      ('2', 'Meditate', '🧘', 5, '#5E5CE6'),
      ('3', 'Reading', '📚', 8, '#30D158')`);
  }

  console.log('✅ Database initialized and seeded.');
  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

module.exports = { initDb, getDb };
