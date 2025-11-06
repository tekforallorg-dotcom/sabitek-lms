export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Use pdf-parse for better extraction
    const pdfParse = require('pdf-parse')
    const data = await pdfParse(buffer)
    
    const text = data.text.trim()
    console.log(`📄 PDF extracted: ${text.length} characters`)
    
    return text
  } catch (error) {
    console.error('PDF extraction error:', error)
    throw new Error('Failed to extract text from PDF')
  }
}

export async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    const mammoth = require('mammoth')
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    
    const text = result.value.trim()
    console.log(`📄 DOCX extracted: ${text.length} characters`)
    
    return text
  } catch (error) {
    console.error('DOCX extraction error:', error)
    throw new Error('Failed to extract text from DOCX')
  }
}