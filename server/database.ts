import { Pool, PoolClient, QueryResult } from 'pg';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

class Database {
  private pool: Pool;
  private static instance: Database;

  private constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl,
      max: config.max || 20,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 10000,
    });

    // Handle pool errors
    this.pool.on('error', (err: Error) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      const config: DatabaseConfig = {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        database: process.env.DATABASE_NAME || 'attendance_db',
        user: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || '',
        ssl: process.env.DATABASE_SSL === 'true',
        max: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20'),
        idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000'),
        connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '10000'),
      };

      Database.instance = new Database(config);
    }

    return Database.instance;
  }

  public async query<T = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries (over 100ms)
      if (duration > 100) {
        console.warn('Slow query detected:', {
          text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          duration: `${duration}ms`,
          rows: result.rowCount
        });
      }

      return result;
    } catch (error) {
      console.error('Database query error:', {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        params: params?.length ? '[...]' : undefined,
        error: (error as Error).message
      });
      throw error;
    }
  }

  public async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  public async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    try {
      const result = await this.query('SELECT 1 as health');
      if (result.rows[0]?.health === 1) {
        return { status: 'healthy', message: 'Database connection successful' };
      }
      return { status: 'unhealthy', message: 'Unexpected health check response' };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        message: `Database connection failed: ${(error as Error).message}` 
      };
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }

  // Helper method for parameterized queries with named parameters
  public buildQuery(query: string, namedParams: Record<string, any>): { text: string; values: any[] } {
    let paramIndex = 1;
    const values: any[] = [];
    const paramMap: Record<string, number> = {};

    const text = query.replace(/:\w+/g, (match) => {
      const paramName = match.substring(1);
      if (paramName in namedParams) {
        if (!(paramName in paramMap)) {
          paramMap[paramName] = paramIndex++;
          values.push(namedParams[paramName]);
        }
        return `$${paramMap[paramName]}`;
      }
      return match;
    });

    return { text, values };
  }
}

export default Database;