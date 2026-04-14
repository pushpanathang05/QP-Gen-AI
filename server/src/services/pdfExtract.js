import fs from 'fs/promises'
import pdfParse from 'pdf-parse'

export async function extractPdfText(filePath) {
  const buf = await fs.readFile(filePath)
  const result = await pdfParse(buf)

  return {
    text: (result.text || '').trim(),
    pageCount: result.numpages || undefined,
  }
}
