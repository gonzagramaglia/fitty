import { Connection, Client } from '@temporalio/client';

let temporalClient: Client | null = null;

/**
 * Retrieves or initializes the singleton Temporal Client instance.
 * @returns {Promise<Client>} A connected Temporal Client
 */
export async function getTemporalClient() {
  if (temporalClient) return temporalClient;

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

  const connection = await Connection.connect(connectionOptions);
  
  temporalClient = new Client({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE || 'default',
  });
  
  return temporalClient;
}
