// backend/fix-unique-constraint.js
import { pool } from './src/config/database.js';

async function addUniqueConstraint() {
    const client = await pool.connect();
    
    try {
        console.log('Adding unique constraint to torrents table...');
        
        // Drop existing constraints if any
        await client.query(`
            DO $$ 
            DECLARE
                constraint_name text;
            BEGIN
                FOR constraint_name IN 
                    SELECT conname 
                    FROM pg_constraint 
                    WHERE conrelid = 'torrents'::regclass 
                    AND contype = 'u'
                LOOP
                    EXECUTE 'ALTER TABLE torrents DROP CONSTRAINT IF EXISTS ' || constraint_name;
                END LOOP;
            END $$;
        `);
        
        // Add new unique constraint
        await client.query(`
            ALTER TABLE torrents 
            ADD CONSTRAINT torrents_unique_key 
            UNIQUE (tmdb_id, quality, COALESCE(season_number, 0), COALESCE(episode_number, 0), language)
        `);
        
        // Set default values
        await client.query(`
            ALTER TABLE torrents 
            ALTER COLUMN season_number SET DEFAULT 0,
            ALTER COLUMN episode_number SET DEFAULT 0,
            ALTER COLUMN language SET DEFAULT 'English'
        `);
        
        console.log('✅ Unique constraint added successfully!');
        console.log('Now restart your backend server.');
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}
