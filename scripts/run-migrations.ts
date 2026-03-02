import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

interface Migration {
  version: string;
  filename: string;
  content: string;
}

async function ensureMigrationTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(createTableSQL);
}

async function getExecutedMigrations(): Promise<Set<string>> {
  const result = await pool.query('SELECT version FROM schema_migrations ORDER BY version');
  return new Set(result.rows.map(row => row.version));
}

async function loadMigrations(): Promise<Migration[]> {
  const migrationsDir = path.join(__dirname, '..', 'lib', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  return files.map(filename => ({
    version: filename.replace('.sql', ''),
    filename,
    content: fs.readFileSync(path.join(migrationsDir, filename), 'utf8')
  }));
}

async function runMigrations() {
  try {
    console.log('🔄 Initializing migrations table...');
    await ensureMigrationTable();

    console.log('📋 Loading migrations...');
    const migrations = await loadMigrations();
    const executed = await getExecutedMigrations();

    const pending = migrations.filter(m => !executed.has(m.version));

    if (pending.length === 0) {
      console.log('✅ All migrations are up to date!');
      await pool.end();
      process.exit(0);
    }

    console.log(`\n📝 Found ${pending.length} pending migration(s):\n`);
    pending.forEach(m => console.log(`  - ${m.version}`));

    console.log('\n🚀 Running migrations...\n');

    for (const migration of pending) {
      try {
        console.log(`⏳ Running ${migration.version}...`);
        await pool.query(migration.content);
        await pool.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [migration.version]
        );
        console.log(`✅ ${migration.version} completed\n`);
      } catch (error) {
        console.error(`❌ FAILED: ${migration.version}`);
        console.error((error as Error).message);
        throw error;
      }
    }

    console.log('✨ All migrations completed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', (error as Error).message);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();
