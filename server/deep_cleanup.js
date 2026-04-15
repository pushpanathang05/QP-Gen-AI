import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Destructive Cleanup Script
const MONGODB_URI = "mongodb+srv://pushpanathanofficial:Push%401234@qp-generator.mw8va9f.mongodb.net/qpgen?retryWrites=true&w=majority";

async function deepReset() {
  console.log('Connecting to MongoDB for Deep Reset...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  try {
    const collections = [
      'institutions',
      'courses',
      'syllabuses',
      'notes',
      'papers',
      'audits'
    ];

    for (const col of collections) {
      const count = await mongoose.connection.collection(col).countDocuments();
      await mongoose.connection.collection(col).deleteMany({});
      console.log(`Cleared ${col} (${count} documents removed)`);
    }

    console.log('\n--- 100% DEEP RESET COMPLETE ---');
  } catch (err) {
    console.error('Error during deep reset:', err);
  } finally {
    await mongoose.disconnect();
  }
}

deepReset().catch(console.error);
