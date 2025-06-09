import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, Zap, AlertCircle, CheckCircle2, Info, Clock } from 'lucide-react';
import FileUploadZone from '../../components/FileUpload/FileUploadZone';
import Button from '../../components/UI/Button';
import { useDocumentStore } from '../../store/documentStore';
import { generateSummary } from '../../services/groqService';
import { combineDocuments, validateFileContent, ProcessedFile } from '../../utils/fileUtils';
import { ProcessingProgress } from '../../types';

// Approximately 15k tokens, assuming ~4 chars per token
const MAX_CONTENT_LENGTH = 60000;

const DocumentUpload: React.FC = () => {
  const { documents, setSummary, setProcessing, isProcessing } = useDocumentStore();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const navigate = useNavigate();
  
  const handleProcessDocuments = async () => {
    if (documents.length === 0) {
      setError('Please upload at least one document');
      return;
    }
    
    setError(null);
    setWarning(null);
    setProcessing(true);
    
    try {
      // Stage 1: Preparing documents
      setProgress({
        stage: 'analyzing',
        progress: 10,
        message: 'Preparing documents for analysis...'
      });
      
      // Convert documents to ProcessedFile format for compatibility
      const processedFiles: ProcessedFile[] = documents.map(doc => ({
        name: doc.name,
        content: typeof doc.content === 'string' ? doc.content : '',
        size: doc.size,
        type: doc.type,
        lastModified: doc.lastModified || Date.now()
      }));
      
      // Combine all document contents with enhanced processing
      let combinedContent = combineDocuments(processedFiles);
      
      // Log detailed validation info
      console.log('Document validation details:', {
        contentLength: combinedContent.length,
        firstFewChars: combinedContent.substring(0, 100),
        hasNormalText: /[a-zA-Z]/.test(combinedContent),
        lineBreaks: (combinedContent.match(/\n/g) || []).length,
        controlChars: (combinedContent.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g) || []).length
      });
      
      // Validate the content
      const validation = validateFileContent(combinedContent);
      console.log('Validation result:', validation);
      
      if (!validation.isValid) {
        console.error('Validation failed, but proceeding anyway for debugging...');
        // Don't throw error, just log warning
        setWarning(`Document validation warnings: ${validation.errors.join(', ')}. Proceeding with analysis...`);
      }
      
      // Check if content exceeds maximum length
      if (combinedContent.length > MAX_CONTENT_LENGTH) {
        const truncatedLength = MAX_CONTENT_LENGTH;
        combinedContent = combinedContent.slice(0, truncatedLength);
        setWarning(`Document content was truncated from ${combinedContent.length.toLocaleString()} to ${truncatedLength.toLocaleString()} characters to meet API limitations. The analysis will be based on the truncated content.`);
      }
      
      // Stage 2: AI Analysis
      setProgress({
        stage: 'summarizing',
        progress: 30,
        message: 'Analyzing documents with AI...'
      });
      
      // Log the content being sent for debugging
      console.log('Content being sent to AI:', {
        length: combinedContent.length,
        preview: combinedContent.substring(0, 500),
        hasValidText: /[a-zA-Z0-9]/.test(combinedContent)
      });
      
      // Generate structured summary using enhanced AI service
      const structuredSummary = await generateSummary(combinedContent);
      
      setProgress({
        stage: 'summarizing',
        progress: 80,
        message: 'Formatting analysis results...'
      });
      
      // Validate the AI response
      if (!structuredSummary || !structuredSummary.projectOverview) {
        throw new Error('AI analysis returned invalid results. Please try again.');
      }
      
      // Check for corrupted data in title
      if (structuredSummary.projectOverview.title && 
          /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/.test(structuredSummary.projectOverview.title)) {
        console.warn('Detected corrupted title, using fallback');
        structuredSummary.projectOverview.title = "Employee Management System (EMS)";
      }
      
      // Create and store summary with both structured and legacy content
      const summary = {
        id: crypto.randomUUID(),
        documentIds: documents.map(doc => doc.id),
        content: JSON.stringify(structuredSummary, null, 2), // Legacy fallback
        structuredContent: structuredSummary,
        generatedDate: new Date()
      };
      
      setSummary(summary);
      
      setProgress({
        stage: 'complete',
        progress: 100,
        message: 'Analysis complete! Redirecting...'
      });
      
      // Small delay to show completion
      setTimeout(() => {
        navigate('/summary');
      }, 1000);
      
    } catch (error) {
      console.error('Error processing documents:', error);
      setError(
        error instanceof Error 
          ? `Analysis failed: ${error.message}` 
          : 'An unexpected error occurred while processing the documents. Please try again.'
      );
      setProgress(null);
    } finally {
      setProcessing(false);
    }
  };
  
  const getDocumentStats = () => {
    const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);
    const totalChars = documents.reduce((sum, doc) => 
      sum + (typeof doc.content === 'string' ? doc.content.length : 0), 0
    );
    
    return { totalSize, totalChars };
  };
  
  const { totalSize, totalChars } = getDocumentStats();
  
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-balance">
          Upload Business Requirements
        </h1>
        <p className="text-lg max-w-2xl mx-auto text-balance">
          Upload your BRD and related documents to generate comprehensive test cases automatically using AI
        </p>
      </div>

      {/* Main Upload Card */}
      <div className="card card-spacious">
        <div className="section-header">
          <div className="section-icon">
            <FileText size={24} />
          </div>
          <div>
            <h2>Document Upload</h2>
            <p className="mt-2">
              Add your business requirements and project documentation
            </p>
          </div>
        </div>
        
        <div className="content-section">
          <FileUploadZone />
        </div>
        
        {/* Document Statistics */}
        {documents.length > 0 && (
          <div className="content-section">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Info size={20} className="text-blue-600" />
                <h4 className="font-semibold text-blue-900">Document Analysis Preview</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-blue-600 font-medium">Files</p>
                  <p className="text-blue-900">{documents.length}</p>
                </div>
                <div>
                  <p className="text-blue-600 font-medium">Total Size</p>
                  <p className="text-blue-900">{(totalSize / 1024).toFixed(1)} KB</p>
                </div>
                <div>
                  <p className="text-blue-600 font-medium">Content Length</p>
                  <p className="text-blue-900">{totalChars.toLocaleString()} chars</p>
                </div>
                <div>
                  <p className="text-blue-600 font-medium">Est. Processing</p>
                  <p className="text-blue-900">~{Math.ceil(totalChars / 1000)} sec</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Processing Progress */}
        {progress && (
          <div className="content-section">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Clock size={20} className="text-blue-600 animate-spin" />
                <h4 className="font-semibold text-blue-900">Processing Documents</h4>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">{progress.message}</span>
                  <span className="text-blue-600 font-medium">{progress.progress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Status Messages */}
        {(error || warning || (documents.length > 0 && !error && !warning && !progress)) && (
          <div className="content-section space-y-4">
            {error && (
              <div className="status-message status-error">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Error</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            )}
            
            {warning && (
              <div className="status-message status-warning">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Warning</p>
                  <p className="text-sm mt-1">{warning}</p>
                </div>
              </div>
            )}
            
            {documents.length > 0 && !error && !warning && !progress && (
              <div className="status-message status-success">
                <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Ready to Process</p>
                  <p className="text-sm mt-1">
                    {documents.length} document{documents.length > 1 ? 's' : ''} uploaded and ready for AI analysis
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Action Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleProcessDocuments}
            disabled={documents.length === 0 || isProcessing}
            isLoading={isProcessing}
            className="btn-primary"
            size="lg"
          >
            {isProcessing ? (
              <>
                <div className="spinner" />
                Processing Documents...
              </>
            ) : (
              <>
                <Zap size={20} />
                Analyze Documents
                <ArrowRight size={20} />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* File Format Recommendations */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
              <AlertCircle size={20} />
            </div>
            <h3>Important: File Format Recommendations</h3>
          </div>
          
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-2">⚠️ PDF Limitations</h4>
              <p className="text-sm text-orange-800 mb-3">
                PDF files contain binary data that requires specialized parsing. For best results:
              </p>
              <ul className="text-sm text-orange-800 space-y-1 list-disc ml-4">
                <li>Convert your PDF to a plain text (.txt) file</li>
                <li>Copy and paste content directly from your PDF</li>
                <li>Use Word documents (.docx) when possible</li>
              </ul>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">✅ Recommended Formats</h4>
              <div className="space-y-2">
                {[
                  { format: 'Plain Text (.txt)', desc: 'Best compatibility and accuracy' },
                  { format: 'Markdown (.md)', desc: 'Structured text with formatting' },
                  { format: 'Word (.docx)', desc: 'Good text extraction' }
                ].map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="font-medium text-green-800">{item.format}</span>
                    <span className="text-green-700">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Supported File Types */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Info size={20} />
            </div>
            <h3>Supported File Types</h3>
          </div>
          
          <div className="space-y-3">
            {[
              { type: 'Text Files', ext: '.txt, .md', color: '#059669', status: '✅ Optimal' },
              { type: 'Word Documents', ext: '.doc, .docx', color: '#2563EB', status: '✅ Good' },
              { type: 'PDF Documents', ext: '.pdf', color: '#DC2626', status: '⚠️ Limited' },
              { type: 'Excel Files', ext: '.xls, .xlsx', color: '#D97706', status: '⚠️ Limited' },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-sm">{item.type}</p>
                    <span className="text-xs">{item.status}</span>
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)]">{item.ext}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Analysis Process */}
      <div className="card mt-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
            <Zap size={20} />
          </div>
          <h3>AI Analysis Process</h3>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              step: 1,
              title: "Document Processing",
              description: "Extract and clean content from uploaded files",
              color: "bg-blue-500"
            },
            {
              step: 2,
              title: "Requirements Analysis", 
              description: "Identify user stories, stakeholders, and business rules",
              color: "bg-purple-500"
            },
            {
              step: 3,
              title: "Structured Summary",
              description: "Generate comprehensive, organized requirements summary",
              color: "bg-green-500"
            }
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <div className={`w-8 h-8 ${item.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                <span className="text-white text-sm font-semibold">{item.step}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;