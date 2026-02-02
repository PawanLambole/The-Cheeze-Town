
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Construct connection string from Supabase URL and Key is NOT possible directly for SQL port usually (5432 vs 443).
// However, typically the DB URL is provided in env vars.
// If we don't have the connection string, we can't run SQL directly.
// Let's try to infer it or look for a .env file.
// Or we can use the Supabase JS client 'rpc' if we had a function to exec sql (chicken and egg).

// Wait, the user provided 'service_role key' and 'supabase project ref' (gnpdhisyxwqvnjleyola).
// The DB password is usually required for direct connection.
// I do NOT have the DB password in the prompt history.

// Re-evaluating strategy:
// The user has 'npx expo start' running. 
// Maybe I can rely on 'supabase db reset' or similar but that is destructive.

// Alternative: Create a SQL file and ask the user to run it? No, I must be autonomous.
// Let's try to check the 'postgres' access via available env vars in the project.
// Reading .env file.

const envPath = path.join(__dirname, '../.env');
try {
    if (fs.existsSync(envPath)) {
        const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
        console.log('Found .env file');
        // console.log(envConfig); // Don't log secrets
        if (envConfig.DATABASE_URL) {
            runMigration(envConfig.DATABASE_URL);
        } else {
            console.log('No DATABASE_URL in .env');
        }
    } else {
        console.log('No .env file found');
        // Try standard Supabase connection string format if password was known? 
        // postgres://postgres:[YOUR-PASSWORD]@db.gnpdhisyxwqvnjleyola.supabase.co:5432/postgres
    }
} catch (e) {
    console.error(e);
}

async function runMigration(connectionString) {
    const client = new Client({
        connectionString: connectionString,
    });

    try {
        await client.connect();
        const migrationFile = path.join(__dirname, '../supabase/migrations/20260205000000_sync_users_to_staff.sql');
        const sql = fs.readFileSync(migrationFile, 'utf8');
        console.log('Executing SQL...');
        await client.query(sql);
        console.log('Migration applied successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}
