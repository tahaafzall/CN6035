import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z
    .string()
    .default('postgresql://tracechain:tracechain@localhost:5432/tracechain'),
  JWT_SECRET: z.string().min(16).default('tracechain-development-secret'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  RPC_URL: z.string().default('http://127.0.0.1:8545'),
  CHAIN_ID: z.coerce.number().int().positive().default(31337),
  CONTRACT_ADDRESS: z.string().optional(),
  CHAIN_SYNC_INTERVAL_MS: z.coerce.number().int().positive().default(15000),
  IPFS_API_URL: z.string().optional(),
  IPFS_GATEWAY_BASE_URL: z.string().default('http://127.0.0.1:8080/ipfs')
});

export const env = envSchema.parse(process.env);
