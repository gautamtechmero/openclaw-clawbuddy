# 🐾 openclaw-clawbuddy

> Pair your **Claw Buddy** mobile app with your self-hosted Openclaw instance.

This is the server-side plugin that bridges the [Claw Buddy](https://github.com/user/claw-buddy-app) mobile app with your Openclaw AI gateway. It handles pairing, exposes a local API for tasks/habits/expenses/journal, and sets up real-time WebSocket communication.

---

## Quick Start

```bash
npx github:gautamtechmero/openclaw-clawbuddy setup --code CB-XXXX-XXXX-XXXX
```

That's it. The command will:

1. ✅ Detect your Openclaw installation
2. ✅ Install the Claw Buddy plugin
3. ✅ Set up local network + API server
4. ✅ Initialize SQLite database (perstistent storage for tasks/habits/expenses)
5. ✅ Generate a pairing key (+ QR code)
6. ✅ Start the WebSocket + HTTP server

---

## How Pairing Works

```
┌──────────────────┐         ┌──────────────────────┐
│  Claw Buddy App  │         │  Your Openclaw Server │
│  (Mobile)        │         │  (This plugin)        │
└────────┬─────────┘         └──────────┬────────────┘
         │                              │
         │  1. Generate session code    │
         │     CB-XXXX-XXXX-XXXX        │
         │                              │
         │  2. User runs:               │
         │     npx github:gautam...     │
         │     setup --code CB-XXXX     │
         │                              │
         │  3. Plugin generates         │
         │     pairing key (CB-eyJ...)  │
         │                              │
         │  4. User pastes key in app   │
         │◄─────────────────────────────│
         │                              │
         │  5. App verifies key         │
         │─────────────────────────────►│
         │                              │
         │  6. Connected! 🎉            │
         │◄────────────────────────────►│
         │     WebSocket + HTTP API     │
         │                              │
```

---

## API Endpoints

Once the server is running, the following endpoints are available:

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health check |
| `POST` | `/pair/verify` | Verify pairing key |

### Protected (requires `Authorization: Bearer <auth>`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/briefing` | Daily AI briefing |
| `GET` | `/connection/test` | Connection channel status |
| `GET/POST` | `/tasks` | Task management |
| `PUT/DELETE` | `/tasks/:id` | Update/delete task |
| `GET/POST` | `/habits` | Habit tracking |
| `POST` | `/habits/:id/checkin` | Check in to a habit |
| `GET/POST` | `/expenses` | Expense logging |
| `GET` | `/expenses/summary` | Budget breakdown |
| `GET/POST` | `/journal` | Journal entries |
| `GET/PUT` | `/settings` | Instance settings |
| `POST` | `/push/register` | Register push token |

### WebSocket (`ws://host:18789`)
| Message Type | Description |
|-------------|-------------|
| `auth` | Authenticate with token |
| `chat` | Send chat message to Claw AI |
| `ping` | Keepalive ping |

---

## Pairing Key Format

The pairing key is a base64-encoded JSON payload prefixed with `CB-`:

```json
{
  "version": "1",
  "instanceId": "uuid",
  "auth": "shared-secret",
  "sessionCode": "CB-XXXX-XXXX-XXXX",
  "connections": {
    "local": "ws://192.168.1.x:18789",
    "http": "http://192.168.1.x:18790",
    "cloudflare": null,
    "telegram": null,
    "whatsapp": null
  },
  "userName": "...",
  "expoPushToken": null
}
```

---

## Development

```bash
# Clone the repo
git clone https://github.com/user/openclaw-clawbuddy.git
cd openclaw-clawbuddy

# Install dependencies
npm install

# Run with a test code
node bin/cli.js setup --code CB-TEST-1234-ABCD
```

---

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `18789` | WebSocket | Real-time chat & events |
| `18790` | HTTP | REST API for app data |

---

## License

MIT

---

Built with 🐾 for the [Openclaw](https://github.com/user/openclaw) ecosystem.
