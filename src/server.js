/**
 * Claw Buddy Server
 * 
 * Runs a WebSocket server + HTTP API that the Claw Buddy mobile app
 * connects to. Handles pairing verification, AI chat, task/habit/expense
 * CRUD, and push notification registration.
 */

const http = require('http');
const express = require('express');
const { WebSocketServer } = require('ws');
const { taskHandlers } = require('./handlers/tasks');
const { habitHandlers } = require('./handlers/habits');
const { expenseHandlers } = require('./handlers/expenses');
const { journalHandlers } = require('./handlers/journal');
const { chatHandler } = require('./handlers/chat');
const { initDb, getDb } = require('./database');

async function startServer({ pairingData, pairingKey, wsPort = 18789, httpPort = 18790 }) {
  // Initialize database
  await initDb();

  return new Promise((resolve) => {
    // ═══════════════════════════════════════
    // HTTP API Server
    // ═══════════════════════════════════════
    const app = express();
    app.use(express.json());

    // CORS for mobile app
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      if (req.method === 'OPTIONS') return res.sendStatus(200);
      next();
    });

    // Auth middleware — verify pairing key (temporarily disabled for local testing)
    const authMiddleware = (req, res, next) => {
      // const authHeader = req.headers.authorization;
      // if (!authHeader || authHeader !== `Bearer ${pairingData.auth}`) {
      //   return res.status(401).json({ error: 'Unauthorized — invalid auth token' });
      // }
      next();
    };

    // ─── Public Routes ───

    // Health check
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        name: 'Claw Buddy Server',
        version: '1.0.0',
        instanceId: pairingData.instanceId,
        uptime: process.uptime(),
      });
    });

    // Verify pairing (app calls this after user pastes key)
    app.post('/pair/verify', (req, res) => {
      const { key } = req.body;
      if (key === pairingKey) {
        console.log('🐾 Claw Buddy app paired successfully!');
        res.json({ 
          success: true, 
          instanceId: pairingData.instanceId,
          userName: pairingData.userName,
          channels: {
            local: !!pairingData.connections.local,
            cloudflare: !!pairingData.connections.cloudflare,
            telegram: !!pairingData.connections.telegram,
            whatsapp: !!pairingData.connections.whatsapp,
          },
        });
      } else {
        res.status(403).json({ success: false, error: 'Invalid pairing key' });
      }
    });

    // Connection test endpoint
    app.get('/connection/test', authMiddleware, (req, res) => {
      res.json({
        status: 'connected',
        latency: Math.floor(Math.random() * 30) + 5,
        channels: {
          local: { status: 'active', latency: '12ms' },
          cloudflare: { status: 'inactive', reason: 'not configured' },
          telegram: { status: 'inactive', reason: 'not configured' },
          whatsapp: { status: 'inactive', reason: 'not configured' },
        },
      });
    });

    // ─── Protected Routes ───

    // Briefing
    app.get('/briefing', authMiddleware, async (req, res) => {
      const db = getDb();
      const hour = new Date().getHours();
      let greeting = 'Good evening';
      if (hour < 12) greeting = 'Good morning';
      else if (hour < 17) greeting = 'Good afternoon';

      try {
        const tasksToday = await db.get('SELECT COUNT(*) as count FROM tasks WHERE done = 0');
        const habitsPending = await db.get('SELECT COUNT(*) as count FROM habits'); // Simple count for now
        const spending = await db.get('SELECT SUM(amount) as spent FROM expenses');
        const budgetRow = await db.get('SELECT amount FROM budget WHERE id = 1');
        
        const spent = spending.spent || 0;
        const budget = budgetRow.amount || 20000;
        const remaining = budget - spent;

        res.json({
          greeting,
          userName: pairingData.userName,
          briefing: `You have ${tasksToday.count} tasks today, ${habitsPending.count} habits pending, and ₹${remaining.toLocaleString()} left in your budget. Let's go 💪`,
          tasksToday: tasksToday.count,
          habitsPending: habitsPending.count,
          budgetRemaining: remaining,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Tasks API
    app.get('/tasks', authMiddleware, taskHandlers.list);
    app.post('/tasks', authMiddleware, taskHandlers.create);
    app.put('/tasks/:id', authMiddleware, taskHandlers.update);
    app.delete('/tasks/:id', authMiddleware, taskHandlers.remove);

    // Habits API
    app.get('/habits', authMiddleware, habitHandlers.list);
    app.post('/habits', authMiddleware, habitHandlers.create);
    app.post('/habits/:id/checkin', authMiddleware, habitHandlers.checkIn);
    app.delete('/habits/:id', authMiddleware, habitHandlers.remove);

    // Expenses API
    app.get('/expenses', authMiddleware, expenseHandlers.list);
    app.post('/expenses', authMiddleware, expenseHandlers.create);
    app.delete('/expenses/:id', authMiddleware, expenseHandlers.remove);
    app.get('/expenses/summary', authMiddleware, expenseHandlers.summary);

    // Journal API
    app.get('/journal', authMiddleware, journalHandlers.list);
    app.post('/journal', authMiddleware, journalHandlers.create);
    app.delete('/journal/:id', authMiddleware, journalHandlers.remove);

    // AI Chat API
    app.post('/chat', authMiddleware, async (req, res) => {
      try {
        const { message, contextData } = req.body;
        const response = await chatHandler(message, pairingData.userName, contextData);
        res.json(response);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Push token registration
    app.post('/push/register', authMiddleware, (req, res) => {
      const { expoPushToken } = req.body;
      pairingData.expoPushToken = expoPushToken;
      console.log('📱 Push token registered:', expoPushToken);
      res.json({ success: true });
    });

    // Settings
    app.get('/settings', authMiddleware, (req, res) => {
      res.json({
        instanceId: pairingData.instanceId,
        userName: pairingData.userName,
        channels: pairingData.connections,
        version: pairingData.version,
      });
    });

    app.put('/settings', authMiddleware, (req, res) => {
      const { userName } = req.body;
      if (userName) pairingData.userName = userName;
      res.json({ success: true });
    });

    const httpServer = app.listen(httpPort, '0.0.0.0', () => {
      // Server started silently — CLI prints the message
    });

    // ═══════════════════════════════════════
    // WebSocket Server (for real-time chat)
    // ═══════════════════════════════════════
    const wss = new WebSocketServer({ host: '0.0.0.0', port: wsPort });

    wss.on('connection', (ws) => {
      console.log('🔌 Claw Buddy app connected via WebSocket');

      ws.on('message', async (data) => {
        try {
          const msg = JSON.parse(data.toString());

          switch (msg.type) {
            case 'auth':
              // if (msg.token === pairingData.auth) {
                ws.send(JSON.stringify({ type: 'auth_ok', instanceId: pairingData.instanceId }));
                console.log('🔐 WebSocket authenticated (auth disabled for local dev)');
              // } else {
              //   ws.send(JSON.stringify({ type: 'auth_fail' }));
              // }
              break;

            case 'chat':
              const response = await chatHandler(msg.message, pairingData.userName);
              ws.send(JSON.stringify({ type: 'chat_response', ...response }));
              break;

            case 'ping':
              ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
              break;

            default:
              ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
          }
        } catch (e) {
          ws.send(JSON.stringify({ type: 'error', message: e.message }));
        }
      });

      ws.on('close', () => {
        console.log('🔌 Claw Buddy app disconnected');
      });
    });

    // Return a close function
    resolve({
      close: () => {
        wss.close();
        httpServer.close();
      },
    });
  });
}

module.exports = { startServer };
