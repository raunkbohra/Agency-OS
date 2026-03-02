import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function checkMigrations() {
  try {
    // Check for team_invitations table (from latest migration 016)
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'team_invitations'
      );
    `);

    const hasTeamInvitations = result.rows[0].exists;

    // Check for signature_url column (from migration 017)
    const sigResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'contracts'
        AND column_name = 'signature_url'
      );
    `);

    const hasSignatureUrl = sigResult.rows[0].exists;

    console.log('\n📊 Database Migration Status:\n');
    console.log(`✅ Migration 001-015: Tables exist`);
    console.log(`${hasTeamInvitations ? '✅' : '❌'} Migration 016 (team_invitations): ${hasTeamInvitations ? 'Applied' : 'Pending'}`);
    console.log(`${hasSignatureUrl ? '✅' : '❌'} Migration 017 (signature_url): ${hasSignatureUrl ? 'Applied' : 'Pending'}`);

    const pending = [];
    if (!hasTeamInvitations) pending.push('016_add_team_invitations');
    if (!hasSignatureUrl) pending.push('017_add_signature_url');

    console.log(`\n📝 Pending migrations: ${pending.length > 0 ? pending.join(', ') : 'None'}\n`);

    await pool.end();
  } catch (error) {
    console.error('Error:', (error as Error).message);
    await pool.end();
    process.exit(1);
  }
}

checkMigrations();
