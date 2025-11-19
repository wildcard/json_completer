/**
 * Express Middleware Example
 *
 * This example demonstrates how to integrate json_completer
 * into an Express application for completing partial JSON in API requests.
 *
 * Install dependencies:
 *   npm install express @types/express
 *
 * Run: npx tsx examples/express.ts
 * Test: curl -X POST http://localhost:3000/complete -H "Content-Type: text/plain" -d '{"test":'
 */

import express, { Request, Response, NextFunction } from 'express';
import { JsonCompleterClient, complete } from '@json-completer/client';

const app = express();
const port = 3000;

// Initialize client once for the application
const client = new JsonCompleterClient({
  timeout: 10000, // 10 second timeout
});

// Middleware to parse text bodies
app.use(express.text({ type: 'text/plain' }));
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'json-completer' });
});

// One-shot completion endpoint
app.post('/complete', async (req: Request, res: Response) => {
  try {
    const partialJson = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    if (!partialJson) {
      return res.status(400).json({
        error: 'Missing JSON content in request body',
      });
    }

    const result = await complete(partialJson);

    res.json({
      success: true,
      input: partialJson,
      completed: result,
      parsed: JSON.parse(result),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Streaming session endpoint (maintains state)
const sessions = new Map<string, JsonCompleterClient>();

app.post('/stream/start', (req: Request, res: Response) => {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessions.set(sessionId, new JsonCompleterClient());

  res.json({
    success: true,
    sessionId,
    message: 'Streaming session started',
  });
});

app.post('/stream/chunk', async (req: Request, res: Response) => {
  try {
    const { sessionId, chunk } = req.body;

    if (!sessionId || !chunk) {
      return res.status(400).json({
        error: 'Missing sessionId or chunk in request body',
      });
    }

    const sessionClient = sessions.get(sessionId);

    if (!sessionClient) {
      return res.status(404).json({
        error: `Session ${sessionId} not found. Start a session first with POST /stream/start`,
      });
    }

    const result = await sessionClient.completeIncremental(chunk);

    res.json({
      success: true,
      sessionId,
      chunk,
      completed: result,
      parsed: JSON.parse(result),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post('/stream/end', (req: Request, res: Response) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      error: 'Missing sessionId in request body',
    });
  }

  const sessionClient = sessions.get(sessionId);

  if (!sessionClient) {
    return res.status(404).json({
      error: `Session ${sessionId} not found`,
    });
  }

  sessions.delete(sessionId);

  res.json({
    success: true,
    message: `Session ${sessionId} ended`,
  });
});

// Batch completion endpoint
app.post('/batch', async (req: Request, res: Response) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        error: 'Expected "items" array in request body',
      });
    }

    const results = await Promise.all(
      items.map(async (item, index) => {
        try {
          const completed = await client.complete(item);
          return {
            index,
            success: true,
            input: item,
            completed,
            parsed: JSON.parse(completed),
          };
        } catch (error: any) {
          return {
            index,
            success: false,
            input: item,
            error: error.message,
          };
        }
      })
    );

    res.json({
      success: true,
      count: items.length,
      results,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Cleanup old sessions periodically (every 5 minutes)
setInterval(() => {
  console.log(`Active sessions: ${sessions.size}`);
  // In production, you'd want to track session timestamps and clean up old ones
}, 5 * 60 * 1000);

// Start server
app.listen(port, () => {
  console.log(`\nJSON Completer API Server`);
  console.log(`=========================`);
  console.log(`Server running at http://localhost:${port}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /health              - Health check`);
  console.log(`  POST /complete            - One-shot completion`);
  console.log(`  POST /batch               - Batch completion`);
  console.log(`  POST /stream/start        - Start streaming session`);
  console.log(`  POST /stream/chunk        - Process chunk in session`);
  console.log(`  POST /stream/end          - End streaming session`);
  console.log(`\nExample requests:`);
  console.log(`  curl -X POST http://localhost:${port}/complete \\`);
  console.log(`    -H "Content-Type: text/plain" \\`);
  console.log(`    -d '{"test":'`);
  console.log(``);
  console.log(`  curl -X POST http://localhost:${port}/batch \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"items": ["{\\"a\\":", "{\\"b\\":"]}'`);
  console.log(``);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  sessions.clear();
  process.exit(0);
});
