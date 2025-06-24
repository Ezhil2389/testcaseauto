import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, FileText, Archive, MoreHorizontal, Presentation } from 'lucide-react';
import { createDocumentFromFile, formatFileSize } from '../../utils/fileUtils';
import { useDocumentStore } from '../../store/documentStore';

const FileUploadZone: React.FC = () => {
  const { documents, addDocument, removeDocument } = useDocumentStore();
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      try {
        console.log(`Processing file: ${file.name}`);
        const document = await createDocumentFromFile(file);
        addDocument(document);
        console.log(`Successfully added document: ${file.name}`);
      } catch (error) {
        console.error('Error processing file:', error);
        // You might want to show a toast notification here
        alert(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }, [addDocument]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/csv': ['.csv']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
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
      case 'ppt':
      case 'pptx':
        return <Presentation {...iconProps} className="text-orange-600" />;
      case 'txt':
      case 'md':
        return <File {...iconProps} className="text-gray-600" />;
      case 'csv':
        return <Archive {...iconProps} className="text-purple-600" />;
      default:
        return <File {...iconProps} className="text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Upload size={32} className="text-gray-500" />
          </div>
          
          {isDragActive ? (
            <div>
              <p className="text-lg font-medium text-blue-600">Drop files here...</p>
              <p className="text-sm text-blue-500">Release to upload your documents</p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium">Upload Business Requirements</p>
              <p className="text-sm text-gray-500 mb-2">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-xs text-gray-400">
                Supports: PDF, Word, Excel, PowerPoint, Text files (up to 50MB each)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Files List */}
      {documents.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Uploaded Documents ({documents.length})</h4>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(doc.name)}
                  <div>
                    <p className="font-medium text-sm text-gray-900">{doc.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(doc.size)} • {doc.type || 'Unknown type'}
                      {doc.metadata && (
                        <span className="ml-2">
                          • {doc.metadata.originalSize.toLocaleString()} chars extracted
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => removeDocument(doc.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove file"
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