import mongoose from 'mongoose';

async function run() {
  try {
    console.log('Connecting to MongoDB using direct node IPs (bypassing SRV DNS)...');
    await mongoose.connect('mongodb://Rushmanthnalluri:Rushmanth1122@ac-ctfdqty-shard-00-00.pvxunlq.mongodb.net:27017,ac-ctfdqty-shard-00-01.pvxunlq.mongodb.net:27017,ac-ctfdqty-shard-00-02.pvxunlq.mongodb.net:27017/modularcomponent?ssl=true&replicaSet=atlas-2fzqxk-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0');
    console.log('Connected!');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Existing collections:', collections.map(c => c.name));
    
    const toDrop = ['users', 'components', 'ratings', 'reviews', 'discussions', 'componentviews', 'componentdependencies', 'submissionhistories'];
    
    for (const name of toDrop) {
      if (collections.some(c => c.name === name)) {
        try {
          await db.dropCollection(name);
          console.log(`Successfully dropped ${name}`);
        } catch(e) {
          console.log(`Failed to drop ${name}: ${e.message}`);
        }
      } else {
        console.log(`Collection ${name} does not exist, skipping.`);
      }
    }
    
    console.log('Done cleaning up MongoDB.');
    process.exit(0);
  } catch(e) {
    console.error('Fatal Error:', e);
    process.exit(1);
  }
}

run();
