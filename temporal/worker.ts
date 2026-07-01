import 'dotenv/config';
import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities';

/**
 * Initializes and starts the Temporal worker for processing AI tasks.
 * Connects to the local Temporal server and listens on 'fitty-ai-tasks'.
 * @returns {Promise<void>}
 */
async function run() {
  let connectionOptions: any = {
    address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
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
  
  // Close connection after worker has gracefully stopped
  await connection.close();
}

run().catch((err) => {
  console.error('Worker failed', err);
  process.exit(1);
});
