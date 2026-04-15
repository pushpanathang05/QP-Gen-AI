import traceback
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import tempfile
from ai_generator import AUQuestionGenerator
from pdf_engine import PDFEngine
from btl_engine import BTLEngine

app = Flask(__name__)
CORS(app)

# Global instances
generator = None
btl_engine = BTLEngine()

def get_generator():
    global generator
    if generator is None:
        print("Loading AI model for Syllabus Parsing...")
        generator = AUQuestionGenerator()
    return generator

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "anna-ai-service", "btl_engine": "ready"})

@app.route('/ai-btl-analyze', methods=['POST'])
def analyze_btl():
    """Predict BTL levels for a list of questions."""
    try:
        data = request.get_json()
        questions = data.get('questions', [])
        
        predictions = []
        for q in questions:
            q_text = q.get('question', q.get('questionText', ''))
            result = btl_engine.predict_btl(q_text)
            predictions.append({
                "question": q_text,
                "predicted_btl": result["predicted_btl"],
                "confidence": result["confidence"],
                "original_btl": q.get('btlLevel', 'N/A')
            })
        
        # Calculate balance
        analysis = btl_engine.validate_distribution([{"btlLevel": p["predicted_btl"]} for p in predictions])
        
        return jsonify({
            "predictions": predictions,
            "balance_score": analysis["balance_score"],
            "recommendations": analysis["recommendations"]
        })
    except Exception:
        error_msg = traceback.format_exc()
        print(f"Error in api: {error_msg}")
        return jsonify({"error": error_msg}), 500

@app.route('/auto-btl', methods=['POST'])
def auto_btl():
    """Automatically assign BTL levels based on AI prediction."""
    try:
        data = request.get_json()
        questions = data.get('questions', [])
        
        updated_questions = []
        for q in questions:
            q_text = q.get('questionText', q.get('topic', 'Generic Topic'))
            result = btl_engine.predict_btl(q_text)
            updated_questions.append({
                **q,
                "btlLevel": result["predicted_btl"],
                "ai_confidence": result["confidence"]
            })
            
        return jsonify({"questions": updated_questions})
    except Exception:
        error_msg = traceback.format_exc()
        print(f"Error in api: {error_msg}")
        return jsonify({"error": error_msg}), 500

@app.route('/generate-paper', methods=['POST'])
def generate_paper():
    """Combined Syllabus → Questions → PDF workflow"""
    try:
        if 'syllabus' not in request.files:
            return jsonify({"error": "Syllabus PDF is required"}), 400
        
        syllabus_file = request.files['syllabus']
        course_code = request.form.get('code', 'CODE101')
        subject_name = request.form.get('subject', 'Subject Name')
        semester = request.form.get('semester', 'V Semester')

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            syllabus_file.save(tmp.name)
            tmp_path = tmp.name

        try:
            gen = get_generator()
            units = gen.extract_syllabus(tmp_path)
            paper_data = gen.generate_questions(units)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

        formatter = PDFEngine(course_code=course_code, subject_name=subject_name, semester=semester)
        pdf_buffer = formatter.generate_pdf_buffer(paper_data)

        return send_file(pdf_buffer, mimetype='application/pdf', as_attachment=True, download_name="Anna_Univ_Paper.pdf")

    except Exception:
        error_msg = traceback.format_exc()
        print(f"Error in api: {error_msg}")
        return jsonify({"error": error_msg}), 500

@app.route('/render-paper', methods=['POST'])
def render_paper():
    """Render a paper from provided JSON data (Generic / Custom)"""
    try:
        data = request.get_json()
        course = data.get('course', {})
        
        formatter = PDFEngine(
            university=data.get('university', "ANNA UNIVERSITY, CHENNAI"),
            course_code=course.get('code', 'CS0000'),
            subject_name=course.get('title', 'Subject Name'),
            semester=course.get('semester', 'V Semester')
        )
        
        pdf_buffer = formatter.generate_pdf_buffer(data)
        
        return send_file(pdf_buffer, mimetype='application/pdf', as_attachment=True, download_name="Formatted_Paper.pdf")
    except Exception:
        error_msg = traceback.format_exc()
        print(f"Error in api: {error_msg}")
        return jsonify({"error": error_msg}), 500

@app.route('/generate-single-question', methods=['POST'])
def generate_single_question():
    """Generate a single question based on topic, marks, etc."""
    try:
        data = request.get_json()
        topic = data.get('topic', 'Generic Topic')
        unit = data.get('unit', 'UNIT I')
        marks = data.get('marks', 2)
        btl_level = data.get('btlLevel', 'K2')
        
        gen = get_generator()
        result = gen.generate_single_question(topic, unit, btl_level, marks)
        
        return jsonify(result)
    except Exception:
        error_msg = traceback.format_exc()
        print(f"Error in api: {error_msg}")
        return jsonify({"error": error_msg}), 500

import traceback

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"Starting Intelligent BTL Service on port {port}...")
    try:
        app.run(host='0.0.0.0', port=port, debug=True)
    except Exception:
        traceback.print_exc()
