import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function seedMigrationHistory() {
  try {
    console.log('🌱 Seeding migration history...\n');

    // All migrations that have already been applied
    const appliedMigrations = [
      '001_init_schema',
      '002_add_invoice_columns',
      '003_add_payments_table',
      '004_add_deliverables_tables',
      '005_add_client_token',
      '006_add_payment_provider_tables',
      '007_add_contracts_tables',
      '008_add_billing_start_policy',
      '009_add_billing_policy_to_client_plans',
      '010_add_billing_period_to_invoices',
      '011_add_agency_profile_fields',
      '012_add_agency_address_fields',
      '013_add_client_address_fields',
      '014_add_contract_signing_tokens',
      '015_add_client_auth'
    ];

    for (const migration of appliedMigrations) {
      await pool.query(
        'INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING',
        [migration]
      );
      console.log(`✅ Recorded: ${migration}`);
    }

    console.log(`\n✨ Seeded ${appliedMigrations.length} migration records\n`);
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    await pool.end();
    process.exit(1);
  }
}

seedMigrationHistory();
