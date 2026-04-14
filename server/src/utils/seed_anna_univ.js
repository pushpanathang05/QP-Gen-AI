import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Template from '../models/Template.js';
import Institution from '../models/Institution.js';
import User from '../models/User.js';

dotenv.config({ path: '.env' });

const annaUnivFormat = {
    "university": "Anna University",
    "exam_type": "End Semester Examination",
    "regulation": "R2021",
    "paper_format": {
        "page": {
            "size": "A4",
            "margin": {
                "top": "1 inch",
                "bottom": "1 inch",
                "left": "1 inch",
                "right": "1 inch"
            }
        },
        "font": {
            "family": "Times New Roman",
            "size": {
                "header": "14pt",
                "sub_header": "13pt",
                "normal_text": "12pt",
                "section_heading": "12pt",
                "question_text": "12pt",
                "footer": "10pt"
            },
            "style": {
                "header": "Bold",
                "sub_header": "Bold",
                "section_heading": "Bold",
                "question_number": "Bold",
                "normal_text": "Regular"
            }
        },
        "alignment": {
            "header": "Center",
            "course_code": "Left",
            "subject_name": "Left",
            "exam_time": "Left",
            "max_marks": "Right",
            "section_heading": "Center",
            "question_text": "Justify",
            "marks": "Right",
            "footer": "Center"
        },
        "spacing": {
            "line_spacing": "1.5",
            "after_section_heading": "12pt",
            "between_questions": "8pt"
        }
    },
    "header_structure": {
        "line1": "ANNA UNIVERSITY, CHENNAI",
        "line2": "End Semester Examination, Month & Year",
        "line3": "Regulation 2021",
        "course_code": "XXXXXX",
        "subject_name": "SUBJECT NAME",
        "semester": "Semester: IV",
        "department": "B.E./B.Tech. Degree Examination",
        "exam_time": "Time: 3 Hours",
        "max_marks": "Maximum Marks: 100"
    },
    "instructions": [
        "Answer ALL questions.",
        "All questions carry equal marks.",
        "Use of approved calculators is permitted.",
        "Assume suitable data if necessary."
    ],
    "sections": {
        "part_a": {
            "title": "PART A (10 x 2 = 20 Marks)",
            "question_type": "Short Answer",
            "number_of_questions": 10,
            "marks_per_question": 2,
            "internal_choice": false
        },
        "part_b": {
            "title": "PART B (5 x 13 = 65 Marks)",
            "question_type": "Either/Or",
            "number_of_questions": 5,
            "marks_per_question": 13,
            "internal_choice": true,
            "structure": {
                "questions": 5,
                "choice_pattern": "Either Q11 or Q12, Q13 or Q14..."
            }
        },
        "part_c": {
            "title": "PART C (1 x 15 = 15 Marks)",
            "question_type": "Compulsory",
            "number_of_questions": 1,
            "marks_per_question": 15,
            "internal_choice": false
        }
    },
    "marks_distribution": {
        "total_marks": 100,
        "part_a": 20,
        "part_b": 65,
        "part_c": 15
    },
    "footer": {
        "page_number_position": "Bottom Center",
        "confidential_code": "Optional Code at Bottom Left"
    }
};

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qpgen');
        console.log('Connected to DB');

        const inst = await Institution.findOne();
        if (!inst) throw new Error('No institution found. Run base seeder first.');

        const user = await User.findOne();
        if (!user) throw new Error('No user found. Run base seeder first.');

        const t = new Template({
            institutionId: inst._id,
            name: 'Anna University End Semester (JSON)',
            description: 'Official Anna University template matching R2021 guidelines based on JSON configuration.',
            type: 'end_sem',
            format: annaUnivFormat,
            status: 'approved',
            isDefault: false,
            createdBy: user._id,
            approvedBy: user._id,
            approvedAt: new Date()
        });

        await t.save();
        console.log('Anna University template created successfully.');
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}

seed();
