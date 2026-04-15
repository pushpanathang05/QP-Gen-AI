from btl_engine import BTLEngine
from pdf_engine import PDFEngine
import io

print("Testing BTLEngine...")
try:
    engine = BTLEngine()
    res = engine.predict_btl("What is a computer?")
    print(f"Prediction: {res['predicted_btl']} (Confidence: {res['confidence']})")
    
    analysis = engine.validate_distribution([{"btlLevel": "K1"}, {"btlLevel": "K2"}])
    print(f"Balance Score: {analysis['balance_score']}")
except Exception as e:
    print(f"BTLEngine Error: {e}")

print("\nTesting PDFEngine...")
try:
    pdf = PDFEngine()
    data = {
        "part_a": [{"questionNumber": "1", "questionText": "Test Part A", "btlLevel": "K1", "marks": 2}],
        "part_b": [{"unit": "UNIT 1", "questions": [
            {"choice": "a", "questionText": "Test Choice A", "btlLevel": "K3", "marks": 13},
            {"choice": "b", "questionText": "Test Choice B", "btlLevel": "K3", "marks": 13}
        ]}]
    }
    buf = pdf.generate_pdf_buffer(data)
    print(f"PDF Generated: {len(buf.getbuffer())} bytes")
except Exception as e:
    print(f"PDFEngine Error: {e}")
