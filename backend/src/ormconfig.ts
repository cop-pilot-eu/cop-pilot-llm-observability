import * as dotenv from 'dotenv';
import { resolve } from 'node:path';
import { DataSource } from 'typeorm';

if (process.env.NODE_ENV !== 'production')
  dotenv.config({ path: resolve(__dirname, '..', '.env') });

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT as string, 10),
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  synchronize: false,
  entities: [resolve(__dirname, '**', 'entities', '*.entity.{ts,js}')],
  migrations: [resolve(__dirname, 'migrations/**/*.ts'), 'migrations/**/*.js'],
});
