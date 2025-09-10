const { sequelize } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  try {
    console.log('Starting database migrations...');

    // Ensure database connection
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Create migrations table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS SequelizeMeta (
        name VARCHAR(255) NOT NULL PRIMARY KEY
      )
    `);

    // Get list of migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    // Get already executed migrations
    const [executedMigrations] = await sequelize.query(
      'SELECT name FROM SequelizeMeta ORDER BY name'
    );
    const executedNames = executedMigrations.map(m => m.name);

    // Run pending migrations
    for (const file of migrationFiles) {
      if (!executedNames.includes(file)) {
        console.log(`Running migration: ${file}`);

        const migration = require(path.join(migrationsDir, file));
        await migration.up(sequelize.getQueryInterface(), sequelize.constructor);

        // Record migration as executed
        await sequelize.query(
          'INSERT INTO SequelizeMeta (name) VALUES (?)',
          { replacements: [file] }
        );

        console.log(`✓ Migration ${file} completed`);
      } else {
        console.log(`⏭ Migration ${file} already executed`);
      }
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };