import 'dotenv/config';
import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities';
import { startChatServer } from './server';

/**
 * Initializes and starts the Temporal worker for processing AI tasks.
 * The Express chat/analyze server always starts regardless of Temporal connectivity.
 * The Temporal worker only starts if TEMPORAL_ADDRESS is configured and reachable.
 * @returns {Promise<void>}
 */
async function run() {
  // Always start the Express server (chat + analyze endpoints)
  const chatServer = startChatServer();

  // Skip Temporal worker if address is not configured (allows Express-only mode)
  if (!process.env.TEMPORAL_ADDRESS) {
    console.warn('TEMPORAL_ADDRESS not set — running in Express-only mode (no AI worker).');
    return;
  }

  let connectionOptions: Record<string, unknown> = {
    address: process.env.TEMPORAL_ADDRESS,
  };

  // Support mTLS for Temporal Cloud
  if (process.env.TEMPORAL_TLS_CERT && process.env.TEMPORAL_TLS_KEY) {
    connectionOptions.tls = {
      clientCertPair: {
        crt: Buffer.from(process.env.TEMPORAL_TLS_CERT, 'utf-8'),
        key: Buffer.from(process.env.TEMPORAL_TLS_KEY, 'utf-8'),
      },
    };
  }

  try {
    const connection = await NativeConnection.connect(connectionOptions);

    const worker = await Worker.create({
      connection,
      namespace: process.env.TEMPORAL_NAMESPACE || 'default',
      workflowsPath: require.resolve('./workflows'),
      activities,
      taskQueue: 'fitty-ai-tasks',
    });

    // Register graceful shutdown handlers
    process.on('SIGINT', () => {
      console.log('Received SIGINT, shutting down worker...');
      worker.shutdown();
    });
    process.on('SIGTERM', () => {
      console.log('Received SIGTERM, shutting down worker...');
      worker.shutdown();
    });

    console.log(`Worker connected to ${connectionOptions.address}`);
    console.log(`Listening on task queue: fitty-ai-tasks in namespace: ${process.env.TEMPORAL_NAMESPACE || 'default'}`);

    await worker.run();

    // Close connection and HTTP server after worker has gracefully stopped
    chatServer.close();
    await connection.close();
  } catch (err) {
    console.error('Temporal worker failed to connect:', err);
    console.log('Express server remains running for chat/analyze endpoints.');
    // Don't exit — Express is still serving
  }
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
