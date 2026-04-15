import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://pushpanathanofficial:Push%401234@qp-generator.mw8va9f.mongodb.net/qpgen?retryWrites=true&w=majority";

async function check() {
  await mongoose.connect(MONGODB_URI);
  try {
    const isString = await mongoose.connection.collection('syllabuses').countDocuments({ courseId: { $type: 2 } });
    const isObjectId = await mongoose.connection.collection('syllabuses').countDocuments({ courseId: { $type: 7 } });
    console.log(`Strings: ${isString}`);
    console.log(`ObjectIds: ${isObjectId}`);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

check();
