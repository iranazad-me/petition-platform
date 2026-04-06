import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema.ts";

type PostgresDatabase = ReturnType<typeof drizzle<typeof schema>>;

let cachedDb: PostgresDatabase | null = null;
let cachedPool: Pool | null = null;

function getDb(): PostgresDatabase {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error("DATABASE_URL environment variable is not set");
	}
	if (!cachedDb) {
		cachedPool = new Pool({ connectionString: databaseUrl });
		cachedDb = drizzle(cachedPool, { schema }) as PostgresDatabase;
	}
	return cachedDb;
}

// Export a proxy that lazily initializes the database
export const db: PostgresDatabase = new Proxy({} as never, {
	get(_target, prop) {
		const dbInstance = getDb();
		return dbInstance[prop as keyof PostgresDatabase];
	},
});
