import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = "mongodb+srv://pushpanathanofficial:Push%401234@qp-generator.mw8va9f.mongodb.net/qpgen?retryWrites=true&w=majority";

async function diagnose() {
  await mongoose.connect(MONGODB_URI);
  try {
    const Syllabus = mongoose.model('Syllabus', new mongoose.Schema({ courseId: mongoose.Schema.Types.ObjectId }));
    const Course = mongoose.model('Course', new mongoose.Schema({}));

    const courses = await Course.find({}).lean();
    console.log(`Found ${courses.length} courses.`);

    for (const c of courses) {
      console.log(`Checking course: ${c._id} (type: ${typeof c._id})`);
      
      // Try finding by ObjectId
      const byObj = await Syllabus.findOne({ courseId: c._id });
      console.log(`  - Find by c._id: ${byObj ? 'FOUND' : 'NOT FOUND'}`);

      // Try finding by String conversion
      const byStr = await Syllabus.findOne({ courseId: String(c._id) });
      console.log(`  - Find by String(c._id): ${byStr ? 'FOUND' : 'NOT FOUND'}`);

      // Try finding by explicit ObjectId cast
      const byCast = await Syllabus.findOne({ courseId: new mongoose.Types.ObjectId(String(c._id)) });
      console.log(`  - Find by new ObjectId: ${byCast ? 'FOUND' : 'NOT FOUND'}`);
      
      if (!byObj && !byStr && !byCast) {
        console.log('  !!! NO SYLLABUS MATCHED ANY METHOD !!!');
        const allSylls = await mongoose.connection.collection('syllabuses').find({}).toArray();
        console.log(`  Actual syllabuses in DB: ${allSylls.length}`);
        allSylls.forEach(s => console.log(`    - ID in DB: ${s.courseId} (type: ${typeof s.courseId})`));
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

diagnose();
