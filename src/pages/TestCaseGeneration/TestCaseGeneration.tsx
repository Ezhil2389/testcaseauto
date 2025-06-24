import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ArrowRight, ArrowLeft, Loader, Sparkles, Zap, CheckCircle, Target, Users, FileText, Brain } from 'lucide-react';
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
      navigate('/');
      return;
    }
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
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-200">
          <Brain size={14} />
          Test Case Generation
        </div>
        <h1 className="text-balance max-w-4xl mx-auto">
          Generate Test Cases
        </h1>
        <p className="text-lg max-w-2xl mx-auto text-balance text-[var(--text-secondary)]">
          Transform your analyzed requirements into detailed, actionable test cases
        </p>
      </div>
      
      {/* Main Generation Card */}
      <div className="card card-spacious">
        <div className="section-header">
          <div className="section-icon">
            <ClipboardList size={24} />
          </div>
          <div>
            <h2 className="gradient-text">Test Case Generation</h2>
            <p className="mt-2">Generate comprehensive test cases from your requirements analysis</p>
          </div>
        </div>
        
        {/* Summary Preview Card */}
        <div className="content-section">
          <div className="info-card border-blue-200 bg-blue-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <FileText size={16} />
              </div>
              <h3 className="font-semibold text-blue-900">Requirements Summary</h3>
            </div>
            
            <div>
              {currentSummary.structuredContent ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="info-card bg-white/60 border-blue-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Target size={16} className="text-blue-600" />
                        <strong className="text-blue-900">Project Overview</strong>
                      </div>
                      <p className="text-sm text-blue-800">{currentSummary.structuredContent.projectOverview.title}</p>
                      <p className="text-xs text-blue-700 mt-2">{currentSummary.structuredContent.projectOverview.description}</p>
                    </div>
                    
                    <div className="info-card bg-white/60 border-green-200">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle size={16} className="text-green-600" />
                        <strong className="text-green-900">Functional Requirements</strong>
                      </div>
                      <p className="text-sm text-green-800">{currentSummary.structuredContent.functionalRequirements.length} requirements identified</p>
                      {currentSummary.structuredContent.functionalRequirements.slice(0, 3).map((req, index) => (
                        <div key={index} className="text-xs text-green-700 mt-1">
                          • {req.title}
                        </div>
                      ))}
                      {currentSummary.structuredContent.functionalRequirements.length > 3 && (
                        <div className="text-xs text-green-600 mt-1">
                          +{currentSummary.structuredContent.functionalRequirements.length - 3} more requirements
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="info-card bg-white/60 border-purple-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Users size={16} className="text-purple-600" />
                        <strong className="text-purple-900">User Stories</strong>
                      </div>
                      <p className="text-sm text-purple-800">{currentSummary.structuredContent.userStories.length} user stories defined</p>
                      {currentSummary.structuredContent.userStories.slice(0, 2).map((story, index) => (
                        <div key={index} className="text-xs text-purple-700 mt-1">
                          • As a {story.asA}, I want {story.iWant}
                        </div>
                      ))}
                      {currentSummary.structuredContent.userStories.length > 2 && (
                        <div className="text-xs text-purple-600 mt-1">
                          +{currentSummary.structuredContent.userStories.length - 2} more user stories
                        </div>
                      )}
                    </div>
                    
                    <div className="info-card bg-white/60 border-amber-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Users size={16} className="text-amber-600" />
                        <strong className="text-amber-900">Stakeholders</strong>
                      </div>
                      <p className="text-sm text-amber-800">{currentSummary.structuredContent.stakeholders.length} stakeholders identified</p>
                      {currentSummary.structuredContent.stakeholders.slice(0, 3).map((stakeholder, index) => (
                        <div key={index} className="text-xs text-amber-700 mt-1">
                          • {stakeholder.name} - {stakeholder.role}
                        </div>
                      ))}
                      {currentSummary.structuredContent.stakeholders.length > 3 && (
                        <div className="text-xs text-amber-600 mt-1">
                          +{currentSummary.structuredContent.stakeholders.length - 3} more stakeholders
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="info-card bg-white/60">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {currentSummary.editedContent || currentSummary.content}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="content-section">
            <div className="status-message status-error">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">!</span>
                </div>
              </div>
              <div>
                <p className="font-semibold">Generation Failed</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Summary
          </Button>
          
          <Button
            onClick={handleGenerateTestCases}
            isLoading={isProcessing}
            className="btn-primary"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader size={18} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Brain size={18} />
                Generate Test Cases
                <ArrowRight size={18} />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* What You'll Get */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
            <Zap size={20} />
          </div>
          <h3 className="font-semibold">What You'll Get</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="text-lg">📝</div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Detailed Test Cases</h4>
                <p className="text-xs text-[var(--text-secondary)]">Complete test cases with step-by-step instructions</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-lg">🎯</div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Priority Assignment</h4>
                <p className="text-xs text-[var(--text-secondary)]">Intelligent priority levels based on requirements</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="text-lg">🔍</div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Comprehensive Coverage</h4>
                <p className="text-xs text-[var(--text-secondary)]">Functional requirements and validation scenarios</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-lg">✅</div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Expected Results</h4>
                <p className="text-xs text-[var(--text-secondary)]">Clear expected outcomes and acceptance criteria</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCaseGeneration;