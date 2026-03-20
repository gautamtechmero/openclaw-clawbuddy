const { getDb } = require('../database');
const { v4: uuidv4 } = require('uuid');

const expenseHandlers = {
  list: async (req, res) => {
    const db = getDb();
    
    try {
      const expenses = await db.all('SELECT * FROM expenses ORDER BY date DESC');
      res.json({ expenses, total: expenses.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create: async (req, res) => {
    const db = getDb();
    const { amount, category, date, icon, color } = req.body;
    const id = uuidv4();
    
    try {
      await db.run(
        'INSERT INTO expenses (id, amount, category, date, icon, color) VALUES (?, ?, ?, ?, ?, ?)',
        [id, Number(amount), category || 'Other', date || new Date().toISOString().split('T')[0], icon || 'Wallet', color || '#0A84FF']
      );
      
      const expense = await db.get('SELECT * FROM expenses WHERE id = ?', [id]);
      console.log(`💰 Expense logged: ₹${amount} — ${category}`);
      res.json({ success: true, expense });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  summary: async (req, res) => {
    const db = getDb();
    
    try {
      const spending = await db.get('SELECT SUM(amount) as spent FROM expenses');
      const budgetRow = await db.get('SELECT amount FROM budget WHERE id = 1');
      
      const spent = spending.spent || 0;
      const budget = budgetRow.amount || 20000;

      // Group by category
      const categoriesRaw = await db.all('SELECT category, SUM(amount) as spent FROM expenses GROUP BY category');
      
      const categories = categoriesRaw.map(c => ({
        name: c.category,
        spent: c.spent,
        budget: Math.round(budget / (categoriesRaw.length || 1)), // Simple proportional budget for now
        percentage: Math.round((c.spent / (budget / (categoriesRaw.length || 1))) * 100)
      }));

      res.json({
        totalSpent: spent,
        totalBudget: budget,
        categories,
        insight: `You've spent ₹${spent.toLocaleString()} this month.`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = { expenseHandlers };
