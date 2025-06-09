import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ArrowLeft, AlertTriangle, Search } from 'lucide-react';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import TestCaseCard from '../../components/TestCases/TestCaseCard';
import TestCaseFilter from '../../components/TestCases/TestCaseFilter';
import { useDocumentStore } from '../../store/documentStore';
import { TestCase } from '../../types';

const TestCaseManagement: React.FC = () => {
  const { testCases, currentSummary } = useDocumentStore();
  const [filteredTestCases, setFilteredTestCases] = useState<TestCase[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
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
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Test Case Management</h1>
        <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
          Manage and track the status of your test cases. Update test statuses as you progress through testing.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="flex flex-col items-center justify-center py-4">
          <p className="text-2xl font-bold text-[var(--text-primary)]">{statusCounts.total}</p>
          <p className="text-sm text-[var(--text-secondary)]">Total Tests</p>
        </Card>
        
        <Card className="flex flex-col items-center justify-center py-4">
          <p className="text-2xl font-bold text-[var(--text-tertiary)]">{statusCounts.notStarted}</p>
          <p className="text-sm text-[var(--text-secondary)]">Not Started</p>
        </Card>
        
        <Card className="flex flex-col items-center justify-center py-4">
          <p className="text-2xl font-bold text-[var(--warning)]">{statusCounts.inProgress}</p>
          <p className="text-sm text-[var(--text-secondary)]">In Progress</p>
        </Card>
        
        <Card className="flex flex-col items-center justify-center py-4">
          <p className="text-2xl font-bold text-[var(--success)]">{statusCounts.passed}</p>
          <p className="text-sm text-[var(--text-secondary)]">Passed</p>
        </Card>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="input pl-10"
            placeholder="Search test cases..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        
        <Button
          variant="outline"
          onClick={handleBack}
        >
          <ArrowLeft size={16} />
          Back to Generation
        </Button>
      </div>
      
      <TestCaseFilter
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        onStatusFilterChange={handleStatusFilterChange}
        onPriorityFilterChange={handlePriorityFilterChange}
        onClearFilters={handleClearFilters}
      />
      
      {testCases.length === 0 ? (
        <Card className="text-center py-12">
          <AlertTriangle size={48} className="text-[var(--warning)] mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">No Test Cases Available</h3>
          <p className="text-[var(--text-secondary)] mb-6">
            You haven't generated any test cases yet. Go back to the previous step to generate test cases.
          </p>
          <Button onClick={handleBack}>
            Generate Test Cases
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTestCases.length === 0 ? (
            <Card className="text-center py-8">
              <Search size={36} className="text-[var(--text-tertiary)] mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-2">No Matching Test Cases</h3>
              <p className="text-[var(--text-secondary)]">
                No test cases match your current filters. Try adjusting your search or filters.
              </p>
            </Card>
          ) : (
            filteredTestCases.map((testCase) => (
              <TestCaseCard key={testCase.id} testCase={testCase} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default TestCaseManagement;