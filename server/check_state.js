import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = "mongodb+srv://pushpanathanofficial:Push%401234@qp-generator.mw8va9f.mongodb.net/qpgen?retryWrites=true&w=majority";

async function check() {
  await mongoose.connect(MONGODB_URI);
  try {
    const courses = await mongoose.connection.collection('courses').find({}).toArray();
    console.log('Courses count:', courses.length);
    courses.forEach(c => console.log(`Course: ${c.code} - ${c.title} (_id: ${c._id})`));

    const syllabuses = await mongoose.connection.collection('syllabuses').find({}).toArray();
    console.log('Syllabuses count:', syllabuses.length);
    syllabuses.forEach(s => console.log(`Syllabus: courseId=${s.courseId}, version=${s.version}`));

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
