package com.qpgen.pdfservice.service;

import com.qpgen.pdfservice.dto.PaperRequest;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

@Service
public class PdfRenderService {
  private static final float MARGIN = 72; // 1 inch
  private static final float FONT_SIZE = 12;
  private static final float LEADING = 18;
  private static final String DEBUG_LOG_PATH = "e:\\QP Gen\\.cursor\\debug.log";

  public byte[] render(PaperRequest req) throws IOException {
    try (PDDocument doc = new PDDocument()) {
      PDPage page = new PDPage(PDRectangle.A4);
      doc.addPage(page);

      int totalMarks = 0;
      if (req != null && req.getSections() != null) {
        for (PaperRequest.Section s : req.getSections()) {
          List<PaperRequest.Question> qs = s.getQuestions() != null ? s.getQuestions() : List.of();
          for (PaperRequest.Question q : qs) {
            if (q.getMarks() != null) {
              totalMarks += q.getMarks();
            }
          }
        }
      }

      float y = page.getMediaBox().getHeight() - MARGIN;

      PDPageContentStream[] contentRef = { new PDPageContentStream(doc, page) };
      try {

        // #region agent log
        System.out.println(
            "[PdfRenderService] render entry, hasRequest="
                + (req != null)
                + ", sections="
                + (req != null && req.getSections() != null ? req.getSections().size() : 0));
        debugLog(
            "H1",
            "PdfRenderService.java:28",
            "render entry",
            "{\"hasRequest\":"
                + (req != null)
                + ",\"sections\":"
                + (req != null && req.getSections() != null ? req.getSections().size() : 0)
                + "}",
            "initial");
        // #endregion

        java.util.Map<String, Object> format = req != null && req.getTemplate() != null ? req.getTemplate().getFormat()
            : null;
        java.util.Map<String, Object> headerObj = getMap(format, "header");
        java.util.Map<String, Object> examDetails = getMap(format, "examDetails");
        java.util.Map<String, Object> legacyHeader = getMap(format, "header_structure");

        if (headerObj == null && legacyHeader != null) {
            headerObj = new java.util.HashMap<>();
            headerObj.put("degreeTitle", getFromMap(legacyHeader, "line2", ""));
            headerObj.put("regulation", getFromMap(legacyHeader, "line3", ""));
            examDetails = new java.util.HashMap<>();
            examDetails.put("time", getFromMap(legacyHeader, "exam_time", "Three Hours"));
            examDetails.put("maxMarks", getFromMap(legacyHeader, "max_marks", "100").replaceAll("[^0-9]", ""));
        }

        // Top Left Reg No
        String regLine = "Reg. No. : ___________________";
        contentRef[0].beginText();
        contentRef[0].setFont(PDType1Font.TIMES_BOLD, 12);
        contentRef[0].newLineAtOffset(MARGIN, y);
        contentRef[0].showText(regLine);
        contentRef[0].endText();

        y -= 25; // space before code

        // Question Paper Code Box
        String codeStr = req != null && req.getCourse() != null ? req.getCourse().getCode() : "";
        if (codeStr == null || codeStr.isEmpty()) {
            codeStr = req != null && req.getCourse() != null ? req.getCourse().getCourseId() : "XXXXXX";
        }
        if (codeStr == null || codeStr.isEmpty()) codeStr = "XXXXXX";
        
        String qpCodeStr = "Question Paper Code : " + codeStr;

        float qpWidth = PDType1Font.TIMES_BOLD.getStringWidth(qpCodeStr) / 1000 * 12;
        float centerX = (doc.getPage(0).getMediaBox().getWidth() - qpWidth) / 2;

        contentRef[0].addRect(centerX - 8, y - 5, qpWidth + 16, 20);
        contentRef[0].stroke();

        contentRef[0].beginText();
        contentRef[0].setFont(PDType1Font.TIMES_BOLD, 12);
        contentRef[0].newLineAtOffset(centerX, y);
        contentRef[0].showText(qpCodeStr);
        contentRef[0].endText();

        y -= 25;

        // Degree / Examination Title
        String degreeTitle = getFromMap(headerObj, "degreeTitle", "B.E./B.Tech. DEGREE EXAMINATIONS");
        if (!degreeTitle.isEmpty()) y = writeLineCenter(doc, contentRef[0], y, PDType1Font.TIMES_BOLD, 14, degreeTitle);

        // Course Code and Subject Name
        String subjectName = req != null && req.getCourse() != null ? req.getCourse().getTitle() : "SUBJECT NAME";
        y = writeLineCenter(doc, contentRef[0], y, PDType1Font.TIMES_BOLD, 12, codeStr + " \u2013 " + subjectName);

        // Regulation
        String regulationStr = getFromMap(headerObj, "regulation", "(Regulations 2021)");
        if (!regulationStr.isEmpty()) {
            y = writeLineCenter(doc, contentRef[0], y, PDType1Font.TIMES_BOLD, 12, regulationStr);
        }

        y -= 15;

        // Exam Info Row
        String timeVal = getFromMap(examDetails, "time", "Three Hours");
        String marksVal = getFromMap(examDetails, "maxMarks", "100");

        y = writeStartEndLine(doc, contentRef[0], y, PDType1Font.TIMES_BOLD, 12, "Time : " + timeVal, "Maximum : " + marksVal + " Marks");

        y -= 20;

        // Additional Instructions (before Answer ALL questions)
        Object instrObj = format != null ? format.get("instructions") : null;
        if (instrObj instanceof List) {
            for (Object item : (List<?>) instrObj) {
                String s = item != null ? item.toString() : "";
                y = writeLineCenter(doc, contentRef[0], y, PDType1Font.TIMES_BOLD, 12, safe(s));
            }
        }
        
        y -= 15;

        if (req != null && req.getSections() != null) {
          for (PaperRequest.Section s : req.getSections()) {
            y = ensureSpace(doc, contentRef, y, 100);

            String heading = safe(s.getTitle());
            boolean isPartB = heading.toUpperCase().contains("PART B") || heading.toUpperCase().contains("PART C");
            y = writeLineCenter(doc, contentRef[0], y, PDType1Font.TIMES_BOLD, 12, heading);

            String instructions = safe(s.getInstructions());
            if (!instructions.isEmpty()) {
              float marksWidth = PDType1Font.TIMES_BOLD.getStringWidth(instructions) / 1000 * 12;
              float startX = doc.getPage(0).getMediaBox().getWidth() - MARGIN - marksWidth;
              contentRef[0].beginText();
              contentRef[0].setFont(PDType1Font.TIMES_BOLD, 12);
              contentRef[0].newLineAtOffset(startX, y); // align right on the same row as PART A if it fits, else below.
              contentRef[0].showText(instructions);
              contentRef[0].endText();
              y -= 15;
            } else {
              y -= 10;
            }

            List<PaperRequest.Question> qs = s.getQuestions() != null ? s.getQuestions() : List.of();

            for (PaperRequest.Question q : qs) {
              y = ensureSpace(doc, contentRef, y, 60);

              String qNum = safe(q.getQuestionNumber());
              String marks = q.getMarks() == null ? "" : "(" + q.getMarks() + ")";

              if (isPartB) {
                if (qNum.endsWith("b") || qNum.toLowerCase().endsWith("b)") || qNum.contains("Or")) {
                  y = writeLineCenter(doc, contentRef[0], y, PDType1Font.TIMES_BOLD, FONT_SIZE, "Or");

                  y -= 5;
                }
              }

              String left = qNum;
              if (left != null && !left.endsWith("."))
                left += ".";

              List<String> bodyLines = new ArrayList<>();
              String rawText = q.getQuestionText();
              if (rawText != null && !rawText.trim().isEmpty()) {
                String[] parts = rawText.split("\\r?\\n");
                for (String part : parts) {
                  String cleaned = safe(part);
                  if (!cleaned.isEmpty()) {
                    bodyLines.add(cleaned);
                  }
                }
              } else {
                String topic = safe(q.getTopic());
                if (!topic.isEmpty()) {
                  bodyLines.add(topic);
                }
              }

              if (bodyLines.isEmpty()) {
                continue;
              }

              String first = bodyLines.get(0);
              String mainLine = left + " " + first;
              float pageWidth = doc.getPage(0).getMediaBox().getWidth();
              float usableWidth = pageWidth - (2 * MARGIN);
              List<String> wrapped = wrap(mainLine, PDType1Font.TIMES_ROMAN, FONT_SIZE, usableWidth);

              if (!wrapped.isEmpty()) {
                float firstY = y;
                y = writeLine(contentRef[0], y, PDType1Font.TIMES_ROMAN, FONT_SIZE, wrapped.get(0));

                if (!marks.isEmpty()) {
                  float rWidth = PDType1Font.TIMES_ROMAN.getStringWidth(marks) / 1000 * FONT_SIZE;
                  contentRef[0].beginText();
                  contentRef[0].setFont(PDType1Font.TIMES_ROMAN, FONT_SIZE);
                  contentRef[0].newLineAtOffset(doc.getPage(0).getMediaBox().getWidth() - MARGIN - rWidth, firstY);
                  contentRef[0].showText(marks);
                  contentRef[0].endText();
                }

                if (wrapped.size() > 1) {
                  for (int i = 1; i < wrapped.size(); i++) {
                    String optionLine = "    " + wrapped.get(i);
                    y = writeLine(contentRef[0], y, PDType1Font.TIMES_ROMAN, FONT_SIZE, optionLine);

                  }
                }
              }

              if (bodyLines.size() > 1) {
                for (int i = 1; i < bodyLines.size(); i++) {
                  String optionLine = "    " + bodyLines.get(i);
                  for (String outLine : wrap(optionLine, PDType1Font.TIMES_ROMAN, FONT_SIZE, usableWidth)) {
                    y = writeLine(contentRef[0], y, PDType1Font.TIMES_ROMAN, FONT_SIZE, outLine);

                  }
                }
              }
            }

            y -= 10;
          }
        }
      } finally {
        if (contentRef[0] != null) {
          contentRef[0].close();
        }
      }

      ByteArrayOutputStream out = new ByteArrayOutputStream();
      doc.save(out);
      return out.toByteArray();
    }
  }

  private float ensureSpace(PDDocument doc, PDPageContentStream[] contentRef, float y, float needed)
      throws IOException {
    // #region agent log
    boolean willNewPage = !(y - needed > MARGIN);
    System.out.println(
        "[PdfRenderService] ensureSpace, y="
            + y
            + ", needed="
            + needed
            + ", willNewPage="
            + willNewPage);
    debugLog(
        "H2",
        "PdfRenderService.java:75",
        "ensureSpace check",
        "{\"y\":"
            + y
            + ",\"needed\":"
            + needed
            + ",\"willNewPage\":"
            + willNewPage
            + "}",
        "initial");
    // #endregion
    if (y - needed > MARGIN)
      return y;

    contentRef[0].close();

    PDPage newPage = new PDPage(PDRectangle.A4);
    doc.addPage(newPage);

    PDPageContentStream next = new PDPageContentStream(doc, newPage);
    contentRef[0] = next;
    float newY = newPage.getMediaBox().getHeight() - MARGIN;

    return newY;
  }

  private float writeLine(PDPageContentStream content, float y, org.apache.pdfbox.pdmodel.font.PDFont font, float size,
      String text)
      throws IOException {
    // #region agent log
    System.out.println(
        "[PdfRenderService] writeLine, y="
            + y
            + ", size="
            + size
            + ", textLength="
            + (text != null ? text.length() : 0)
            + ", contentHash="
            + (content != null ? content.hashCode() : 0));
    debugLog(
        "H3",
        "PdfRenderService.java:89",
        "writeLine before beginText",
        "{\"y\":"
            + y
            + ",\"size\":"
            + size
            + ",\"textLength\":"
            + (text != null ? text.length() : 0)
            + ",\"contentHash\":"
            + (content != null ? content.hashCode() : 0)
            + "}",
        "initial");
    // #endregion
    content.beginText();
    content.setFont(font, size);
    content.newLineAtOffset(MARGIN, y);
    content.showText(safe(text));
    content.endText();
    return y - (size > 14 ? 20 : LEADING);
  }

  private float writeLineCenter(PDDocument doc, PDPageContentStream content, float y,
      org.apache.pdfbox.pdmodel.font.PDFont font, float size, String text) throws IOException {
    String safeText = safe(text);
    float titleWidth = font.getStringWidth(safeText) / 1000 * size;
    float startX = (doc.getPage(0).getMediaBox().getWidth() - titleWidth) / 2;
    content.beginText();
    content.setFont(font, size);
    content.newLineAtOffset(startX, y);
    content.showText(safeText);
    content.endText();
    return y - (size > 14 ? 20 : LEADING);
  }

  private float writeStartEndLine(PDDocument doc, PDPageContentStream content, float y,
      org.apache.pdfbox.pdmodel.font.PDFont font, float size, String startText, String endText) throws IOException {
    String s1 = safe(startText);
    String s2 = safe(endText);
    content.beginText();
    content.setFont(font, size);
    content.newLineAtOffset(MARGIN, y);
    content.showText(s1);
    content.endText();

    float endWidth = 0;
    if (!s2.isEmpty()) {
      endWidth = font.getStringWidth(s2) / 1000 * size;
      float startX = doc.getPage(0).getMediaBox().getWidth() - MARGIN - endWidth;
      content.beginText();
      content.setFont(font, size);
      content.newLineAtOffset(startX, y);
      content.showText(s2);
      content.endText();
    }

    return y - (size > 14 ? 20 : LEADING);
  }

  private float writeLeftCenterRight(PDDocument doc, PDPageContentStream content, float y,
      org.apache.pdfbox.pdmodel.font.PDFont font, float size, String leftText, String centerText, String rightText)
      throws IOException {
    float pageWidth = doc.getPage(0).getMediaBox().getWidth();
    String s1 = safe(leftText);
    String s2 = safe(centerText);
    String s3 = safe(rightText);

    // Left
    content.beginText();
    content.setFont(font, size);
    content.newLineAtOffset(MARGIN, y);
    content.showText(s1);
    content.endText();

    // Center
    float centerWidth = font.getStringWidth(s2) / 1000 * size;
    float centerX = (pageWidth - centerWidth) / 2;
    content.beginText();
    content.setFont(font, size);
    content.newLineAtOffset(centerX, y);
    content.showText(s2);
    content.endText();

    // Right
    float rightWidth = font.getStringWidth(s3) / 1000 * size;
    float rightX = pageWidth - MARGIN - rightWidth;
    content.beginText();
    content.setFont(font, size);
    content.newLineAtOffset(rightX, y);
    content.showText(s3);
    content.endText();

    return y - (size > 14 ? 20 : LEADING);
  }

  private String getFromMap(java.util.Map<String, Object> map, String key, String defaultVal) {
    if (map == null || !map.containsKey(key))
      return defaultVal;
    Object val = map.get(key);
    return val == null ? defaultVal : val.toString();
  }

  @SuppressWarnings("unchecked")
  private java.util.Map<String, Object> getMap(java.util.Map<String, Object> map, String key) {
    if (map == null || !map.containsKey(key))
      return null;
    Object val = map.get(key);
    if (val instanceof java.util.Map) {
      return (java.util.Map<String, Object>) val;
    }
    return null;
  }

  private List<String> wrap(String s, org.apache.pdfbox.pdmodel.font.PDFont font, float fontSize, float maxWidth) {
    String str = s == null ? "" : s;
    if (str.isEmpty()) return List.of("");

    List<String> lines = new ArrayList<>();
    
    // Preserve leading whitespace formatting
    String leadingSpace = "";
    int firstNonSpace = 0;
    while(firstNonSpace < str.length() && str.charAt(firstNonSpace) == ' ') {
        firstNonSpace++;
    }
    if (firstNonSpace > 0) {
        leadingSpace = str.substring(0, firstNonSpace);
        str = str.substring(firstNonSpace);
    }
    
    String[] words = str.split("\\s+");
    StringBuilder currentLine = new StringBuilder(leadingSpace);

    try {
        for (String word : words) {
            if (word.isEmpty()) continue;
            
            String testLine = currentLine.length() == leadingSpace.length() ? leadingSpace + word : currentLine.toString() + " " + word;
            float lineWidth = font.getStringWidth(testLine) / 1000 * fontSize;
            
            if (lineWidth <= maxWidth) {
                if (currentLine.length() > leadingSpace.length()) currentLine.append(" ");
                currentLine.append(word);
            } else {
                if (currentLine.length() > leadingSpace.length()) {
                    lines.add(currentLine.toString());
                }
                // Start a new line maintaining the indentation
                currentLine = new StringBuilder(leadingSpace + word);
            }
        }
        if (currentLine.length() > 0) {
            lines.add(currentLine.toString());
        }
    } catch (IOException e) {
        // Fallback or just add the string if font width calculation fails
        lines.add(leadingSpace + str);
    }
    return lines;
  }

  private String safe(String s) {
    if (s == null)
      return "";
    String noNewlines = s.replaceAll("\\r|\\n", " ").trim();
    // Remove characters that cannot be encoded by standard Helvetica
    // (WinAnsiEncoding),
    // such as U+F0B7 and other non-ASCII glyphs that caused PDFBox errors.
    return noNewlines.replaceAll("[^\\x20-\\x7E]", " ");
  }

  // #region agent log
  private static void debugLog(
      String hypothesisId, String location, String message, String dataJson, String runId) {
    try {
      File logFile = new File(DEBUG_LOG_PATH);
      File parent = logFile.getParentFile();
      if (parent != null && !parent.exists()) {
        parent.mkdirs();
      }
      long ts = System.currentTimeMillis();
      try (FileWriter fw = new FileWriter(logFile, true)) {
        fw.write(
            "{\"id\":\"log_"
                + ts
                + "_"
                + hypothesisId
                + "\",\"timestamp\":"
                + ts
                + ",\"location\":\""
                + location
                + "\",\"message\":\""
                + message
                + "\",\"runId\":\""
                + runId
                + "\",\"hypothesisId\":\""
                + hypothesisId
                + "\",\"data\":"
                + (dataJson == null ? "{}" : dataJson)
                + "}\n");
      }
    } catch (Exception e) {
      // swallow logging failures; do not affect main flow
    }
  }
  // #endregion
}
