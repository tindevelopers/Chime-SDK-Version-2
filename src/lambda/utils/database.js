const { Pool } = require('pg');
const connectionWarmer = require('./connection-warmer');

class DatabaseManager {
  constructor() {
    this.pool = null;
    this.isConnecting = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
    this.baseDelay = 1000; // 1 second
  }

  // Initialize the connection pool
  initializePool() {
    if (this.pool) {
      return this.pool;
    }

    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 30000, // 30 seconds for Aurora cold start
      idleTimeoutMillis: 60000, // 60 seconds
      max: 10,
      min: 1, // Keep at least 1 connection warm
      acquireTimeoutMillis: 60000, // 60 seconds to acquire connection
      createTimeoutMillis: 30000, // 30 seconds to create connection
      destroyTimeoutMillis: 5000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 2000
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('🔥 Database pool error:', err);
    });

    this.pool.on('connect', () => {
      console.log('✅ Database connection established');
      this.connectionAttempts = 0;
    });

    return this.pool;
  }

  // Exponential backoff delay
  getRetryDelay(attempt) {
    return Math.min(this.baseDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
  }

  // Wake up the database with retry logic
  async wakeUpDatabase() {
    const pool = this.initializePool();
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 Database wake-up attempt ${attempt}/${this.maxRetries}...`);
        
        const client = await pool.connect();
        
        // Test with a simple query
        const result = await client.query('SELECT NOW() as current_time');
        client.release();
        
        console.log('✅ Database is awake and responsive!');
        console.log('🕐 Current time:', result.rows[0].current_time);
        
        return true;
        
      } catch (error) {
        console.error(`❌ Wake-up attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.maxRetries) {
          const delay = this.getRetryDelay(attempt - 1);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error('💥 All wake-up attempts failed!');
          throw new Error(`Database wake-up failed after ${this.maxRetries} attempts: ${error.message}`);
        }
      }
    }
  }

  // Get a database client with retry logic
  async getClient() {
    const pool = this.initializePool();
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const client = await pool.connect();
        return client;
        
      } catch (error) {
        console.error(`❌ Connection attempt ${attempt} failed:`, error.message);
        
        // Check if we should try warming the database
        if (connectionWarmer.shouldWarmDatabase(error)) {
          console.log('🔄 Database appears to be cold, attempting warming...');
          
          // Try warming on first timeout error
          if (attempt === 1) {
            const warmed = await connectionWarmer.warmDatabase();
            if (warmed) {
              console.log('✅ Database warming completed, retrying connection...');
              // Give extra time for warming to take effect
              await new Promise(resolve => setTimeout(resolve, 10000));
              continue; // Skip the normal delay and retry immediately
            }
          }
          
          if (attempt < this.maxRetries) {
            const delay = this.getRetryDelay(attempt - 1);
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        } else {
          // Non-timeout error, fail immediately
          throw error;
        }
      }
    }
    
    throw new Error(`Failed to get database client after ${this.maxRetries} attempts`);
  }

  // Execute query with retry logic
  async executeQuery(query, params = []) {
    let client;
    
    try {
      client = await this.getClient();
      const result = await client.query(query, params);
      return result;
      
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  // Execute transaction with retry logic
  async executeTransaction(callback) {
    let client;
    
    try {
      client = await this.getClient();
      await client.query('BEGIN');
      
      const result = await callback(client);
      
      await client.query('COMMIT');
      return result;
      
    } catch (error) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('❌ Rollback failed:', rollbackError);
        }
      }
      throw error;
      
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  // Health check
  async healthCheck() {
    try {
      const result = await this.executeQuery('SELECT 1 as health_check');
      return { healthy: true, result: result.rows[0] };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  // Close the pool
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

// Export singleton instance
const dbManager = new DatabaseManager();
module.exports = dbManager;
