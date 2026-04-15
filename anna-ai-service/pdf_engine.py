from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from io import BytesIO

class PDFEngine:
    """Enhanced PDF Rendering Engine with official AU alignment and BTL columns."""
    
    def __init__(self, university="ANNA UNIVERSITY, CHENNAI", course_code="CS3451", subject_name="Subject Title", semester="V SEMESTER"):
        self.university = university
        self.course_code = course_code
        self.subject_name = subject_name
        self.semester = semester
        self.styles = getSampleStyleSheet()
        self.title_style = ParagraphStyle(
            'AUTitle',
            parent=self.styles['Heading1'],
            fontSize=12,
            alignment=1, # Center
            spaceAfter=5
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
        # Use slightly tighter margins for a professional look
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        elements = []

        # 1. Official Header with Reg No field
        # Table for [Reg No | AU Header]
        header_data = [
            [
                Paragraph("Reg. No. : ________________", self.normal_style),
                "" # Spacer
            ],
            [
                "", # Empty space under Reg No
                Paragraph(f"<b>{self.university}</b>", self.title_style)
            ]
        ]
        header_t = Table(header_data, colWidths=[2.5*inch, 3.5*inch])
        header_t.setStyle(TableStyle([
            ('ALIGN', (1,1), (1,1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        elements.append(header_t)
        
        elements.append(Paragraph(f"B.E. / B.Tech. DEGREE EXAMINATION, APRIL/MAY 2026", self.title_style))
        elements.append(Paragraph(f"{self.semester}", self.title_style))
        elements.append(Paragraph(f"(Regulations 2021)", self.title_style))
        
        # 2. Boxed Paper Code
        code_data = [[Paragraph(f"<b>Question Paper Code : {self.course_code}</b>", self.title_style)]]
        code_t = Table(code_data, colWidths=[3*inch])
        code_t.setStyle(TableStyle([
            ('BOX', (0,0), (-1,-1), 1, colors.black),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        elements.append(Spacer(1, 10))
        elements.append(code_t)
        
        elements.append(Spacer(1, 10))
        elements.append(Paragraph(f"<b>{self.course_code} — {self.subject_name}</b>", self.title_style))
        elements.append(Spacer(1, 15))

        # Time and Marks line
        time_marks = [["Time : Three Hours", "Maximum : 100 Marks"]]
        tm_table = Table(time_marks, colWidths=[2.5*inch, 2.5*inch])
        tm_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (0,0), 'LEFT'),
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ]))
        elements.append(tm_table)
        elements.append(Spacer(1, 20))

        # 3. PART A Template
        elements.append(Paragraph("<b>PART – A (10 × 2 = 20 Marks)</b>", self.bold_style))
        elements.append(Spacer(1, 5))

        # Part A Table with BTL column
        part_a_data = [["Q.No.", "Question", "BTL", "Marks"]]
        for q in paper_data.get('part_a', []):
            part_a_data.append([
                q.get('questionNumber', q.get('id', '')),
                Paragraph(q.get('questionText', q.get('text', '')), self.normal_style),
                q.get('btlLevel', q.get('btl', 'K1')),
                q.get('marks', 2)
            ])

        a_table = Table(part_a_data, colWidths=[0.5*inch, 3.8*inch, 0.4*inch, 0.5*inch])
        a_table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.black),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('ALIGN', (0,0), (0,-1), 'CENTER'),
            ('ALIGN', (2,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LEFTPADDING', (1,1), (1,-1), 10),
        ]))
        elements.append(a_table)
        elements.append(Spacer(1, 20))

        # 4. PART B Template
        elements.append(Paragraph("<b>PART – B (5 × 13 = 65 Marks)</b>", self.bold_style))
        elements.append(Spacer(1, 10))

        # Handle Part B Units (expected as a list of unit objects with choices a/b)
        units = paper_data.get('part_b', [])
        for i, unit in enumerate(units):
            q_num = 11 + i
            questions = unit.get('questions', [])
            
            # Choice A
            if len(questions) > 0:
                q_a = questions[0]
                elements.append(self._make_choice_row(f"{q_num}. (a)", q_a))
            
            # OR row
            if len(questions) > 1:
                elements.append(Paragraph("<b>(OR)</b>", ParagraphStyle('CenterBold', parent=self.bold_style, alignment=1)))
                
                # Choice B
                q_b = questions[1]
                elements.append(self._make_choice_row("    (b)", q_b))
                elements.append(Spacer(1, 10))
            elif len(questions) == 1:
                elements.append(Spacer(1, 15))

        doc.build(elements)
        buffer.seek(0)
        return buffer

    def _make_choice_row(self, label, q):
        """Helper to create a formatted question row with BTL and Marks on the right."""
        q_text = q.get('questionText', q.get('text', ''))
        btl = q.get('btlLevel', q.get('btl', 'K3'))
        marks = q.get('marks', 13)
        
        # We use a nested table to ensure BTL and Marks are perfectly aligned to the right margin
        data = [[
            Paragraph(f"<b>{label}</b> {q_text}", self.normal_style),
            Paragraph(f"({btl})", self.normal_style),
            Paragraph(f"({marks})", self.normal_style)
        ]]
        t = Table(data, colWidths=[4.3*inch, 0.4*inch, 0.5*inch])
        t.setStyle(TableStyle([
            ('ALIGN', (1,0), (2,0), 'RIGHT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (0,0), 0),
        ]))
        return t
