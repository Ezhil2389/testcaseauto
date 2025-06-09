import { TestCase, TestStep } from '../types';

export const parseTestCasesFromText = (text: string): TestCase[] => {
  // This is a simplified parser that assumes a specific format
  // In a real app, you might want to use a more robust parser or ask the LLM to return JSON
  
  const testCases: TestCase[] = [];
  const sections = text.split(/Test Case \d+:/);
  
  // Skip the first empty section if it exists
  const startIndex = sections[0].trim() === '' ? 1 : 0;
  
  for (let i = startIndex; i < sections.length; i++) {
    const section = sections[i].trim();
    if (!section) continue;
    
    const lines = section.split('\n').map(line => line.trim()).filter(line => line);
    
    // Basic extraction - would need refinement in a real app
    const title = lines[0];
    const descriptionLines = [];
    let currentIndex = 1;
    
    while (currentIndex < lines.length && !lines[currentIndex].startsWith('Steps:')) {
      descriptionLines.push(lines[currentIndex]);
      currentIndex++;
    }
    
    const description = descriptionLines.join('\n');
    
    // Move past "Steps:" label
    currentIndex++;
    
    // Extract steps
    const steps: TestStep[] = [];
    let stepIndex = 1;
    
    while (currentIndex < lines.length && !lines[currentIndex].startsWith('Expected Result:')) {
      // Look for numbered steps like "1. Do something"
      const stepMatch = lines[currentIndex].match(/^\d+\.\s+(.+)$/);
      
      if (stepMatch) {
        steps.push({
          id: crypto.randomUUID(),
          order: stepIndex,
          description: stepMatch[1]
        });
        stepIndex++;
      }
      
      currentIndex++;
    }
    
    // Move past "Expected Result:" label
    currentIndex++;
    
    // Extract expected result
    const expectedResultLines = [];
    
    while (currentIndex < lines.length && !lines[currentIndex].startsWith('Priority:')) {
      expectedResultLines.push(lines[currentIndex]);
      currentIndex++;
    }
    
    const expectedResult = expectedResultLines.join('\n');
    
    // Extract priority
    let priority: 'Low' | 'Medium' | 'High' | 'Critical' = 'Medium';
    
    if (currentIndex < lines.length) {
      const priorityLine = lines[currentIndex];
      const priorityMatch = priorityLine.match(/Priority:\s+(\w+)/);
      
      if (priorityMatch) {
        const priorityValue = priorityMatch[1];
        
        if (priorityValue === 'Low' || priorityValue === 'Medium' || 
            priorityValue === 'High' || priorityValue === 'Critical') {
          priority = priorityValue;
        }
      }
    }
    
    testCases.push({
      id: crypto.randomUUID(),
      summaryId: '', // Will be set when creating from a summary
      title,
      description,
      steps,
      expectedResult,
      status: 'Not Started',
      priority,
      createdDate: new Date()
    });
  }
  
  return testCases;
};