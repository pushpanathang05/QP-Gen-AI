from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from io import BytesIO

class AUFormatter:
    def __init__(self, course_code, subject_name, semester):
        self.course_code = course_code
        self.subject_name = subject_name
        self.semester = semester
        self.styles = getSampleStyleSheet()
        self.title_style = ParagraphStyle(
            'AUTitle',
            parent=self.styles['Heading1'],
            fontSize=14,
            alignment=1, # Center
            spaceAfter=10
        )
        self.bold_style = ParagraphStyle(
            'AUBold',
            parent=self.styles['Normal'],
            fontSize=10,
            fontName='Helvetica-Bold'
        )
        self.normal_style = ParagraphStyle(
            'AUNormal',
            parent=self.styles['Normal'],
            fontSize=10
        )

    def generate_pdf_buffer(self, paper_data):
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
        elements = []

        # 1. Header
        elements.append(Paragraph("<b>ANNA UNIVERSITY, CHENNAI</b>", self.title_style))
        elements.append(Paragraph(f"<b>B.E. / B.Tech. DEGREE EXAMINATION, APRIL/MAY 2026</b>", self.title_style))
        elements.append(Paragraph(f"<b>{self.semester}</b>", self.title_style))
        elements.append(Paragraph(f"<b>(Regulations 2021)</b>", self.title_style))
        elements.append(Paragraph(f"<b>{self.course_code} — {self.subject_name}</b>", self.title_style))
        elements.append(Spacer(1, 0.2 * inch))

        # Time and Marks line
        time_marks = [
            ["Time : Three Hours", "", "Maximum : 100 Marks"]
        ]
        tm_table = Table(time_marks, colWidths=[2*inch, 1*inch, 2*inch])
        tm_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (0,0), 'LEFT'),
            ('ALIGN', (2,0), (2,0), 'RIGHT'),
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ]))
        elements.append(tm_table)
        elements.append(Spacer(1, 0.3 * inch))

        # 2. Part A
        elements.append(Paragraph("<b>PART – A (10 × 2 = 20 Marks)</b>", self.bold_style))
        elements.append(Spacer(1, 0.1 * inch))

        part_a_data = [["Q.No.", "Question", "BTL", "Marks"]]
        for q in paper_data['part_a']:
            part_a_data.append([q['id'], q['text'], q['btl'], q['marks']])

        a_table = Table(part_a_data, colWidths=[0.5*inch, 3.5*inch, 0.5*inch, 0.5*inch])
        a_table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.black),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('ALIGN', (0,0), (0,-1), 'CENTER'),
            ('ALIGN', (2,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('PADDING', (1,1), (1,-1), 5),
        ]))
        elements.append(a_table)
        elements.append(Spacer(1, 0.4 * inch))

        # 3. Part B
        elements.append(Paragraph("<b>PART – B (5 × 13 = 65 Marks)</b>", self.bold_style))
        elements.append(Spacer(1, 0.1 * inch))

        for i, unit in enumerate(paper_data['part_b']):
            # Unit Header (e.g., 11 (a) or 11 (b))
            q_num = 11 + i
            
            # Choice A
            q_a = unit['questions'][0]
            elements.append(Paragraph(f"<b>{q_num}. (a)</b> {q_a['text']} ({q_a['marks']})", self.normal_style))
            elements.append(Spacer(1, 0.05 * inch))
            
            elements.append(Paragraph("<b>(OR)</b>", ParagraphStyle('CenterBold', parent=self.bold_style, alignment=1)))
            elements.append(Spacer(1, 0.05 * inch))

            # Choice B
            q_b = unit['questions'][1]
            elements.append(Paragraph(f"<b>    (b)</b> {q_b['text']} ({q_b['marks']})", self.normal_style))
            elements.append(Spacer(1, 0.2 * inch))

        doc.build(elements)
        buffer.seek(0)
        return buffer
