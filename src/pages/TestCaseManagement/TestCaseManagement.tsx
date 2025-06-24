import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ArrowLeft, AlertTriangle, Search, Plus, Download, Edit, Trash2, RefreshCw, Settings, Loader } from 'lucide-react';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import TestCaseCard from '../../components/TestCases/TestCaseCard';
import TestCaseFilter from '../../components/TestCases/TestCaseFilter';
import { useDocumentStore } from '../../store/documentStore';
import { TestCase } from '../../types';
import { generateTestCases } from '../../services/groqService';

const TestCaseManagement: React.FC = () => {
  const { testCases, currentSummary, addTestCases, updateTestCase, removeTestCase, setProcessing, isProcessing } = useDocumentStore();
  const [filteredTestCases, setFilteredTestCases] = useState<TestCase[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const [showRegenerateOptions, setShowRegenerateOptions] = useState(false);
  const [selectedRegenerateOption, setSelectedRegenerateOption] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const regenerateOptions = [
    {
      id: 'more-rigorous',
      title: 'More Rigorous Test Cases',
      description: 'Generate comprehensive test cases with extensive edge cases, boundary testing, and negative scenarios'
    },
    {
      id: 'less-rigorous',
      title: 'Less Rigorous Test Cases',
      description: 'Generate basic test cases focusing on core functionality and happy path scenarios'
    },
    {
      id: 'auth-flow',
      title: 'Authentication & Authorization Focus',
      description: 'Generate test cases specifically focused on login, logout, user permissions, and security flows'
    },
    {
      id: 'ui-ux',
      title: 'UI/UX Testing Focus',
      description: 'Generate test cases focused on user interface, user experience, and frontend functionality'
    },
    {
      id: 'api-integration',
      title: 'API & Integration Testing',
      description: 'Generate test cases focused on API endpoints, data integration, and system interactions'
    },
    {
      id: 'performance',
      title: 'Performance Testing Focus',
      description: 'Generate test cases focused on load testing, stress testing, and performance validation'
    },
    {
      id: 'security',
      title: 'Security Testing Focus',
      description: 'Generate test cases focused on security vulnerabilities, data protection, and access control'
    },
    {
      id: 'mobile',
      title: 'Mobile Testing Focus',
      description: 'Generate test cases specifically designed for mobile applications and responsive design'
    }
  ];
  
  // Form state for adding/editing test cases
  const [formData, setFormData] = useState<Partial<TestCase>>({
    title: '',
    description: '',
    category: '',
    priority: 'Medium',
    type: 'Functional',
    preconditions: [''],
    steps: [{ stepNumber: 1, action: '', expectedResult: '' }],
    expectedOutcome: '',
    testData: [''],
    estimatedTime: '30 minutes',
    relatedRequirement: ''
  });
  
  useEffect(() => {
    // Filter test cases based on filters and search query
    let filtered = [...testCases];
    
    if (statusFilter) {
      filtered = filtered.filter(testCase => testCase.status === statusFilter);
    }
    
    if (priorityFilter) {
      filtered = filtered.filter(testCase => testCase.priority === priorityFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(testCase => 
        testCase.title.toLowerCase().includes(query) || 
        testCase.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredTestCases(filtered);
  }, [testCases, statusFilter, priorityFilter, searchQuery]);
  
  const handleStatusFilterChange = (status: string | null) => {
    setStatusFilter(status);
  };
  
  const handlePriorityFilterChange = (priority: string | null) => {
    setPriorityFilter(priority);
  };
  
  const handleClearFilters = () => {
    setStatusFilter(null);
    setPriorityFilter(null);
    setSearchQuery('');
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleBack = () => {
    navigate('/generate-tests');
  };
  
  // Regeneration handler
  const handleRegenerateTestCases = async () => {
    if (!currentSummary || !selectedRegenerateOption) {
      setError('Please select a regeneration option');
      return;
    }
    
    setError(null);
    setProcessing(true);
    
    try {
      const summaryContent = currentSummary.editedStructuredContent || 
                           currentSummary.structuredContent || 
                           currentSummary.editedContent || 
                           currentSummary.content;
      
      if (!summaryContent) {
        throw new Error('No content available in summary for test case generation');
      }
      
      // Generate test cases with specific focus based on selected option
      const newTestCases = await generateTestCases(summaryContent, selectedRegenerateOption);
      
      if (!newTestCases || newTestCases.length === 0) {
        throw new Error('No test cases were generated');
      }
      
      // Store the test cases with summary reference, replacing existing ones
      const testCasesWithSummaryId = newTestCases.map(testCase => ({
        ...testCase,
        summaryId: currentSummary.id
      }));
      
      // Replace existing test cases with new ones
      addTestCases(testCasesWithSummaryId);
      
      // Hide regenerate options
      setShowRegenerateOptions(false);
      setSelectedRegenerateOption('');
    } catch (error) {
      console.error('Error regenerating test cases:', error);
      setError(
        error instanceof Error 
          ? `Test case regeneration failed: ${error.message}` 
          : 'An error occurred while regenerating test cases. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  // Form handling functions
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      priority: 'Medium',
      type: 'Functional',
      preconditions: [''],
      steps: [{ stepNumber: 1, action: '', expectedResult: '' }],
      expectedOutcome: '',
      testData: [''],
      estimatedTime: '30 minutes',
      relatedRequirement: ''
    });
    setEditingTestCase(null);
    setShowAddForm(false);
  };

  const handleAddTestCase = () => {
    setShowAddForm(true);
    resetForm();
  };

  const handleEditTestCase = (testCase: TestCase) => {
    setEditingTestCase(testCase);
    setFormData({
      title: testCase.title,
      description: testCase.description,
      category: testCase.category,
      priority: testCase.priority,
      type: testCase.type,
      preconditions: [...testCase.preconditions],
      steps: [...testCase.steps],
      expectedOutcome: testCase.expectedOutcome,
      testData: [...testCase.testData],
      estimatedTime: testCase.estimatedTime,
      relatedRequirement: testCase.relatedRequirement
    });
    setShowAddForm(true);
  };

  const handleDeleteTestCase = (testCaseId: string) => {
    if (window.confirm('Are you sure you want to delete this test case?')) {
      removeTestCase(testCaseId);
    }
  };

  const handleSaveTestCase = () => {
    if (!formData.title || !formData.description) {
      alert('Please fill in the required fields (Title and Description)');
      return;
    }

    const testCaseData: TestCase = {
      id: editingTestCase?.id || `TC-${String(testCases.length + 1).padStart(3, '0')}`,
      title: formData.title!,
      description: formData.description!,
      category: formData.category || 'General',
      priority: formData.priority as TestCase['priority'],
      type: formData.type as TestCase['type'],
      preconditions: formData.preconditions?.filter(p => p.trim()) || [],
      steps: formData.steps?.filter(s => s.action.trim() && s.expectedResult.trim()) || [],
      expectedOutcome: formData.expectedOutcome || '',
      testData: formData.testData?.filter(d => d.trim()) || [],
      status: editingTestCase?.status || 'Not Started',
      estimatedTime: formData.estimatedTime || '30 minutes',
      relatedRequirement: formData.relatedRequirement || '',
      createdDate: editingTestCase?.createdDate || new Date(),
      updatedDate: new Date()
    };

    if (editingTestCase) {
      updateTestCase(editingTestCase.id, testCaseData);
    } else {
      addTestCases([...testCases, testCaseData]);
    }

    resetForm();
  };

  // Export functions
  const exportToCSV = () => {
    const headers = [
      'ID', 'Title', 'Description', 'Category', 'Priority', 'Type', 'Status',
      'Preconditions', 'Steps', 'Expected Outcome', 'Test Data', 'Estimated Time', 'Related Requirement'
    ];

    const csvData = testCases.map(tc => [
      tc.id,
      tc.title,
      tc.description,
      tc.category,
      tc.priority,
      tc.type,
      tc.status,
      tc.preconditions.join('; '),
      tc.steps.map(s => `${s.stepNumber}. ${s.action} -> ${s.expectedResult}`).join(' | '),
      tc.expectedOutcome,
      tc.testData.join('; '),
      tc.estimatedTime,
      tc.relatedRequirement
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test-cases.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    // For Excel export, we'll create a more structured format
    const excelData = testCases.map(tc => ({
      ID: tc.id,
      Title: tc.title,
      Description: tc.description,
      Category: tc.category,
      Priority: tc.priority,
      Type: tc.type,
      Status: tc.status,
      Preconditions: tc.preconditions.join('\n'),
      'Test Steps': tc.steps.map(s => `Step ${s.stepNumber}: ${s.action}\nExpected: ${s.expectedResult}`).join('\n\n'),
      'Expected Outcome': tc.expectedOutcome,
      'Test Data': tc.testData.join('\n'),
      'Estimated Time': tc.estimatedTime,
      'Related Requirement': tc.relatedRequirement,
      'Created Date': tc.createdDate?.toLocaleDateString() || '',
      'Updated Date': tc.updatedDate?.toLocaleDateString() || ''
    }));

    // Convert to CSV format for Excel compatibility
    const headers = Object.keys(excelData[0] || {});
    const csvContent = [
      headers.join(','),
      ...excelData.map(row => 
        headers.map(header => `"${(row as any)[header] || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test-cases.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Array manipulation helpers for form
  const addArrayItem = (field: 'preconditions' | 'testData') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), '']
    }));
  };

  const updateArrayItem = (field: 'preconditions' | 'testData', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] || []).map((item, i) => i === index ? value : item)
    }));
  };

  const removeArrayItem = (field: 'preconditions' | 'testData', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index)
    }));
  };

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...(prev.steps || []), { stepNumber: (prev.steps?.length || 0) + 1, action: '', expectedResult: '' }]
    }));
  };

  const updateStep = (index: number, field: 'action' | 'expectedResult', value: string) => {
    setFormData(prev => ({
      ...prev,
      steps: (prev.steps || []).map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: (prev.steps || []).filter((_, i) => i !== index).map((step, i) => ({ ...step, stepNumber: i + 1 }))
    }));
  };
  
  // Get test case status counts
  const getStatusCounts = () => {
    const counts = {
      total: testCases.length,
      notStarted: testCases.filter(tc => tc.status === 'Not Started').length,
      inProgress: testCases.filter(tc => tc.status === 'In Progress').length,
      passed: testCases.filter(tc => tc.status === 'Passed').length,
      failed: testCases.filter(tc => tc.status === 'Failed').length
    };
    
    return counts;
  };
  
  const statusCounts = getStatusCounts();
  
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
          <ClipboardList size={14} />
          Test Management
        </div>
        <h1 className="text-balance max-w-4xl mx-auto">
          Test Case Management
        </h1>
        <p className="text-lg max-w-2xl mx-auto text-balance text-[var(--text-secondary)]">
          Manage and track the status of your test cases
        </p>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="info-card border-gray-200 bg-gray-50">
          <div className="text-center">
            <p className="text-2xl font-bold text-[var(--text-primary)] mb-1">{statusCounts.total}</p>
            <p className="text-sm text-[var(--text-secondary)]">Total Tests</p>
          </div>
        </div>
        
        <div className="info-card border-gray-200 bg-gray-50">
          <div className="text-center">
            <p className="text-2xl font-bold text-[var(--text-tertiary)] mb-1">{statusCounts.notStarted}</p>
            <p className="text-sm text-[var(--text-secondary)]">Not Started</p>
          </div>
        </div>
        
        <div className="info-card border-amber-200 bg-amber-50">
          <div className="text-center">
            <p className="text-2xl font-bold text-[var(--warning)] mb-1">{statusCounts.inProgress}</p>
            <p className="text-sm text-[var(--text-secondary)]">In Progress</p>
          </div>
        </div>
        
        <div className="info-card border-green-200 bg-green-50">
          <div className="text-center">
            <p className="text-2xl font-bold text-[var(--success)] mb-1">{statusCounts.passed}</p>
            <p className="text-sm text-[var(--text-secondary)]">Passed</p>
          </div>
        </div>
      </div>
      
      {/* Regeneration Options Section */}
      {testCases.length > 0 && currentSummary && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <RefreshCw size={20} />
              </div>
              <div>
                <h3 className="font-semibold">Regenerate Test Cases</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Generate new test cases with different focus areas
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowRegenerateOptions(!showRegenerateOptions)}
              disabled={isProcessing}
              size="sm"
            >
              <Settings size={16} />
              {showRegenerateOptions ? 'Hide Options' : 'Show Options'}
            </Button>
          </div>
          
          {showRegenerateOptions && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {regenerateOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedRegenerateOption === option.id
                        ? 'border-[var(--primary)] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedRegenerateOption(option.id)}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="regenerateOption"
                        value={option.id}
                        checked={selectedRegenerateOption === option.id}
                        onChange={() => setSelectedRegenerateOption(option.id)}
                        className="mt-1"
                      />
                      <div>
                        <h4 className="font-medium text-sm mb-1">{option.title}</h4>
                        <p className="text-xs text-[var(--text-secondary)]">{option.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {error && (
                <div className="status-message status-error mb-4">
                  <AlertTriangle size={16} className="flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRegenerateOptions(false);
                    setSelectedRegenerateOption('');
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRegenerateTestCases}
                  isLoading={isProcessing}
                  disabled={!selectedRegenerateOption}
                  className="btn-primary"
                >
                  {isProcessing ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      Regenerate Test Cases
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Search and Actions */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="input pl-10"
            placeholder="Search test cases..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleAddTestCase}
            size="sm"
          >
            <Plus size={16} />
            Add Test Case
          </Button>
          
          {testCases.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={exportToCSV}
                size="sm"
              >
                <Download size={16} />
                CSV
              </Button>
              
              <Button
                variant="outline"
                onClick={exportToExcel}
                size="sm"
              >
                <Download size={16} />
                Excel
              </Button>
            </>
          )}
          
          <Button
            variant="outline"
            onClick={handleBack}
            size="sm"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
        </div>
      </div>
      
      <TestCaseFilter
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        onStatusFilterChange={handleStatusFilterChange}
        onPriorityFilterChange={handlePriorityFilterChange}
        onClearFilters={handleClearFilters}
      />
      
      {testCases.length === 0 ? (
        <div className="card text-center py-12">
          <AlertTriangle size={48} className="text-[var(--warning)] mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">No Test Cases Available</h3>
          <p className="text-[var(--text-secondary)] mb-6">
            You haven't generated any test cases yet. Go back to the previous step to generate test cases.
          </p>
          <Button onClick={handleBack} className="btn-primary">
            Generate Test Cases
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTestCases.length === 0 ? (
            <div className="card text-center py-8">
              <Search size={36} className="text-[var(--text-tertiary)] mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-2">No Matching Test Cases</h3>
              <p className="text-[var(--text-secondary)]">
                No test cases match your current filters. Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            filteredTestCases.map((testCase) => (
              <div key={testCase.id}>
                <TestCaseCard 
                  testCase={testCase} 
                  onEdit={() => handleEditTestCase(testCase)}
                  onDelete={() => handleDeleteTestCase(testCase.id)}
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* Test Case Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">
                {editingTestCase ? 'Edit Test Case' : 'Add New Test Case'}
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.title || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter test case title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.category || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Enter category"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select
                    className="input w-full"
                    value={formData.priority || 'Medium'}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as TestCase['priority'] }))}
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    className="input w-full"
                    value={formData.type || 'Functional'}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as TestCase['type'] }))}
                  >
                    <option value="Functional">Functional</option>
                    <option value="Non-Functional">Non-Functional</option>
                    <option value="Integration">Integration</option>
                    <option value="UI/UX">UI/UX</option>
                    <option value="Security">Security</option>
                    <option value="Performance">Performance</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Estimated Time</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.estimatedTime || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: e.target.value }))}
                    placeholder="e.g., 30 minutes"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Related Requirement</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.relatedRequirement || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, relatedRequirement: e.target.value }))}
                    placeholder="e.g., REQ-001"
                  />
                </div>
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  className="input w-full min-h-[100px] resize-none"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter detailed description of what is being tested"
                />
              </div>
              
              {/* Expected Outcome */}
              <div>
                <label className="block text-sm font-medium mb-2">Expected Outcome</label>
                <textarea
                  className="input w-full min-h-[80px] resize-none"
                  value={formData.expectedOutcome || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedOutcome: e.target.value }))}
                  placeholder="Enter the overall expected result of the test"
                />
              </div>
              
              {/* Preconditions */}
              <div>
                <label className="block text-sm font-medium mb-2">Preconditions</label>
                {(formData.preconditions || []).map((precondition, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      className="input flex-1"
                      value={precondition}
                      onChange={(e) => updateArrayItem('preconditions', index, e.target.value)}
                      placeholder="Enter precondition"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem('preconditions', index)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('preconditions')}
                >
                  <Plus size={14} />
                  Add Precondition
                </Button>
              </div>
              
              {/* Test Steps */}
              <div>
                <label className="block text-sm font-medium mb-2">Test Steps</label>
                {(formData.steps || []).map((step, index) => (
                  <div key={index} className="info-card mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium">Step {step.stepNumber}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeStep(index)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Action</label>
                        <textarea
                          className="input w-full min-h-[60px] resize-none"
                          value={step.action}
                          onChange={(e) => updateStep(index, 'action', e.target.value)}
                          placeholder="Describe the action to perform"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Expected Result</label>
                        <textarea
                          className="input w-full min-h-[60px] resize-none"
                          value={step.expectedResult}
                          onChange={(e) => updateStep(index, 'expectedResult', e.target.value)}
                          placeholder="Describe the expected result"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addStep}
                >
                  <Plus size={14} />
                  Add Step
                </Button>
              </div>
              
              {/* Test Data */}
              <div>
                <label className="block text-sm font-medium mb-2">Test Data</label>
                {(formData.testData || []).map((data, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      className="input flex-1"
                      value={data}
                      onChange={(e) => updateArrayItem('testData', index, e.target.value)}
                      placeholder="Enter test data"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem('testData', index)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('testData')}
                >
                  <Plus size={14} />
                  Add Test Data
                </Button>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={resetForm}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveTestCase}
                className="btn-primary"
              >
                {editingTestCase ? 'Update Test Case' : 'Add Test Case'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCaseManagement;