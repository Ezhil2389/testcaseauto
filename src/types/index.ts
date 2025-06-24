export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  uploadDate: Date;
  metadata?: {
    originalSize: number;
    processedSize: number;
    fileExtension: string;
    processingDate: Date;
  };
}

export interface StructuredSummary {
  projectOverview: {
    title: string;
    description: string;
    scope: string;
    objectives: string[];
  };
  stakeholders: {
    name: string;
    role: string;
    responsibilities: string[];
  }[];
  functionalRequirements: {
    id: string;
    title: string;
    description: string;
    priority: 'Critical' | 'High' | 'Medium' | 'Low';
    acceptanceCriteria: string[];
  }[];
  nonFunctionalRequirements: {
    category: string;
    requirements: string[];
  }[];
  userStories: {
    id: string;
    asA: string;
    iWant: string;
    soThat: string;
    acceptanceCriteria: string[];
    priority: 'Critical' | 'High' | 'Medium' | 'Low';
  }[];
  businessRules: string[];
  constraints: string[];
  assumptions: string[];
  dependencies: string[];
  otherComments?: string;
}

export interface Summary {
  id: string;
  documentIds: string[];
  content: string; // Legacy support
  structuredContent?: StructuredSummary;
  generatedDate: Date;
  editedContent?: string;
  editedStructuredContent?: StructuredSummary;
  editedDate?: Date;
}

export interface TestCase {
  id: string;
  summaryId?: string; // Legacy support
  title: string;
  description: string;
  category: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  type: 'Functional' | 'Non-Functional' | 'Integration' | 'UI/UX' | 'Security' | 'Performance';
  preconditions: string[];
  steps: TestStep[];
  expectedOutcome: string;
  testData: string[];
  status: 'Not Started' | 'In Progress' | 'Passed' | 'Failed' | 'Blocked';
  estimatedTime: string;
  relatedRequirement: string;
  assignee?: string;
  createdDate: Date;
  updatedDate?: Date;
  // Legacy support
  expectedResult?: string;
}

export interface TestStep {
  stepNumber: number;
  action: string;
  expectedResult: string;
  // Legacy support
  id?: string;
  order?: number;
  description?: string;
}

export interface ProcessingProgress {
  stage: 'uploading' | 'analyzing' | 'summarizing' | 'generating-tests' | 'complete';
  progress: number; // 0-100
  message: string;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FileProcessingResult {
  success: boolean;
  document?: Document;
  error?: string;
  warnings?: string[];
}