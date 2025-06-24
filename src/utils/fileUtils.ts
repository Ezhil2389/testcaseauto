import { Document } from '../types';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export interface ProcessedFile {
  name: string;
  content: string;
  size: number;
  type: string;
  lastModified: number;
}

const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Simple PDF text extraction using basic parsing
const parsePDF = async (file: File): Promise<string> => {
  try {
    console.log(`Attempting to extract text from PDF: ${file.name}`);
    
    // For now, we'll use a simple approach that extracts readable text from PDF
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
    
    // Extract text between common PDF text markers
    const textMatches = text.match(/\(([^)]+)\)/g) || [];
    const extractedText = textMatches
      .map(match => match.slice(1, -1)) // Remove parentheses
      .filter(text => text.length > 2 && /[a-zA-Z]/.test(text)) // Filter meaningful text
      .join(' ');
    
    // Also try to extract text using BT/ET markers (PDF text objects)
    const btEtMatches = text.match(/BT\s+.*?ET/gs) || [];
    const btEtText = btEtMatches
      .map(match => {
        // Extract text from PDF text objects
        const textParts = match.match(/\(([^)]+)\)/g) || [];
        return textParts.map(part => part.slice(1, -1)).join(' ');
      })
      .join(' ');
    
    // Try to extract text using Tj operators
    const tjMatches = text.match(/\(([^)]*)\)\s*Tj/g) || [];
    const tjText = tjMatches
      .map(match => {
        const textMatch = match.match(/\(([^)]*)\)/);
        return textMatch ? textMatch[1] : '';
      })
      .filter(t => t.length > 0)
      .join(' ');
    
    // Try to extract text using TJ operators (array format)
    const tjArrayMatches = text.match(/\[([^\]]*)\]\s*TJ/g) || [];
    const tjArrayText = tjArrayMatches
      .map(match => {
        const arrayMatch = match.match(/\[([^\]]*)\]/);
        if (arrayMatch) {
          const strings = arrayMatch[1].match(/\(([^)]*)\)/g) || [];
          return strings.map(s => s.slice(1, -1)).join('');
        }
        return '';
      })
      .filter(t => t.length > 0)
      .join(' ');
    
    // Combine all extracted text
    const combinedText = [extractedText, btEtText, tjText, tjArrayText]
      .filter(t => t.length > 0)
      .join(' ')
      .trim();
    
    // Clean up the extracted text
    const cleanedText = combinedText
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\x20-\x7E\s]/g, '') // Remove non-printable characters except spaces
      .trim();
    
    console.log(`PDF extraction result: ${cleanedText.length} characters extracted`);
    
    if (cleanedText.length < 50) {
      // If we can't extract enough text, provide a helpful message
      throw new Error(`Unable to extract sufficient text from PDF "${file.name}". 

This PDF may contain:
• Scanned images instead of selectable text
• Complex formatting that prevents text extraction
• Encrypted or protected content

Please try:
1. Converting the PDF to a Word document (.docx) using an online converter
2. Opening the PDF and copying/pasting the text into a .txt file
3. Using a different PDF that contains selectable text
4. Uploading the original Word document if available

For best results, use Word documents (.docx) or plain text files (.txt).`);
    }
    
    return cleanedText;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    if (error instanceof Error && error.message.includes('Unable to extract sufficient text')) {
      throw error; // Re-throw our helpful error message
    }
    throw new Error(`Failed to parse PDF "${file.name}": ${error instanceof Error ? error.message : 'PDF parsing not supported in this environment.'} 

Please convert to Word (.docx) or text (.txt) format for best results.`);
  }
};

// Word document parsing function
const parseWordDocument = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (result.messages.length > 0) {
      console.warn('Word parsing warnings:', result.messages);
    }
    
    return result.value.trim();
  } catch (error) {
    console.error('Error parsing Word document:', error);
    throw new Error(`Failed to parse Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Excel parsing function
const parseExcelFile = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    let fullText = '';
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const sheetText = XLSX.utils.sheet_to_txt(worksheet);
      fullText += `\n=== Sheet: ${sheetName} ===\n${sheetText}\n`;
    });
    
    return fullText.trim();
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Text file parsing function
const parseTextFile = async (file: File): Promise<string> => {
  try {
    const text = await file.text();
    return text.trim();
  } catch (error) {
    console.error('Error parsing text file:', error);
    throw new Error(`Failed to parse text file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// PowerPoint parsing function (basic text extraction)
const parsePowerPointFile = async (file: File): Promise<string> => {
  try {
    // For now, we'll treat PPT files as binary and extract what we can
    // In a full implementation, you'd use a library like pptx2json
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
    
    // Extract readable text from the binary content
    const readableText = text
      .replace(/[\x00-\x1F\x7F-\xFF]/g, ' ') // Replace non-printable chars with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    if (readableText.length < 50) {
      throw new Error('Unable to extract meaningful text from PowerPoint file. Please convert to Word or text format.');
    }
    
    return readableText;
  } catch (error) {
    console.error('Error parsing PowerPoint file:', error);
    throw new Error(`Failed to parse PowerPoint file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const readFileContent = async (file: File): Promise<string> => {
  const extension = getFileExtension(file.name);
  
  try {
    switch (extension) {
      case 'pdf':
        return await parsePDF(file);
      
      case 'doc':
      case 'docx':
        return await parseWordDocument(file);
      
      case 'xls':
      case 'xlsx':
        return await parseExcelFile(file);
      
      case 'ppt':
      case 'pptx':
        return await parsePowerPointFile(file);
      
      case 'txt':
      case 'md':
      case 'csv':
        return await parseTextFile(file);
      
      default:
        // Try to parse as text for unknown file types
        return await parseTextFile(file);
    }
  } catch (error) {
    console.error(`Error processing ${file.name}:`, error);
    throw new Error(`Unable to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const processDocumentContent = (content: string, fileName: string): string => {
  const fileExtension = getFileExtension(fileName).toLowerCase();
  
  // Clean and enhance content
  let processedContent = content
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
    .replace(/\t/g, ' ') // Replace tabs with spaces
    .replace(/ {2,}/g, ' ') // Replace multiple spaces with single space
    .trim();
  
  // Add file context information
  const fileInfo = `
=== DOCUMENT: ${fileName} ===
File Type: ${fileExtension.toUpperCase()}
Content Length: ${processedContent.length} characters

DOCUMENT CONTENT:
${processedContent}

=== END OF DOCUMENT ===
`;
  
  return fileInfo;
};

export const createDocumentFromFile = async (file: File): Promise<Document> => {
  try {
    console.log(`Processing file: ${file.name} (${formatFileSize(file.size)})`);
    
    const rawContent = await readFileContent(file);
    
    if (!rawContent || rawContent.trim().length === 0) {
      throw new Error('No content could be extracted from the file');
    }
    
    if (rawContent.trim().length < 10) {
      throw new Error('Extracted content is too short to be meaningful');
    }
    
    const processedContent = processDocumentContent(rawContent, file.name);
    
    console.log(`Successfully processed ${file.name}: ${rawContent.length} characters extracted`);
    
    return {
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
      content: processedContent,
      uploadDate: new Date(),
      metadata: {
        originalSize: rawContent.length,
        processedSize: processedContent.length,
        fileExtension: getFileExtension(file.name),
        processingDate: new Date()
      }
    };
  } catch (error) {
    console.error(`Error processing file ${file.name}:`, error);
    throw new Error(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const validateFileType = (file: File): { isValid: boolean; error?: string } => {
  const allowedTypes = [
    'text/plain',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/csv',
    'text/markdown'
  ];
  
  const allowedExtensions = ['txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'md'];
  const fileExtension = getFileExtension(file.name).toLowerCase();
  
  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: `File type not supported. Allowed types: ${allowedExtensions.join(', ')}`
    };
  }
  
  // Check file size (max 50MB for document processing)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size too large. Maximum size is 50MB.'
    };
  }
  
  return { isValid: true };
};

export const getFileIcon = (filename: string): string => {
  const extension = getFileExtension(filename).toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'doc':
    case 'docx':
      return 'word';
    case 'xls':
    case 'xlsx':
      return 'excel';
    case 'ppt':
    case 'pptx':
      return 'powerpoint';
    case 'txt':
    case 'md':
      return 'text';
    case 'csv':
      return 'csv';
    default:
      return 'document';
  }
};

export const getFileTypeDescription = (filename: string): string => {
  const extension = getFileExtension(filename).toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return 'PDF Document';
    case 'doc':
      return 'Word Document (Legacy)';
    case 'docx':
      return 'Word Document';
    case 'xls':
      return 'Excel Spreadsheet (Legacy)';
    case 'xlsx':
      return 'Excel Spreadsheet';
    case 'ppt':
      return 'PowerPoint Presentation (Legacy)';
    case 'pptx':
      return 'PowerPoint Presentation';
    case 'txt':
      return 'Text Document';
    case 'md':
      return 'Markdown Document';
    case 'csv':
      return 'CSV Data File';
    default:
      return 'Document';
  }
};

export const processFiles = async (files: File[]): Promise<ProcessedFile[]> => {
  const processedFiles: ProcessedFile[] = [];
  
  for (const file of files) {
    try {
      const content = await readFileContent(file);
      
      processedFiles.push({
        name: file.name,
        content,
        size: file.size,
        type: file.type || 'unknown',
        lastModified: file.lastModified
      });
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      throw error; // Don't add files that failed to process
    }
  }
  
  return processedFiles;
};

export const combineDocuments = (files: ProcessedFile[]): string => {
  if (files.length === 0) return '';
  
  if (files.length === 1) {
    return files[0].content;
  }
  
  // Combine multiple documents with clear separation
  return files
    .map((file, index) => {
      const header = `\n\n=== DOCUMENT ${index + 1}: ${file.name} ===\n`;
      const footer = `\n=== END OF ${file.name} ===\n`;
      return header + file.content + footer;
    })
    .join('\n');
};

export const validateFileContent = (content: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!content || content.trim().length === 0) {
    errors.push('Document content is empty');
  }
  
  if (content.length < 50) {
    errors.push('Document content is too short to analyze meaningfully');
  }
  
  // Check for actual readable content
  const readableContent = content.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  if (readableContent.length < 20) {
    errors.push('Document does not contain sufficient readable text');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};