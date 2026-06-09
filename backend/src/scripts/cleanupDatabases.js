import pg from 'pg';
import mongoose from 'mongoose';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const executeNeonFix = async (connectionString) => {
    const client = new pg.Client({ connectionString });
    try {
        await client.connect();
        console.log("✅ Connected to NeonDB.");

        console.log("⏳ Dropping restrictive foreign key...");
        await client.query(`ALTER TABLE components DROP CONSTRAINT IF EXISTS components_user_id_fkey;`);
        
        console.log("⏳ Adding cascading foreign key...");
        await client.query(`
            ALTER TABLE components 
            ADD CONSTRAINT components_user_id_fkey 
            FOREIGN KEY (user_id) 
            REFERENCES users(user_id) 
            ON UPDATE CASCADE 
            ON DELETE CASCADE;
        `);
        console.log("🚀 SUCCESS: NeonDB foreign key is now ON DELETE CASCADE!");
    } catch (err) {
        console.error("❌ NeonDB Error:", err.message);
    } finally {
        await client.end();
    }
};

const executeMongoCleanup = async (mongoUri) => {
    try {
        await mongoose.connect(mongoUri);
        console.log("✅ Connected to MongoDB Atlas.");

        const db = mongoose.connection.db;
        const collectionsToDrop = [
            'users', 'components', 'ratings', 'reviews', 'discussions',
            'componentviews', 'componentdependencies', 'submissionhistories'
        ];

        for (const coll of collectionsToDrop) {
            try {
                await db.dropCollection(coll);
                console.log(`🗑️ Dropped orphaned collection: ${coll}`);
            } catch (err) {
                if (err.codeName === 'NamespaceNotFound') {
                    console.log(`⏭️ Collection ${coll} already gone (skipped).`);
                } else {
                    console.error(`⚠️ Could not drop ${coll}:`, err.message);
                }
            }
        }
        console.log("🚀 SUCCESS: MongoDB is completely cleaned up!");
    } catch (err) {
        console.error("❌ MongoDB Error:", err.message);
    } finally {
        await mongoose.disconnect();
    }
};

console.log("==========================================");
console.log("Database Cleanup & Constraint Fixer");
console.log("==========================================\n");

rl.question('Please paste your NeonDB Connection String (or press Enter to skip): ', async (neonStr) => {
    if (neonStr) await executeNeonFix(neonStr);

    rl.question('\nPlease paste your MongoDB Atlas Connection String (or press Enter to skip): ', async (mongoStr) => {
        if (mongoStr) await executeMongoCleanup(mongoStr);
        
        console.log("\n✅ All requested database operations finished!");
        process.exit(0);
    });
});
