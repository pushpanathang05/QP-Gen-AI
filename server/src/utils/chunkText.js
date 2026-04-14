export function chunkText(text, { chunkSize = 1200, overlap = 150 } = {}) {
  const clean = (text || '').replace(/\s+/g, ' ').trim()
  if (!clean) return []

  const chunks = []
  let start = 0
  let index = 0

  while (start < clean.length) {
    const end = Math.min(clean.length, start + chunkSize)
    const chunk = clean.slice(start, end)

    chunks.push({
      index,
      text: chunk,
      startChar: start,
      endChar: end,
      embeddingStatus: 'pending',
    })

    index += 1
    if (end >= clean.length) break
    start = Math.max(0, end - overlap)
  }

  return chunks
}
