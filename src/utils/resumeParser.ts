import mammoth from 'mammoth';
import * as pdfParse from 'pdfjs-dist';

export interface ParsedResumeData {
  name?: string;
  email?: string;
  phone?: string;
  rawText: string;
}

export const parseResume = async (file: File): Promise<ParsedResumeData> => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  let text = '';
  
  try {
    if (fileExtension === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdfData = await pdfParse(arrayBuffer);
      text = pdfData.text;
    } else if (fileExtension === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      text = result.value;
    } else {
      throw new Error('Unsupported file format. Please upload a PDF or DOCX file.');
    }
    
    return extractResumeData(text);
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw new Error('Failed to parse resume. Please ensure the file is not corrupted.');
  }
};

const extractResumeData = (text: string): ParsedResumeData => {
  const result: ParsedResumeData = { rawText: text };
  
  // Extract email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    result.email = emailMatch[0];
  }
  
  // Extract phone number (various formats)
  const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch) {
    result.phone = phoneMatch[0];
  }
  
  // Extract name (heuristic approach)
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Look for name in first few lines
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    
    // Skip lines that look like contact info or headers
    if (line.toLowerCase().includes('email') || 
        line.toLowerCase().includes('phone') || 
        line.toLowerCase().includes('resume') ||
        line.toLowerCase().includes('cv') ||
        emailRegex.test(line) ||
        phoneRegex.test(line)) {
      continue;
    }
    
    // Check if line looks like a name (2-4 words, starts with capital letter)
    const words = line.split(/\s+/).filter(word => word.length > 0);
    if (words.length >= 2 && words.length <= 4) {
      const allWordsCapitalized = words.every(word => 
        /^[A-Z][a-z]*$/.test(word) || /^[A-Z]+$/.test(word)
      );
      
      if (allWordsCapitalized) {
        result.name = line;
        break;
      }
    }
  }
  
  return result;
};
