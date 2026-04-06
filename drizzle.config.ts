import { defineConfig } from 'drizzle-kit'

// Environment variables are already set by Docker --env-file
// No need to load .env files - they don't exist in the container

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
})
