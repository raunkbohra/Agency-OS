import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://raunakbohra@localhost/agency_os';

// Create a singleton client instance
let client: Client | null = null;

export async function getDbClient() {
  if (!client) {
    client = new Client({
      connectionString,
    });
    try {
      await client.connect();
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  }
  return client;
}

export async function closeDb() {
  if (client) {
    await client.end();
    client = null;
  }
}

export default getDbClient;
