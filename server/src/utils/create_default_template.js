import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Template from '../models/Template.js';
import Institution from '../models/Institution.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const defaultFormat = {
  "university": "ANNA UNIVERSITY, CHENNAI",
  "exam_type": "B.E./B.Tech. DEGREE EXAMINATIONS",
  "regulation": "Regulations 2021",
  "sections": {
    "part_a": {
      "title": "PART A",
      "description": "Answer all questions. (10 x 2 = 20 Marks)",
      "number_of_questions": 10,
      "marks_per_question": 2,
      "btlLevels": ["K1", "K2"]
    },
    "part_b": {
      "title": "PART B",
      "description": "Answer all questions. (5 x 13 = 65 Marks)",
      "number_of_questions": 5,
      "marks_per_question": 13,
      "btlLevels": ["K3", "K4"]
    },
    "part_c": {
      "title": "PART C",
      "description": "Answer any one question. (1 x 15 = 15 Marks)",
      "number_of_questions": 1,
      "marks_per_question": 15,
      "btlLevels": ["K5", "K6"]
    }
  }
};

async function createDefault() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/qpgen';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB.');

    let inst = await Institution.findOne();
    if (!inst) {
      console.log('No institution found, creating a default one...');
      inst = await Institution.create({
        name: 'Example Engineering College',
        code: 'EEC01',
        address: 'Chennai, Tamil Nadu',
        contactEmail: 'admin@example.edu'
      });
    }

    let user = await User.findOne({ role: 'admin' });
    if (!user) {
      console.log('No admin user found. Please ensure you have an admin user created.');
      process.exit(1);
    }

    const templateData = {
      institutionId: inst._id,
      name: 'Anna University Standard',
      description: 'Standard 3-part (A, B, C) template for Anna University examinations.',
      type: 'end_sem',
      format: defaultFormat,
      status: 'approved',
      isDefault: true,
      isActive: true,
      createdBy: user._id
    };

    // Check if it already exists to avoid duplicates
    const existing = await Template.findOne({ name: templateData.name, institutionId: inst._id });
    if (existing) {
      console.log('Default template already exists.');
    } else {
      await Template.create(templateData);
      console.log('Default template "Anna University Standard" created successfully.');
    }

  } catch (err) {
    console.error('Error creating default template:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

createDefault();
