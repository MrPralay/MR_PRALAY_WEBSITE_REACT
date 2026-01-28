import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool } from '@neondatabase/serverless';

let prisma;

const getPrisma = (databaseUrl) => {
    if (!databaseUrl) {
        throw new Error("DATABASE_URL is missing in the environment bindings!");
    }

    if (!prisma) {
        try {
            const pool = new Pool({ connectionString: databaseUrl });
            const adapter = new PrismaNeon(pool);
            prisma = new PrismaClient({ adapter });
        } catch (err) {
            console.error("Prisma Sync Error:", err);
            throw new Error(`Neural Link Offline: Database failed to initialize. Error: ${err.message}`);
        }
    }
    return prisma;
};

export default getPrisma;
