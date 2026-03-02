# Database Migrations to Apply

Two new migrations have been created and need to be applied to your databases:

## Local Database

```bash
# Source environment variables
source .env.local

# Apply migration 012 - Agency address fields
psql $DATABASE_URL -f lib/migrations/012_add_agency_address_fields.sql

# Apply migration 013 - Client address fields  
psql $DATABASE_URL -f lib/migrations/013_add_client_address_fields.sql

# Verify migrations applied
psql $DATABASE_URL -c "\d agencies" | grep -E "address|billing"
psql $DATABASE_URL -c "\d clients" | grep -E "address|billing"
```

Expected output:
```
 address           | text    |
 billing_address   | text    |
```

## Neon Production Database

If you have a Neon production database, apply the same migrations:

```bash
# Set your Neon database URL
export NEON_DATABASE_URL="postgresql://user:password@your-neon-host/dbname"

# Apply migrations
psql $NEON_DATABASE_URL -f lib/migrations/012_add_agency_address_fields.sql
psql $NEON_DATABASE_URL -f lib/migrations/013_add_client_address_fields.sql

# Verify
psql $NEON_DATABASE_URL -c "\d agencies" | grep -E "address|billing"
psql $NEON_DATABASE_URL -c "\d clients" | grep -E "address|billing"
```

## SQL Statements

If you prefer to run SQL directly in a database client:

### Migration 012 - Agency Address Fields
```sql
ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS billing_address TEXT;
```

### Migration 013 - Client Address Fields
```sql
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS billing_address TEXT;
```

## After Applying Migrations

1. Restart your dev server:
```bash
npm run dev
```

2. Test the new features:
   - Navigate to `/dashboard/settings`
   - You should see the new "Address Information" section
   - Upload a logo (will be compressed to WebP)
   - Add office address
   - Generate an invoice to see the address in the PDF

3. Verify database changes:
```bash
# List all columns in agencies table
psql $DATABASE_URL -c "\d agencies"

# List all columns in clients table
psql $DATABASE_URL -c "\d clients"
```

## Status

- ✅ Migrations created
- ✅ Code updated (interfaces, APIs, settings page)
- ✅ Build tested and passing
- ⏳ **Awaiting migration execution** (database schema update)

