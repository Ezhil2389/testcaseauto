import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, FileText, Archive, MoreHorizontal } from 'lucide-react';
import { createDocumentFromFile, formatFileSize } from '../../utils/fileUtils';
import { useDocumentStore } from '../../store/documentStore';

const FileUploadZone: React.FC = () => {
  const { documents, addDocument, removeDocument } = useDocumentStore();
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      try {
        const document = await createDocumentFromFile(file);
        addDocument(document);
      } catch (error) {
        console.error('Error processing file:', error);
      }
    }
  }, [addDocument]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    }
  });

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconProps = { size: 20 };
    
    switch (extension) {
      case 'pdf':
        return <FileText {...iconProps} className="text-red-600" />;
      case 'doc':
      case 'docx':
        return <FileText {...iconProps} className="text-blue-600" />;
      case 'xls':
      case 'xlsx':
        return <Archive {...iconProps} className="text-green-600" />;
      case 'txt':
        return <File {...iconProps} className="text-gray-600" />;
      default:
        return <File {...iconProps} className="text-gray-600" />;
    }
  };
  
  return (
    <div className="space-y-8">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`upload-zone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="text-center">
          <Upload 
            size={40} 
            className={`mx-auto mb-4 transition-colors duration-300 ${
              isDragActive ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'
            }`} 
          />
          
          <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">
            {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
          </h3>
          
          <p className="text-[var(--text-secondary)] mb-4">
            or click to browse your computer
          </p>
          
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md text-sm text-[var(--text-tertiary)]">
            <MoreHorizontal size={14} />
            <span>PDF, DOC, DOCX, XLS, XLSX, TXT</span>
          </div>
        </div>
      </div>
      
      {/* Uploaded Files */}
      {documents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Uploaded Files
            </h3>
            <span className="text-sm text-[var(--text-tertiary)] bg-gray-100 px-3 py-1.5 rounded-md font-medium">
              {documents.length} file{documents.length > 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="space-y-3">
            {documents.map((doc) => (
              <div 
                key={doc.id}
                className="file-item slide-up"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {getFileIcon(doc.name)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--text-primary)] truncate">
                      {doc.name}
                    </p>
                    <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
                      {formatFileSize(doc.size)}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => removeDocument(doc.id)}
                  className="flex-shrink-0 w-8 h-8 rounded-md text-[var(--text-tertiary)] hover:text-red-600 hover:bg-red-50 transition-all duration-200 flex items-center justify-center focus-ring"
                  aria-label={`Remove ${doc.name}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;