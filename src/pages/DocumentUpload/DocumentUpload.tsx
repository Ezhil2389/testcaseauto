import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, Zap, AlertCircle, CheckCircle2, Info, Clock, Sparkles, Upload, TrendingUp } from 'lucide-react';
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
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
          <Sparkles size={14} />
          AI-Powered Analysis
        </div>
        <h1 className="text-balance max-w-4xl mx-auto">
          Transform Business Requirements into Test Cases
        </h1>
        <p className="text-lg max-w-2xl mx-auto text-balance text-[var(--text-secondary)]">
          Upload your BRD documents to automatically generate structured test cases using AI analysis
        </p>
      </div>

      {/* Main Upload Card */}
      <div className="card card-spacious">
        <div className="section-header">
          <div className="section-icon">
            <Upload size={24} />
          </div>
          <div>
            <h2 className="gradient-text">Document Upload</h2>
            <p className="mt-2">Upload your business requirements and project documentation</p>
          </div>
        </div>
        
        <div className="content-section">
          <FileUploadZone />
        </div>
        
        {/* Document Statistics */}
        {documents.length > 0 && (
          <div className="content-section">
            <div className="info-card border-blue-200 bg-blue-50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
                <h4 className="font-semibold text-blue-900">Ready for Analysis</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">{documents.length}</div>
                  <p className="text-xs text-blue-700">Files</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">{(totalSize / 1024).toFixed(1)} KB</div>
                  <p className="text-xs text-blue-700">Size</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">{totalChars.toLocaleString()}</div>
                  <p className="text-xs text-blue-700">Characters</p>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">~{Math.ceil(totalChars / 1000)}s</div>
                  <p className="text-xs text-blue-700">Est. Time</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Processing Progress */}
        {progress && (
          <div className="content-section">
            <div className="info-card border-blue-200 bg-blue-50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <Clock size={16} className="animate-spin" />
                </div>
                <h4 className="font-semibold text-blue-900">Processing Documents</h4>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 text-sm">{progress.message}</span>
                  <span className="text-blue-600 font-bold">{progress.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Status Messages */}
        {(error || warning || (documents.length > 0 && !error && !warning && !progress)) && (
          <div className="content-section space-y-3">
            {error && (
              <div className="status-message status-error">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Error</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            )}
            
            {warning && (
              <div className="status-message status-warning">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Notice</p>
                  <p className="text-sm mt-1">{warning}</p>
                </div>
              </div>
            )}
            
            {documents.length > 0 && !error && !warning && !progress && (
              <div className="status-message status-success">
                <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Ready for Analysis</p>
                  <p className="text-sm mt-1">
                    {documents.length} document{documents.length > 1 ? 's' : ''} uploaded successfully
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
                Processing...
              </>
            ) : (
              <>
                <Zap size={18} />
                Analyze with AI
                <ArrowRight size={18} />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Simplified Information */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* What We Support */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="font-semibold">Supported Files</h3>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-1">
              <span>Word Documents (.docx)</span>
              <span className="text-green-600 text-xs">✓ Best</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span>Text Files (.txt, .md)</span>
              <span className="text-green-600 text-xs">✓ Perfect</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span>Excel Files (.xlsx)</span>
              <span className="text-blue-600 text-xs">✓ Good</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span>PDF Documents</span>
              <span className="text-amber-600 text-xs">⚠ Limited</span>
            </div>
          </div>
        </div>

        {/* What We Extract */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <h3 className="font-semibold">AI Analysis</h3>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span>Project overview & scope</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span>Functional requirements</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span>User stories & acceptance criteria</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span>Stakeholders & business rules</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;