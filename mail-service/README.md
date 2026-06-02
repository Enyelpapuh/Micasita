# Micasita Mail Service

Node.js service that sends contact form messages to Gmail and exposes a small inbox/reply API.

## Setup

1. Copy `.env.example` to `.env`.
2. Fill Gmail OAuth values and inbox address.
3. Install dependencies:

```bash
npm install
```

4. Start the service:

```bash
npm run dev
```

## Endpoints

- `POST /api/contact/messages` - sends a contact form message to the internal Gmail inbox.
- `GET /api/contact/messages` - lists recent contact messages from Gmail inbox.
- `GET /api/contact/messages/:messageId` - reads a message.
- `POST /api/contact/messages/:messageId/reply` - sends a reply to the sender.
- `GET /health` - health check.
