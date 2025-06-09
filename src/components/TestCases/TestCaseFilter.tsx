import React from 'react';
import { Filter } from 'lucide-react';
import Button from '../UI/Button';

interface TestCaseFilterProps {
  statusFilter: string | null;
  priorityFilter: string | null;
  onStatusFilterChange: (status: string | null) => void;
  onPriorityFilterChange: (priority: string | null) => void;
  onClearFilters: () => void;
}

const TestCaseFilter: React.FC<TestCaseFilterProps> = ({
  statusFilter,
  priorityFilter,
  onStatusFilterChange,
  onPriorityFilterChange,
  onClearFilters
}) => {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Filter size={16} className="text-[var(--text-secondary)] mr-2" />
          <h3 className="font-medium">Filters</h3>
        </div>
        
        <Button
          size="sm"
          variant="outline"
          onClick={onClearFilters}
        >
          Clear Filters
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Status
          </label>
          
          <div className="flex flex-wrap gap-2">
            {['Not Started', 'In Progress', 'Passed', 'Failed'].map((status) => (
              <button
                key={status}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  statusFilter === status
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-gray-100 text-[var(--text-secondary)] hover:bg-gray-200'
                }`}
                onClick={() => onStatusFilterChange(statusFilter === status ? null : status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Priority
          </label>
          
          <div className="flex flex-wrap gap-2">
            {['Low', 'Medium', 'High', 'Critical'].map((priority) => (
              <button
                key={priority}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  priorityFilter === priority
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-gray-100 text-[var(--text-secondary)] hover:bg-gray-200'
                }`}
                onClick={() => onPriorityFilterChange(priorityFilter === priority ? null : priority)}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCaseFilter;