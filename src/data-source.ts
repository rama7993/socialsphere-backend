import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

const nodeEnv = (process.env.NODE_ENV || 'development').trim();
const envPath = join(process.cwd(), `.env.${nodeEnv}`);
dotenv.config({ path: envPath });

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: false,
  entities: [join(__dirname, '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  ssl: process.env.DATABASE_URL?.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : false,
});
