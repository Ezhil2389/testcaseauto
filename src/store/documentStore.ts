import { create } from 'zustand';
import { Document, Summary, TestCase, StructuredSummary } from '../types';

interface DocumentState {
  documents: Document[];
  currentSummary: Summary | null;
  testCases: TestCase[];
  isProcessing: boolean;
  
  // Document actions
  addDocument: (document: Document) => void;
  removeDocument: (id: string) => void;
  clearDocuments: () => void;
  
  // Summary actions
  setSummary: (summary: Summary) => void;
  updateSummaryContent: (content: string) => void;
  updateStructuredSummary: (structuredContent: StructuredSummary) => void;
  
  // Test case actions
  addTestCases: (testCases: TestCase[]) => void;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  removeTestCase: (id: string) => void;
  clearTestCases: () => void;
  
  // Processing state
  setProcessing: (isProcessing: boolean) => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  currentSummary: null,
  testCases: [],
  isProcessing: false,
  
  // Document actions
  addDocument: (document) => set((state) => ({
    documents: [...state.documents, document]
  })),
  
  removeDocument: (id) => set((state) => ({
    documents: state.documents.filter((doc) => doc.id !== id)
  })),
  
  clearDocuments: () => set({ documents: [], currentSummary: null, testCases: [] }),
  
  // Summary actions
  setSummary: (summary) => set({ currentSummary: summary }),
  
  updateSummaryContent: (content) => set((state) => ({
    currentSummary: state.currentSummary
      ? {
          ...state.currentSummary,
          editedContent: content,
          editedDate: new Date()
        }
      : null
  })),
  
  updateStructuredSummary: (structuredContent) => set((state) => ({
    currentSummary: state.currentSummary
      ? {
          ...state.currentSummary,
          editedStructuredContent: structuredContent,
          editedDate: new Date()
        }
      : null
  })),
  
  // Test case actions
  addTestCases: (testCases) => set((state) => ({
    testCases: [...testCases] // Replace existing test cases
  })),
  
  updateTestCase: (id, updates) => set((state) => ({
    testCases: state.testCases.map((testCase) => 
      testCase.id === id ? { 
        ...testCase, 
        ...updates, 
        updatedDate: new Date() 
      } : testCase
    )
  })),
  
  removeTestCase: (id) => set((state) => ({
    testCases: state.testCases.filter((testCase) => testCase.id !== id)
  })),
  
  clearTestCases: () => set({ testCases: [] }),
  
  // Processing state
  setProcessing: (isProcessing) => set({ isProcessing })
}));