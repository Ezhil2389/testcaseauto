import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ArrowRight, ArrowLeft, Loader } from 'lucide-react';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import { useDocumentStore } from '../../store/documentStore';
import { generateTestCases } from '../../services/groqService';

const TestCaseGeneration: React.FC = () => {
  const { currentSummary, addTestCases, isProcessing, setProcessing } = useDocumentStore();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect if no summary is available
    if (!currentSummary) {
      console.warn('No current summary available, redirecting to home');
      navigate('/');
      return;
    }
    
    console.log('Current summary structure:', {
      hasStructuredContent: !!currentSummary.structuredContent,
      hasEditedStructuredContent: !!currentSummary.editedStructuredContent,
      hasContent: !!currentSummary.content,
      hasEditedContent: !!currentSummary.editedContent
    });
  }, [currentSummary, navigate]);
  
  const handleGenerateTestCases = async () => {
    if (!currentSummary) {
      setError('No summary available for test case generation');
      return;
    }
    
    setError(null);
    setProcessing(true);
    
    try {
      // Use the structured content if available, otherwise fall back to string content
      const summaryContent = currentSummary.editedStructuredContent || 
                           currentSummary.structuredContent || 
                           currentSummary.editedContent || 
                           currentSummary.content;
      
      if (!summaryContent) {
        throw new Error('No content available in summary for test case generation');
      }
      
      console.log('Generating test cases from:', typeof summaryContent, summaryContent);
      
      // Generate test cases using Groq LLM
      const testCases = await generateTestCases(summaryContent);
      
      console.log('Generated test cases:', testCases);
      
      if (!testCases || testCases.length === 0) {
        throw new Error('No test cases were generated');
      }
      
      // Store the test cases with summary reference
      const testCasesWithSummaryId = testCases.map(testCase => ({
        ...testCase,
        summaryId: currentSummary.id
      }));
      
      // Store the test cases
      addTestCases(testCasesWithSummaryId);
      
      // Navigate to test management page
      navigate('/test-management');
    } catch (error) {
      console.error('Error generating test cases:', error);
      setError(
        error instanceof Error 
          ? `Test case generation failed: ${error.message}` 
          : 'An error occurred while generating test cases. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  };
  
  const handleBack = () => {
    navigate('/summary');
  };
  
  if (!currentSummary) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Generate Test Cases</h1>
        <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
          Create comprehensive test cases based on the document summary.
          These test cases will be used for test management.
        </p>
      </div>
      
      <Card className="mb-8">
        <div className="flex items-center mb-6">
          <div className="bg-[var(--secondary)] bg-opacity-10 p-2 rounded-lg mr-4">
            <ClipboardList size={24} className="text-[var(--secondary)]" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Test Case Generation</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Our AI will create test cases based on your document summary
            </p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-medium mb-3">Summary Preview</h3>
          <div className="max-h-48 overflow-y-auto text-sm text-[var(--text-secondary)]">
            {currentSummary.structuredContent ? (
              <div className="space-y-2">
                <div>
                  <strong>Project:</strong> {currentSummary.structuredContent.projectOverview.title}
                </div>
                <div>
                  <strong>Requirements:</strong> {currentSummary.structuredContent.functionalRequirements.length} functional requirements
                </div>
                <div>
                  <strong>User Stories:</strong> {currentSummary.structuredContent.userStories.length} user stories
                </div>
                <div>
                  <strong>Stakeholders:</strong> {currentSummary.structuredContent.stakeholders.length} stakeholders identified
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded">
                  <div className="text-xs text-blue-700">
                    Test cases will be generated based on the structured analysis of your business requirements.
                  </div>
                </div>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">
                {currentSummary.editedContent || currentSummary.content}
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-[var(--secondary)] bg-opacity-5 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-medium mb-3">What to Expect</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            The test case generation will:
          </p>
          
          <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
            <li className="flex items-start">
              <span className="bg-[var(--secondary)] rounded-full h-2 w-2 mt-1.5 mr-2"></span>
              <span>Create test cases with titles, descriptions, and step-by-step instructions</span>
            </li>
            <li className="flex items-start">
              <span className="bg-[var(--secondary)] rounded-full h-2 w-2 mt-1.5 mr-2"></span>
              <span>Assign priorities to each test case (Low, Medium, High, Critical)</span>
            </li>
            <li className="flex items-start">
              <span className="bg-[var(--secondary)] rounded-full h-2 w-2 mt-1.5 mr-2"></span>
              <span>Cover functional requirements, edge cases, and validation scenarios</span>
            </li>
            <li className="flex items-start">
              <span className="bg-[var(--secondary)] rounded-full h-2 w-2 mt-1.5 mr-2"></span>
              <span>Specify expected results for each test case</span>
            </li>
          </ul>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-[var(--error)] bg-opacity-10 text-[var(--error)] rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
          >
            <ArrowLeft size={16} />
            Back to Summary
          </Button>
          
          <Button
            onClick={handleGenerateTestCases}
            isLoading={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader size={16} className="animate-spin" />
                Generating Test Cases...
              </>
            ) : (
              <>
                Generate Test Cases
                <ArrowRight size={16} />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TestCaseGeneration;