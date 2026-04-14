package com.qpgen.pdfservice.controller;

import com.qpgen.pdfservice.dto.PaperRequest;
import com.qpgen.pdfservice.service.PdfRenderService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pdf")
public class PdfController {
  private final PdfRenderService pdfRenderService;

  public PdfController(PdfRenderService pdfRenderService) {
    this.pdfRenderService = pdfRenderService;
  }

  @PostMapping(value = "/generate", produces = MediaType.APPLICATION_PDF_VALUE)
  public ResponseEntity<?> generate(@RequestBody PaperRequest request) {
    try {
      byte[] bytes = pdfRenderService.render(request);

      String filename = "question-paper.pdf";
      if (request != null && request.getCourse() != null && request.getCourse().getCourseId() != null) {
        filename = request.getCourse().getCourseId().replaceAll("[^a-zA-Z0-9_-]", "_") + ".pdf";
      }

      return ResponseEntity.ok()
          .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
          .contentType(MediaType.APPLICATION_PDF)
          .body(bytes);
    } catch (Exception e) {
      e.printStackTrace();
      return ResponseEntity.status(500)
          .contentType(MediaType.APPLICATION_JSON)
          .body("{\"error\": \"PDF Rendering failed: " + e.getMessage().replace("\"", "\\\"") + "\"}");
    }
  }
}
