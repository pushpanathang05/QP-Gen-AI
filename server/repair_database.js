import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://pushpanathanofficial:Push%401234@qp-generator.mw8va9f.mongodb.net/qpgen?retryWrites=true&w=majority";

async function repair() {
  console.log('Connecting to DB...');
  await mongoose.connect(MONGODB_URI);
  
  try {
    const syllabuses = await mongoose.connection.collection('syllabuses').find({}).toArray();
    console.log(`Analyzing ${syllabuses.length} syllabuses...`);

    let fixedCount = 0;
    for (const s of syllabuses) {
      const updates = {};
      
      // If courseId is a string, convert it
      if (typeof s.courseId === 'string') {
        updates.courseId = new mongoose.Types.ObjectId(s.courseId);
      }

      // If uploadedBy is a string, convert it
      if (s.pdf?.uploadedBy && typeof s.pdf.uploadedBy === 'string') {
        if (!updates.pdf) updates.pdf = { ...s.pdf };
        updates.pdf.uploadedBy = new mongoose.Types.ObjectId(s.pdf.uploadedBy);
      }

      if (Object.keys(updates).length > 0) {
        console.log(`Fixing syllabus: ${s._id}`);
        await mongoose.connection.collection('syllabuses').updateOne(
          { _id: s._id },
          { $set: updates }
        );
        fixedCount++;
      }
    }

    console.log(`Successfully repaired ${fixedCount} syllabus records!`);
  } catch (err) {
    console.error('Repair failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

repair();
