import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle, Clock, Users, FileText, Timer, Target, Edit, Trash2 } from 'lucide-react';
import { TestCase } from '../../types';
import Button from '../UI/Button';
import { useDocumentStore } from '../../store/documentStore';

interface TestCaseCardProps {
  testCase: TestCase;
  onEdit?: () => void;
  onDelete?: () => void;
}

const TestCaseCard: React.FC<TestCaseCardProps> = ({ testCase, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { updateTestCase } = useDocumentStore();
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const handleStatusChange = (status: TestCase['status']) => {
    updateTestCase(testCase.id, { status });
  };
  
  const getPriorityBadgeClass = () => {
    switch (testCase.priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  
  const getStatusIcon = () => {
    switch (testCase.status) {
      case 'Passed':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'Failed':
        return <AlertCircle size={16} className="text-red-600" />;
      case 'In Progress':
        return <Clock size={16} className="text-orange-600" />;
      case 'Blocked':
        return <AlertCircle size={16} className="text-purple-600" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };
  
  const getStatusBadgeClass = () => {
    switch (testCase.status) {
      case 'Passed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'In Progress':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Blocked':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = () => {
    switch (testCase.type) {
      case 'Integration':
        return <Target size={14} className="text-purple-600" />;
      case 'UI/UX':
        return <Users size={14} className="text-blue-600" />;
      case 'Security':
        return <AlertCircle size={14} className="text-red-600" />;
      case 'Performance':
        return <Timer size={14} className="text-orange-600" />;
      default:
        return <FileText size={14} className="text-gray-600" />;
    }
  };
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200">
      <div 
        className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={toggleExpand}
      >
        <div className="flex items-center gap-3 flex-1">
          {getStatusIcon()}
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 text-lg">{testCase.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-600">{testCase.category}</span>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1">
                {getTypeIcon()}
                <span className="text-sm text-gray-600">{testCase.type}</span>
              </div>
              {testCase.relatedRequirement && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-blue-600">{testCase.relatedRequirement}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 text-xs font-medium border rounded ${getPriorityBadgeClass()}`}>
            {testCase.priority}
          </span>
          
          <span className={`px-2 py-1 text-xs font-medium border rounded ${getStatusBadgeClass()}`}>
            {testCase.status}
          </span>
          
          <button className="text-gray-400 hover:text-gray-600">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-6 space-y-6">
            {/* Description */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FileText size={16} />
                Description
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">{testCase.description}</p>
            </div>

            {/* Test Details Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Preconditions */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Preconditions</h4>
                <ul className="space-y-1">
                  {testCase.preconditions.map((precondition, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      {precondition}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Test Data */}
              {testCase.testData.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Test Data</h4>
                  <ul className="space-y-1">
                    {testCase.testData.map((data, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        {data}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Test Steps */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Test Steps</h4>
              {testCase.steps.length > 0 ? (
                <div className="space-y-3">
                  {testCase.steps.map((step, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full flex items-center justify-center">
                          {step.stepNumber}
                        </span>
                        <div className="flex-1 space-y-2">
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Action</span>
                            <p className="text-sm text-gray-700 mt-1">{step.action}</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expected Result</span>
                            <p className="text-sm text-green-700 mt-1">{step.expectedResult}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No test steps defined</p>
              )}
            </div>
            
            {/* Expected Outcome */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Expected Outcome</h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">{testCase.expectedOutcome}</p>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-gray-500 pt-4 border-t border-gray-200">
              <span className="flex items-center gap-1">
                <Timer size={12} />
                Estimated: {testCase.estimatedTime}
              </span>
              {testCase.assignee && (
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  Assigned: {testCase.assignee}
                </span>
              )}
            </div>
            
            {/* Status Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={testCase.status === 'Not Started' ? 'primary' : 'outline'}
                  onClick={() => handleStatusChange('Not Started')}
                >
                  Not Started
                </Button>
                <Button
                  size="sm"
                  variant={testCase.status === 'In Progress' ? 'primary' : 'outline'}
                  onClick={() => handleStatusChange('In Progress')}
                >
                  In Progress
                </Button>
                <Button
                  size="sm"
                  variant={testCase.status === 'Passed' ? 'primary' : 'outline'}
                  onClick={() => handleStatusChange('Passed')}
                >
                  Passed
                </Button>
                <Button
                  size="sm"
                  variant={testCase.status === 'Failed' ? 'primary' : 'outline'}
                  onClick={() => handleStatusChange('Failed')}
                >
                  Failed
                </Button>
                <Button
                  size="sm"
                  variant={testCase.status === 'Blocked' ? 'primary' : 'outline'}
                  onClick={() => handleStatusChange('Blocked')}
                >
                  Blocked
                </Button>
              </div>
              
              {(onEdit || onDelete) && (
                <div className="flex gap-2">
                  {onEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onEdit}
                      className="text-blue-600 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50"
                    >
                      <Edit size={14} />
                      Edit
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onDelete}
                      className="text-red-600 hover:text-red-700 hover:border-red-200 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCaseCard;