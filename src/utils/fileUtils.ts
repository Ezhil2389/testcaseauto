import { Document } from '../types';

export interface ProcessedFile {
  name: string;
  content: string;
  size: number;
  type: string;
  lastModified: number;
}

export const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        // Check if this looks like binary data (common for PDFs)
        if (isProbablyBinaryContent(result)) {
          resolve(`[BINARY FILE DETECTED]

This appears to be a binary file (likely a PDF or Office document).
For best results, please:
1. Convert your document to plain text (.txt) format, or
2. Copy and paste the content directly into a text document

File: ${file.name}
Size: ${file.size} bytes
Type: ${file.type}

Note: PDF text extraction requires specialized libraries. The system will attempt to analyze any readable content, but may fall back to generic templates.`);
        } else {
          resolve(result);
        }
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };
    
    // Handle different file types
    const fileExtension = getFileExtension(file.name).toLowerCase();
    
    switch (fileExtension) {
      case 'txt':
      case 'md':
      case 'csv':
        reader.readAsText(file);
        break;
      case 'pdf':
        // For PDF files, read as text but we'll detect binary content
        reader.readAsText(file);
        break;
      case 'doc':
      case 'docx':
      case 'xls':
      case 'xlsx':
        // For Office documents, read as text but we'll detect binary content
        reader.readAsText(file);
        break;
      default:
        reader.readAsText(file);
    }
  });
};

// Helper function to detect binary content
const isProbablyBinaryContent = (content: string): boolean => {
  // Check for PDF signature
  if (content.startsWith('%PDF-')) {
    return true;
  }
  
  // Check for common binary signatures
  if (content.startsWith('PK') || content.startsWith('\u0000') || content.includes('\uFFFD')) {
    return true;
  }
  
  // Count non-printable characters
  const nonPrintableCount = content.split('').filter(char => {
    const code = char.charCodeAt(0);
    return code < 32 && code !== 9 && code !== 10 && code !== 13; // Exclude tab, newline, carriage return
  }).length;
  
  // If more than 5% of characters are non-printable, consider it binary
  return (nonPrintableCount / content.length) > 0.05;
};

export const processDocumentContent = (content: string, fileName: string): string => {
  const fileExtension = getFileExtension(fileName).toLowerCase();
  
  // Clean and enhance content based on file type
  let processedContent = content;
  
  // Remove common file artifacts and clean up text
  processedContent = processedContent
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
    const rawContent = await readFileContent(file);
    const processedContent = processDocumentContent(rawContent, file.name);
    
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
    throw new Error(`Failed to process file: ${file.name}`);
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
    'text/csv'
  ];
  
  const allowedExtensions = ['txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'md'];
  const fileExtension = getFileExtension(file.name).toLowerCase();
  
  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: `File type not supported. Allowed types: ${allowedExtensions.join(', ')}`
    };
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size too large. Maximum size is 10MB.'
    };
  }
  
  return { isValid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
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
      let content = '';
      
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        content = await readTextFile(file);
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // For now, we'll handle PDF as text - in a real app you'd use pdf-parse
        content = `PDF file: ${file.name} (${formatFileSize(file.size)})`;
      } else {
        // Try to read as text for other file types
        content = await readTextFile(file);
      }
      
      // Clean and normalize the content
      content = cleanAndNormalizeText(content);
      
      processedFiles.push({
        name: file.name,
        content,
        size: file.size,
        type: file.type || 'unknown',
        lastModified: file.lastModified
      });
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      // Add file with error message
      processedFiles.push({
        name: file.name,
        content: `Error reading file: ${file.name}`,
        size: file.size,
        type: file.type || 'unknown',
        lastModified: file.lastModified
      });
    }
  }
  
  return processedFiles;
};

const readTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('File reading failed'));
    };
    
    // Read as text with UTF-8 encoding
    reader.readAsText(file, 'UTF-8');
  });
};

const cleanAndNormalizeText = (text: string): string => {
  // Remove only the most problematic control characters, preserve normal formatting
  let cleaned = text
    // Remove null bytes and dangerous control characters, but keep tabs and line breaks
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    // Normalize line breaks
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Clean up excessive whitespace but preserve intentional spacing
    .replace(/[ \t]{4,}/g, '   ') // Replace 4+ spaces/tabs with 3 spaces
    // Remove excessive line breaks (more than 3 consecutive)
    .replace(/\n{4,}/g, '\n\n\n')
    // Trim the entire content
    .trim();
  
  // Ensure we have valid text content
  if (!cleaned || cleaned.length < 10) {
    return 'Document content could not be processed properly.';
  }
  
  return cleaned;
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
    errors.push('Document content is too short to analyze');
  }
  
  // More lenient check for binary content - only flag if there's a high percentage of control characters
  const controlCharCount = (content.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g) || []).length;
  const totalChars = content.length;
  const controlCharPercentage = totalChars > 0 ? (controlCharCount / totalChars) * 100 : 0;
  
  // Only flag as binary if more than 5% of characters are control characters
  if (controlCharPercentage > 5) {
    errors.push('Document appears to contain binary data');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};