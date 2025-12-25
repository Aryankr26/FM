import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/database';
import { initWebSocket } from './websocket/server';

const app = createApp();
const server = http.createServer(app);

async function start() {
  server.listen(env.server.port, '0.0.0.0', () => {
    logger.info('Server started', { port: env.server.port });
  });

  try {
    initWebSocket(server);
    logger.info('WebSocket initialized');
  } catch (err) {
    logger.error('WebSocket failed to initialize (continuing without realtime)', { err });
  }

  const tryConnect = async () => {
    try {
      await prisma.$connect();
      logger.info('Database connected');
    } catch (err) {
      logger.error('Database unavailable, retrying', { err });
      setTimeout(() => {
        void tryConnect();
      }, 10_000);
    }
  };

  void tryConnect();
}

void start();
