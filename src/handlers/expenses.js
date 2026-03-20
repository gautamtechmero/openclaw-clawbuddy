/**
 * Expense handlers — in-memory store for demo/testing
 */

let expenses = [
  { id: '1', amount: 450, category: 'Food', note: 'Starbucks', date: '2024-03-20' },
  { id: '2', amount: 120, category: 'Bills', note: 'Phone recharge', date: '2024-03-20' },
  { id: '3', amount: 270, category: 'Shopping', note: 'Amazon', date: '2024-03-19' },
  { id: '4', amount: 1800, category: 'Rent', note: 'Electricity bill', date: '2024-03-18' },
];

const budgets = {
  Food: 5000,
  Shopping: 3000,
  Rent: 15000,
  Bills: 2000,
};

let nextId = 5;

const expenseHandlers = {
  list: (req, res) => {
    res.json({ expenses, total: expenses.length });
  },

  create: (req, res) => {
    const { amount, category, note } = req.body;
    const expense = {
      id: String(nextId++),
      amount: Number(amount),
      category: category || 'Food',
      note: note || '',
      date: new Date().toISOString().split('T')[0],
    };
    expenses.push(expense);
    console.log(`💰 Expense logged: ₹${amount} — ${category}`);
    res.json({ success: true, expense });
  },

  summary: (req, res) => {
    const totals = {};
    for (const exp of expenses) {
      totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
    }

    const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

    const categories = Object.entries(totals).map(([name, spent]) => ({
      name,
      spent,
      budget: budgets[name] || 5000,
      percentage: Math.round((spent / (budgets[name] || 5000)) * 100),
    }));

    res.json({
      totalSpent: grandTotal,
      totalBudget: Object.values(budgets).reduce((a, b) => a + b, 0),
      categories,
      insight: `You've spent ₹${grandTotal} this month. Food is your highest category.`,
    });
  },
};

module.exports = { expenseHandlers };
