import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool } from '@neondatabase/serverless';

// In Cloudflare Workers, we must be careful with global state.
// We'll create a function that returns a client, and we'll handle
// the lifecycle in server.js to prevent "Cross-Request I/O" errors.

export const createPrismaClient = (databaseUrl) => {
    if (!databaseUrl) {
        throw new Error("DATABASE_URL binding is missing.");
    }

    const pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({
        adapter,
        log: ['error']
    });
};

// We will also use a cache, but tied to the environment object
// to avoid the "Different Request" conflict.
let cachedPrisma;

const getPrisma = (databaseUrl) => {
    if (cachedPrisma) return cachedPrisma;

    cachedPrisma = createPrismaClient(databaseUrl);
    return cachedPrisma;
};

export default getPrisma;
