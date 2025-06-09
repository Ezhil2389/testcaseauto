const API_KEY = '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';
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama3-70b-8192'; // Using a more reliable model

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
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
}

export interface TestCase {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  type: 'Functional' | 'Non-Functional' | 'Integration' | 'UI/UX' | 'Security' | 'Performance';
  preconditions: string[];
  steps: {
    stepNumber: number;
    action: string;
    expectedResult: string;
  }[];
  expectedOutcome: string;
  testData: string[];
  status: 'Not Started' | 'In Progress' | 'Passed' | 'Failed' | 'Blocked';
  estimatedTime: string;
  relatedRequirement: string;
}

const SUMMARY_SYSTEM_PROMPT = `You are an expert Business Analyst. You MUST respond with ONLY a valid JSON object in the EXACT format specified below. No additional text, explanations, or markdown formatting.

CRITICAL INSTRUCTIONS:
- Respond with ONLY the JSON object
- Do NOT use markdown code blocks (no \`\`\`json)
- Do NOT add any explanatory text before or after the JSON
- Extract actual information from the document when available
- Use generic fallbacks only when specific information is not found
- All string values must be properly escaped for JSON

REQUIRED JSON FORMAT (copy this structure exactly):
{
  "projectOverview": {
    "title": "Extract actual project name or use 'Business Requirements Analysis'",
    "description": "Extract actual project description or use generic description",
    "scope": "Extract actual scope or use generic scope",
    "objectives": ["Extract actual objectives as array of strings, minimum 3 items"]
  },
  "stakeholders": [
    {
      "name": "Extract actual names or use generic roles",
      "role": "Extract actual roles",
      "responsibilities": ["Array of responsibility strings"]
    }
  ],
  "functionalRequirements": [
    {
      "id": "REQ-001",
      "title": "Extract or generate requirement title",
      "description": "Extract actual requirement description",
      "priority": "High",
      "acceptanceCriteria": ["Array of criteria strings"]
    }
  ],
  "nonFunctionalRequirements": [
    {
      "category": "Performance",
      "requirements": ["Array of NFR strings"]
    }
  ],
  "userStories": [
    {
      "id": "US-001",
      "asA": "User type",
      "iWant": "User want",
      "soThat": "User benefit",
      "acceptanceCriteria": ["Array of criteria"],
      "priority": "High"
    }
  ],
  "businessRules": ["Array of business rule strings"],
  "constraints": ["Array of constraint strings"],
  "assumptions": ["Array of assumption strings"],
  "dependencies": ["Array of dependency strings"]
}

VALIDATION RULES:
- All arrays must have at least 1 item
- Priority values must be exactly: "Critical", "High", "Medium", or "Low"
- All strings must be non-empty
- Functional requirements must have sequential REQ-XXX IDs
- User stories must have sequential US-XXX IDs`;

const TEST_CASE_SYSTEM_PROMPT = `You are an expert QA Engineer. You MUST respond with ONLY a valid JSON array in the EXACT format specified below. No additional text, explanations, or markdown formatting.

CRITICAL INSTRUCTIONS:
- Respond with ONLY the JSON array
- Do NOT use markdown code blocks (no \`\`\`json)
- Do NOT add any explanatory text before or after the JSON
- Generate comprehensive test cases based on the requirements provided
- Include both positive and negative test scenarios
- Create detailed step-by-step test procedures

REQUIRED JSON FORMAT (copy this structure exactly):
[
  {
    "id": "TC-001",
    "title": "Descriptive test case title",
    "description": "Detailed description of what is being tested",
    "category": "Feature category from requirements",
    "priority": "High",
    "type": "Functional",
    "preconditions": ["Array of precondition strings"],
    "steps": [
      {
        "stepNumber": 1,
        "action": "Specific action to perform",
        "expectedResult": "Expected outcome of this step"
      }
    ],
    "expectedOutcome": "Overall expected result of the test",
    "testData": ["Array of test data strings"],
    "status": "Not Started",
    "estimatedTime": "30 minutes",
    "relatedRequirement": "REQ-001"
  }
]

VALIDATION RULES:
- Generate minimum 5 test cases, maximum 20
- Test case IDs must be sequential: TC-001, TC-002, etc.
- Priority must be exactly: "Critical", "High", "Medium", or "Low"
- Type must be exactly: "Functional", "Non-Functional", "Integration", "UI/UX", "Security", or "Performance"
- Status must be exactly: "Not Started"
- Each test case must have at least 3 steps
- Steps must be numbered sequentially starting from 1
- All arrays must have at least 1 item
- All strings must be non-empty and descriptive`;

async function makeAPICall(messages: ChatMessage[]): Promise<string> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.1, // Very low temperature for consistent JSON output
        max_tokens: 4000,
        top_p: 0.9,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
        // Add stop sequences to prevent extra content
        stop: ["\n\nHuman:", "\n\nAssistant:", "```", "Note:", "Explanation:"]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data: ChatCompletionResponse = await response.json();
    const content = data.choices[0]?.message.content || '';
    
    if (!content) {
      throw new Error('Empty response from AI service');
    }
    
    // Additional cleaning - remove any common AI response artifacts
    let cleanedContent = content.trim();
    
    // Remove common prefixes that AI might add
    const unwantedPrefixes = [
      'Here is the JSON object:',
      'Here\'s the JSON:',
      'The JSON structure is:',
      'Based on the analysis:',
      'Here is the analysis:',
      'The extracted information:',
      'Analysis result:'
    ];
    
    for (const prefix of unwantedPrefixes) {
      if (cleanedContent.toLowerCase().startsWith(prefix.toLowerCase())) {
        cleanedContent = cleanedContent.substring(prefix.length).trim();
      }
    }
    
    return cleanedContent;
  } catch (error) {
    console.error('Error making API call:', error);
    throw error;
  }
}

export async function generateSummary(documentContent: string): Promise<StructuredSummary> {
  // Check if this is a binary file notification
  if (documentContent.includes('[BINARY FILE DETECTED]')) {
    console.log('Binary file detected, using enhanced fallback with file info');
    return createBinaryFileFallbackSummary(documentContent);
  }

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: SUMMARY_SYSTEM_PROMPT
    },
    {
      role: 'user',
      content: `Analyze this business requirements document and extract structured information. Respond with ONLY the JSON object in the exact format specified:

DOCUMENT CONTENT:
${documentContent}

Remember: Respond with ONLY the JSON object, no markdown, no explanations.`
    }
  ];

  try {
    console.log('Calling AI service for summary generation...');
    const response = await makeAPICall(messages);
    console.log('Raw AI response:', response.substring(0, 500) + '...');
    
    // Clean the response more aggressively
    let cleanedResponse = response.trim();
    
    // Remove any markdown formatting
    cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Remove any explanatory text before the JSON
    const jsonStart = cleanedResponse.indexOf('{');
    const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      console.warn('No JSON object found in response. Using fallback.');
      return createIntelligentFallbackSummary(documentContent);
    }
    
    const jsonOnly = cleanedResponse.substring(jsonStart, jsonEnd);
    
    try {
      const parsedSummary = JSON.parse(jsonOnly) as StructuredSummary;
      console.log('Successfully parsed AI response');
      
      // Validate the structure
      if (!parsedSummary.projectOverview || !parsedSummary.functionalRequirements || !Array.isArray(parsedSummary.functionalRequirements)) {
        throw new Error('Invalid JSON structure from AI');
      }
      
      // Ensure all required arrays exist and have content
      const validatedSummary = validateAndEnhanceSummary(parsedSummary, documentContent);
      
      return validatedSummary;
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.log('Problematic JSON:', jsonOnly.substring(0, 200));
      return createIntelligentFallbackSummary(documentContent);
    }
  } catch (error) {
    console.error('Error generating summary:', error);
    console.log('Using fallback content extraction...');
    return createIntelligentFallbackSummary(documentContent);
  }
}

function createBinaryFileFallbackSummary(fileInfo: string): StructuredSummary {
  console.log('Creating binary file fallback summary...');
  
  // Extract file name and type from the binary file notification
  const fileNameMatch = fileInfo.match(/File: (.+)/);
  const fileName = fileNameMatch ? fileNameMatch[1] : 'Unknown Document';
  
  return {
    projectOverview: {
      title: `Document Analysis: ${fileName}`,
      description: "This document appears to be a binary file (PDF or Office document). For complete analysis, please convert to plain text format or copy-paste the content directly.",
      scope: "Document processing with limited text extraction capabilities",
      objectives: [
        "Provide document processing for binary files",
        "Offer guidance for better document format",
        "Enable basic analysis workflow",
        "Support multiple document types"
      ]
    },
    stakeholders: [
      {
        name: "Document Author",
        role: "Content Creator",
        responsibilities: ["Document creation", "Content accuracy", "Format selection"]
      },
      {
        name: "System User",
        role: "Analyst",
        responsibilities: ["Document upload", "Content review", "Analysis validation"]
      },
      {
        name: "System Administrator",
        role: "Technical Support",
        responsibilities: ["File processing support", "Format guidance", "System maintenance"]
      }
    ],
    functionalRequirements: [
      {
        id: "REQ-001",
        title: "Document Upload Processing",
        description: "System shall accept and process various document formats including binary files",
        priority: "High",
        acceptanceCriteria: ["Files can be uploaded successfully", "Binary files are detected", "Users receive appropriate feedback"]
      },
      {
        id: "REQ-002", 
        title: "Format Guidance",
        description: "System shall provide guidance for optimal document formats",
        priority: "Medium",
        acceptanceCriteria: ["Users receive format recommendations", "Alternative options are provided", "Clear instructions are given"]
      }
    ],
    nonFunctionalRequirements: [
      {
        category: "Usability",
        requirements: ["Clear error messages for binary files", "Helpful guidance for users", "Graceful handling of unsupported formats"]
      },
      {
        category: "Compatibility",
        requirements: ["Support for multiple file types", "Binary file detection", "Fallback processing capabilities"]
      }
    ],
    userStories: [
      {
        id: "US-001",
        asA: "User",
        iWant: "to upload various document formats",
        soThat: "I can analyze my business requirements regardless of format",
        acceptanceCriteria: ["File upload works for multiple formats", "Clear feedback is provided", "Alternative options are suggested"],
        priority: "High"
      }
    ],
    businessRules: [
      "Binary files are detected and handled gracefully",
      "Users are provided with format optimization guidance",
      "System attempts analysis even with limited text extraction"
    ],
    constraints: [
      "Limited text extraction from binary formats",
      "PDF processing requires specialized libraries",
      "Office documents need format conversion for optimal results"
    ],
    assumptions: [
      "Users can convert documents to text format if needed",
      "Document content is meaningful for business analysis",
      "Alternative formats are available to users"
    ],
    dependencies: [
      "File upload system",
      "Binary file detection algorithms",
      "User guidance interface"
    ]
  };
}

export async function generateTestCases(summaryContent: StructuredSummary | string): Promise<TestCase[]> {
  console.log('generateTestCases called with:', typeof summaryContent);
  
  const contentToAnalyze = typeof summaryContent === 'string' 
    ? summaryContent 
    : JSON.stringify(summaryContent, null, 2);

  console.log('Content to analyze (first 500 chars):', contentToAnalyze.slice(0, 500));

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: TEST_CASE_SYSTEM_PROMPT
    },
    {
      role: 'user',
      content: `Generate comprehensive test cases based on these requirements. Respond with ONLY the JSON array in the exact format specified:

REQUIREMENTS:
${contentToAnalyze}

Remember: Respond with ONLY the JSON array, no markdown, no explanations.`
    }
  ];

  try {
    console.log('Making API call for test case generation...');
    const response = await makeAPICall(messages);
    console.log('Raw API response for test cases:', response.substring(0, 500) + '...');
    
    // Clean the response more aggressively
    let cleanedResponse = response.trim();
    
    // Remove any markdown formatting
    cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Find the JSON array
    const arrayStart = cleanedResponse.indexOf('[');
    const arrayEnd = cleanedResponse.lastIndexOf(']') + 1;
    
    if (arrayStart === -1 || arrayEnd === 0) {
      console.warn('No JSON array found in response, using fallback.');
      return createIntelligentFallbackTestCases(summaryContent);
    }
    
    const jsonOnly = cleanedResponse.substring(arrayStart, arrayEnd);
    
    try {
      const parsedTestCases = JSON.parse(jsonOnly) as TestCase[];
      console.log('Successfully parsed test cases from AI:', parsedTestCases.length, 'test cases');
      
      // Validate and enhance each test case
      const validatedTestCases = parsedTestCases.map((testCase, index) => ({
        id: testCase.id || `TC-${String(index + 1).padStart(3, '0')}`,
        title: testCase.title || `Test Case ${index + 1}`,
        description: testCase.description || 'Verify system functionality',
        category: testCase.category || 'General',
        priority: ['Critical', 'High', 'Medium', 'Low'].includes(testCase.priority) ? testCase.priority : 'Medium',
        type: ['Functional', 'Non-Functional', 'Integration', 'UI/UX', 'Security', 'Performance'].includes(testCase.type) ? testCase.type : 'Functional',
        preconditions: Array.isArray(testCase.preconditions) ? testCase.preconditions : ['System is accessible'],
        steps: Array.isArray(testCase.steps) ? testCase.steps.map((step, stepIndex) => ({
          stepNumber: step.stepNumber || stepIndex + 1,
          action: step.action || 'Perform action',
          expectedResult: step.expectedResult || 'Expected result'
        })) : [],
        expectedOutcome: testCase.expectedOutcome || 'System functions as expected',
        testData: Array.isArray(testCase.testData) ? testCase.testData : ['Test data'],
        status: 'Not Started' as const,
        estimatedTime: testCase.estimatedTime || '30 minutes',
        relatedRequirement: testCase.relatedRequirement || ''
      }));
      
      console.log('Validated test cases:', validatedTestCases.length, 'test cases ready');
      return validatedTestCases.length > 0 ? validatedTestCases : createIntelligentFallbackTestCases(summaryContent);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.log('Problematic JSON:', jsonOnly.substring(0, 200));
      return createIntelligentFallbackTestCases(summaryContent);
    }
  } catch (error) {
    console.error('Error generating test cases:', error);
    console.log('Using fallback test case generation');
    return createIntelligentFallbackTestCases(summaryContent);
  }
}

function validateAndEnhanceSummary(summary: StructuredSummary, originalContent: string): StructuredSummary {
  // Ensure all required fields have content
  const enhanced: StructuredSummary = {
    projectOverview: {
      title: summary.projectOverview?.title || extractProjectTitle(originalContent) || "Business Requirements Project",
      description: summary.projectOverview?.description || extractProjectDescription(originalContent) || "Project to implement business requirements",
      scope: summary.projectOverview?.scope || extractProjectScope(originalContent) || "Scope to be defined based on requirements",
      objectives: summary.projectOverview?.objectives?.length > 0 ? summary.projectOverview.objectives : extractObjectives(originalContent)
    },
    stakeholders: summary.stakeholders?.length > 0 ? summary.stakeholders : extractStakeholders(originalContent),
    functionalRequirements: summary.functionalRequirements?.length > 0 ? summary.functionalRequirements : extractFunctionalRequirements(originalContent),
    nonFunctionalRequirements: summary.nonFunctionalRequirements?.length > 0 ? summary.nonFunctionalRequirements : extractNonFunctionalRequirements(originalContent),
    userStories: summary.userStories?.length > 0 ? summary.userStories : extractUserStories(originalContent),
    businessRules: summary.businessRules?.length > 0 ? summary.businessRules : extractBusinessRules(originalContent),
    constraints: summary.constraints?.length > 0 ? summary.constraints : extractConstraints(originalContent),
    assumptions: summary.assumptions?.length > 0 ? summary.assumptions : extractAssumptions(originalContent),
    dependencies: summary.dependencies?.length > 0 ? summary.dependencies : extractDependencies(originalContent)
  };
  
  return enhanced;
}

function createIntelligentFallbackSummary(documentContent: string): StructuredSummary {
  console.log('Creating intelligent fallback summary from document content...');
  
  return {
    projectOverview: {
      title: extractProjectTitle(documentContent),
      description: extractProjectDescription(documentContent),
      scope: extractProjectScope(documentContent),
      objectives: extractObjectives(documentContent)
    },
    stakeholders: extractStakeholders(documentContent),
    functionalRequirements: extractFunctionalRequirements(documentContent),
    nonFunctionalRequirements: extractNonFunctionalRequirements(documentContent),
    userStories: extractUserStories(documentContent),
    businessRules: extractBusinessRules(documentContent),
    constraints: extractConstraints(documentContent),
    assumptions: extractAssumptions(documentContent),
    dependencies: extractDependencies(documentContent)
  };
}

function extractProjectTitle(content: string): string {
  const titlePatterns = [
    /project\s*name[:\s]*([^\n\r]+)/i,
    /project[:\s]*([A-Z][^\n\r]{10,80})/i,
    /##\s*([A-Z][^\n\r]{5,60})/m,
    /title[:\s]*([^\n\r]+)/i,
    /^#\s*([^\n\r]+)/m,
    /business\s*requirements?\s*document[:\s]*([^\n\r]+)/i,
    /system[:\s]*([A-Z][^\n\r]{5,50})/i
  ];
  
  for (const pattern of titlePatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const title = match[1].trim().replace(/[*#]/g, '');
      if (title.length > 5) {
        return title;
      }
    }
  }
  
  // Try to extract from document content
  const firstLine = content.split('\n')[0];
  if (firstLine && firstLine.length > 10 && firstLine.length < 100) {
    return firstLine.trim().replace(/[*#]/g, '');
  }
  
  return "Business Requirements Project";
}

function extractProjectDescription(content: string): string {
  const descPatterns = [
    /project\s*overview[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i,
    /executive\s*summary[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i,
    /overview[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i,
    /description[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i,
    /purpose[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i,
    /background[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i
  ];
  
  for (const pattern of descPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const desc = match[1].trim().replace(/[*-]/g, '').substring(0, 300);
      if (desc.length > 50) {
        return desc + (desc.length === 300 ? '...' : '');
      }
    }
  }
  
  // Try to extract from first few sentences
  const sentences = content.match(/[^.!?]*[.!?]/g);
  if (sentences && sentences.length > 0) {
    const firstSentences = sentences.slice(0, 3).join(' ').trim();
    if (firstSentences.length > 50) {
      return firstSentences.substring(0, 300) + (firstSentences.length > 300 ? '...' : '');
    }
  }
  
  return "Project to implement business requirements and improve operational efficiency";
}

function extractProjectScope(content: string): string {
  const scopePatterns = [
    /scope[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i,
    /in\s*scope[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i,
    /project\s*scope[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i
  ];
  
  for (const pattern of scopePatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const scope = match[1].trim().replace(/[*-]/g, '').substring(0, 200);
      if (scope.length > 30) {
        return scope;
      }
    }
  }
  
  return "Implementation of core business functionality and system requirements";
}

function extractObjectives(content: string): string[] {
  const objectives: string[] = [];
  const patterns = [
    /business\s*objectives?[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i,
    /objectives?[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i,
    /goals?[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i,
    /purpose[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const section = match[1];
      const bulletPoints = section.match(/[-*•]\s*([^\n\r]+)/g);
      if (bulletPoints) {
        bulletPoints.forEach(bullet => {
          const obj = bullet.replace(/[-*•]\s*/, '').trim();
          if (obj.length > 10) {
            objectives.push(obj);
          }
        });
      }
    }
  }
  
  return objectives.length > 0 ? objectives.slice(0, 6) : [
    "Improve business process efficiency",
    "Enhance user experience and satisfaction", 
    "Ensure system reliability and performance",
    "Meet regulatory and compliance requirements"
  ];
}

function extractStakeholders(content: string): StructuredSummary['stakeholders'] {
  const stakeholders: StructuredSummary['stakeholders'] = [];
  
  // Look for stakeholder table or list
  const stakeholderMatch = content.match(/stakeholder[s]?[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i);
  if (stakeholderMatch) {
    const section = stakeholderMatch[1];
    const tableRows = section.match(/\|[^|\n\r]+\|[^|\n\r]+\|[^|\n\r]+\|/g);
    
    if (tableRows) {
      tableRows.slice(1).forEach(row => { // Skip header
        const columns = row.split('|').map(col => col.trim()).filter(col => col);
        if (columns.length >= 2) {
          stakeholders.push({
            name: columns[0],
            role: columns[1],
            responsibilities: columns[2] ? [columns[2]] : ["Define and manage requirements"]
          });
        }
      });
    }
  }
  
  if (stakeholders.length === 0) {
    // Look for mentioned stakeholders in text - be more generic
    const mentions = content.match(/(project\s*manager|business\s*analyst|developer[s]?|tester[s]?|user[s]?|client[s]?|customer[s]?|administrator[s]?|manager[s]?|team\s*lead[s]?)/gi);
    if (mentions) {
      const unique = [...new Set(mentions.map(m => m.toLowerCase()))];
      unique.slice(0, 5).forEach(mention => {
        stakeholders.push({
          name: mention.charAt(0).toUpperCase() + mention.slice(1),
          role: `${mention.charAt(0).toUpperCase() + mention.slice(1)} Role`,
          responsibilities: ["Project stakeholder responsibilities"]
        });
      });
    }
  }
  
  return stakeholders.length > 0 ? stakeholders.slice(0, 5) : [
    {
      name: "Project Manager",
      role: "Project Lead",
      responsibilities: ["Project planning and coordination", "Stakeholder communication", "Timeline management"]
    },
    {
      name: "Business Analyst", 
      role: "Requirements Owner",
      responsibilities: ["Requirements gathering", "Process analysis", "Documentation"]
    },
    {
      name: "End Users",
      role: "System Users",
      responsibilities: ["System usage", "Feedback provision", "Testing support"]
    }
  ];
}

function extractFunctionalRequirements(content: string): StructuredSummary['functionalRequirements'] {
  const requirements = [];
  
  // Look for REQ-XXX patterns
  const reqMatches = content.matchAll(/\*\*REQ-(\d+):\*\*\s*([^\n\r]+)/g);
  
  for (const match of reqMatches) {
    const reqId = `REQ-${match[1].padStart(3, '0')}`;
    const description = match[2].trim();
    
    requirements.push({
      id: reqId,
      title: generateRequirementTitle(description),
      description: description,
      priority: inferPriority(description),
      acceptanceCriteria: [generateAcceptanceCriteria(description)]
    });
  }
  
  // If no specific REQ patterns found, try to extract from content
  if (requirements.length === 0) {
    const functionalSection = content.match(/functional\s*requirements?[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i);
    if (functionalSection) {
      const bullets = extractBulletPoints(functionalSection[1]);
      bullets.slice(0, 10).forEach((bullet, index) => {
        requirements.push({
          id: `REQ-${String(index + 1).padStart(3, '0')}`,
          title: generateRequirementTitle(bullet),
          description: bullet,
          priority: inferPriority(bullet),
          acceptanceCriteria: [generateAcceptanceCriteria(bullet)]
        });
      });
    }
  }
  
  return requirements.length > 0 ? requirements.slice(0, 15) : [
    {
      id: "REQ-001",
      title: "System Functionality",
      description: "System shall provide core functionality as specified in the business requirements",
      priority: "High" as const,
      acceptanceCriteria: ["Core functionality is implemented", "All requirements are met", "System performs as expected"]
    }
  ];
}

function extractNonFunctionalRequirements(content: string): StructuredSummary['nonFunctionalRequirements'] {
  const nfrs = [];
  
  // Look for performance, security, etc. sections
  const perfMatch = content.match(/performance\s*requirements?[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i);
  if (perfMatch) {
    const reqs = extractBulletPoints(perfMatch[1]);
    if (reqs.length > 0) {
      nfrs.push({
        category: "Performance",
        requirements: reqs
      });
    }
  }
  
  const secMatch = content.match(/security\s*requirements?[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i);
  if (secMatch) {
    const reqs = extractBulletPoints(secMatch[1]);
    if (reqs.length > 0) {
      nfrs.push({
        category: "Security", 
        requirements: reqs
      });
    }
  }
  
  const availMatch = content.match(/availability\s*requirements?[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i);
  if (availMatch) {
    const reqs = extractBulletPoints(availMatch[1]);
    if (reqs.length > 0) {
      nfrs.push({
        category: "Availability",
        requirements: reqs
      });
    }
  }
  
  return nfrs.length > 0 ? nfrs : [
    {
      category: "Performance",
      requirements: ["System response time should be under 3 seconds", "Support reasonable concurrent user load", "Maintain performance under normal operating conditions"]
    },
    {
      category: "Security",
      requirements: ["Implement appropriate access controls", "Ensure data protection and privacy", "Follow security best practices"]
    }
  ];
}

function extractUserStories(content: string): StructuredSummary['userStories'] {
  const stories = [];
  
  // Extract from functional requirements and convert to user stories
  const reqMatches = content.matchAll(/\*\*REQ-(\d+):\*\*\s*([^\n\r]+)/g);
  let storyId = 1;
  
  for (const match of reqMatches) {
    const description = match[2].trim();
    const userType = inferUserType(description);
    const want = convertReqToUserWant(description);
    const benefit = inferBenefit(description);
    
    if (want) {
      stories.push({
        id: `US-${String(storyId).padStart(3, '0')}`,
        asA: userType,
        iWant: want,
        soThat: benefit,
        acceptanceCriteria: [generateAcceptanceCriteria(description)],
        priority: inferPriority(description)
      });
      storyId++;
    }
  }
  
  return stories.length > 0 ? stories.slice(0, 10) : [
    {
      id: "US-001",
      asA: "User",
      iWant: "to access system functionality",
      soThat: "I can complete my required tasks",
      acceptanceCriteria: ["User can access the system", "User can perform required operations", "System responds appropriately"],
      priority: "High" as const
    }
  ];
}

function extractBusinessRules(content: string): string[] {
  const rules = [];
  
  // Look for business rules section
  const rulesMatch = content.match(/business\s*rules?[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i);
  if (rulesMatch) {
    const rulesList = extractBulletPoints(rulesMatch[1]);
    rules.push(...rulesList);
  }
  
  // Look for BR-XXX patterns
  const brMatches = content.matchAll(/\*\*BR-(\d+):\*\*\s*([^\n\r]+)/g);
  for (const match of brMatches) {
    rules.push(match[2].trim());
  }
  
  return rules.length > 0 ? rules : [
    "Business operations follow standard procedures",
    "Data processing adheres to business policies",
    "System access is controlled according to business needs"
  ];
}

function extractConstraints(content: string): string[] {
  const constraints = [];
  
  const constraintMatch = content.match(/constraints?[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i);
  if (constraintMatch) {
    const list = extractBulletPoints(constraintMatch[1]);
    constraints.push(...list);
  }
  
  return constraints.length > 0 ? constraints : [
    "Budget and resource limitations",
    "Time and schedule constraints", 
    "Technical and platform constraints",
    "Regulatory and compliance requirements"
  ];
}

function extractAssumptions(content: string): string[] {
  const assumptions = [];
  
  const assumptionMatch = content.match(/assumptions?[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i);
  if (assumptionMatch) {
    const list = extractBulletPoints(assumptionMatch[1]);
    assumptions.push(...list);
  }
  
  return assumptions.length > 0 ? assumptions : [
    "Users have necessary technical knowledge",
    "Required infrastructure is available",
    "Stakeholders will provide timely feedback"
  ];
}

function extractDependencies(content: string): string[] {
  const dependencies = [];
  
  const depMatch = content.match(/dependencies?[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i);
  if (depMatch) {
    const list = extractBulletPoints(depMatch[1]);
    dependencies.push(...list);
  }
  
  // Look for integration section
  const intMatch = content.match(/integration[s]?[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i);
  if (intMatch) {
    const list = extractBulletPoints(intMatch[1]);
    dependencies.push(...list);
  }
  
  return dependencies.length > 0 ? dependencies : [
    "External system integrations",
    "Third-party service dependencies",
    "Infrastructure and platform requirements"
  ];
}

// Helper functions
function extractBulletPoints(text: string): string[] {
  const bullets = text.match(/[-*•]\s*([^\n\r]+)/g);
  if (bullets) {
    return bullets.map(bullet => bullet.replace(/[-*•]\s*/, '').trim()).filter(item => item.length > 5);
  }
  return [];
}

function generateRequirementTitle(description: string): string {
  const words = description.split(' ').slice(0, 6);
  return words.join(' ').replace(/[^\w\s]/g, '');
}

function inferPriority(description: string): 'Critical' | 'High' | 'Medium' | 'Low' {
  const lower = description.toLowerCase();
  if (lower.includes('critical') || lower.includes('essential') || lower.includes('must')) return 'Critical';
  if (lower.includes('important') || lower.includes('required') || lower.includes('shall')) return 'High';
  if (lower.includes('should') || lower.includes('recommended')) return 'Medium';
  return 'Medium';
}

function generateAcceptanceCriteria(description: string): string {
  return `Verify that ${description.toLowerCase()}`;
}

function inferUserType(description: string): string {
  const lower = description.toLowerCase();
  if (lower.includes('employee') || lower.includes('staff')) return 'Employee';
  if (lower.includes('manager') || lower.includes('supervisor')) return 'Manager';
  if (lower.includes('hr') || lower.includes('admin')) return 'HR Administrator';
  return 'User';
}

function convertReqToUserWant(description: string): string {
  const lower = description.toLowerCase();
  if (lower.includes('store') || lower.includes('maintain')) return 'to store and manage my information';
  if (lower.includes('access') || lower.includes('view')) return 'to access system features';
  if (lower.includes('update') || lower.includes('modify')) return 'to update my information';
  if (lower.includes('approve') || lower.includes('workflow')) return 'to manage approval workflows';
  return 'to use the system effectively';
}

function inferBenefit(description: string): string {
  const lower = description.toLowerCase();
  if (lower.includes('efficiency') || lower.includes('automate')) return 'I can work more efficiently';
  if (lower.includes('compliance') || lower.includes('regulation')) return 'the organization remains compliant';
  if (lower.includes('accuracy') || lower.includes('error')) return 'data accuracy is maintained';
  return 'I can complete my tasks effectively';
}

function createIntelligentFallbackTestCases(summaryContent: StructuredSummary | string): TestCase[] {
  console.log('Creating intelligent fallback test cases...');
  
  // If we have structured content, create test cases based on functional requirements
  if (typeof summaryContent === 'object' && summaryContent.functionalRequirements) {
    const testCases: TestCase[] = [];
    
    summaryContent.functionalRequirements.forEach((req, reqIndex) => {
      // Create positive test case
      testCases.push({
        id: `TC-${String(testCases.length + 1).padStart(3, '0')}`,
        title: `Test ${req.title} - Positive Flow`,
        description: `Verify that ${req.description}`,
        category: req.title.split(' ')[0] || 'General',
        priority: req.priority,
        type: 'Functional',
        preconditions: [
          "System is accessible and running",
          "User has appropriate permissions",
          "Test data is available"
        ],
        steps: [
          {
            stepNumber: 1,
            action: `Log into the system with valid credentials`,
            expectedResult: "User successfully logs into the system"
          },
          {
            stepNumber: 2,
            action: `Navigate to ${req.title.toLowerCase()} section`,
            expectedResult: `${req.title} feature is accessible and loads properly`
          },
          {
            stepNumber: 3,
            action: `Perform the required operation for ${req.title.toLowerCase()}`,
            expectedResult: "Operation completes successfully without errors"
          },
          {
            stepNumber: 4,
            action: "Verify the results match expected behavior",
            expectedResult: req.acceptanceCriteria[0] || "Expected result is achieved and data is correctly processed"
          },
          {
            stepNumber: 5,
            action: "Log out of the system",
            expectedResult: "User successfully logs out"
          }
        ],
        expectedOutcome: req.acceptanceCriteria[0] || `${req.title} functionality works as specified in the requirement`,
        testData: [
          "Valid user credentials",
          "Test data for the specific feature",
          "Expected output values"
        ],
        status: "Not Started",
        estimatedTime: "45 minutes",
        relatedRequirement: req.id
      });

      // Create negative test case
      testCases.push({
        id: `TC-${String(testCases.length + 1).padStart(3, '0')}`,
        title: `Test ${req.title} - Negative Flow`,
        description: `Verify error handling and validation for ${req.title.toLowerCase()}`,
        category: req.title.split(' ')[0] || 'General',
        priority: req.priority === 'Critical' ? 'High' : 'Medium',
        type: 'Functional',
        preconditions: [
          "System is accessible and running",
          "User has appropriate permissions",
          "Invalid test data is prepared"
        ],
        steps: [
          {
            stepNumber: 1,
            action: `Log into the system with valid credentials`,
            expectedResult: "User successfully logs into the system"
          },
          {
            stepNumber: 2,
            action: `Navigate to ${req.title.toLowerCase()} section`,
            expectedResult: `${req.title} feature is accessible`
          },
          {
            stepNumber: 3,
            action: `Attempt operation with invalid or missing data`,
            expectedResult: "System displays appropriate error messages"
          },
          {
            stepNumber: 4,
            action: "Verify system handles errors gracefully",
            expectedResult: "System prevents invalid operations and maintains data integrity"
          }
        ],
        expectedOutcome: `System properly validates input and provides clear error messages for ${req.title.toLowerCase()}`,
        testData: [
          "Invalid input data",
          "Missing required fields",
          "Boundary test values"
        ],
        status: "Not Started",
        estimatedTime: "30 minutes",
        relatedRequirement: req.id
      });
    });

    // Add some additional integration and UI test cases
    if (summaryContent.userStories.length > 0) {
      summaryContent.userStories.slice(0, 3).forEach((story, index) => {
        testCases.push({
          id: `TC-${String(testCases.length + 1).padStart(3, '0')}`,
          title: `User Story Test: ${story.asA} - ${story.iWant}`,
          description: `End-to-end test for user story: As a ${story.asA}, I want ${story.iWant} so that ${story.soThat}`,
          category: "User Experience",
          priority: story.priority,
          type: "Integration",
          preconditions: [
            `${story.asA} has system access`,
            "System is in normal operating state",
            "Required test data exists"
          ],
          steps: [
            {
              stepNumber: 1,
              action: `Log in as ${story.asA}`,
              expectedResult: `${story.asA} successfully accesses the system`
            },
            {
              stepNumber: 2,
              action: `Navigate to complete the user story: ${story.iWant}`,
              expectedResult: "User can access the required functionality"
            },
            {
              stepNumber: 3,
              action: "Complete the entire user journey end-to-end",
              expectedResult: `User successfully ${story.iWant.replace('to ', '')}`
            },
            {
              stepNumber: 4,
              action: "Verify the benefit is achieved",
              expectedResult: story.soThat
            }
          ],
          expectedOutcome: `Complete user story is satisfied: ${story.asA} can ${story.iWant} so that ${story.soThat}`,
          testData: [
            `${story.asA} test account`,
            "Realistic test scenario data",
            "Expected outcome data"
          ],
          status: "Not Started",
          estimatedTime: "60 minutes",
          relatedRequirement: story.id
        });
      });
    }

    console.log(`Generated ${testCases.length} fallback test cases from structured content`);
    return testCases;
  }
  
  // Default fallback test cases when no structured content is available
  console.log('Using default fallback test cases');
  const testCases: TestCase[] = [
    {
      id: "TC-001",
      title: "Employee Profile Management - Create Profile",
      description: "Verify employee can create and manage their profile information",
      category: "Profile Management",
      priority: "High",
      type: "Functional",
      preconditions: [
        "User is logged into the system",
        "User has employee role permissions",
        "System is operational"
      ],
      steps: [
        {
          stepNumber: 1,
          action: "Navigate to employee profile creation page",
          expectedResult: "Profile creation form loads successfully"
        },
        {
          stepNumber: 2,
          action: "Fill in all required profile information (personal details, job info, etc.)",
          expectedResult: "Form accepts valid input for all fields"
        },
        {
          stepNumber: 3,
          action: "Submit the profile creation form",
          expectedResult: "Profile is created successfully with confirmation message"
        },
        {
          stepNumber: 4,
          action: "Verify profile information is stored correctly",
          expectedResult: "All entered information is displayed accurately in the profile"
        }
      ],
      expectedOutcome: "Employee profile is successfully created with all required information",
      testData: [
        "Valid employee personal information",
        "Job details and department info",
        "Emergency contact information"
      ],
      status: "Not Started",
      estimatedTime: "45 minutes",
      relatedRequirement: "REQ-001"
    },
    {
      id: "TC-002",
      title: "Leave Request Submission and Approval",
      description: "Verify complete leave request workflow from submission to approval",
      category: "Leave Management",
      priority: "High",
      type: "Functional",
      preconditions: [
        "Employee is logged in with valid account",
        "Employee has available leave balance",
        "Manager account exists for approval"
      ],
      steps: [
        {
          stepNumber: 1,
          action: "Navigate to leave request page",
          expectedResult: "Leave request form is displayed with current balance"
        },
        {
          stepNumber: 2,
          action: "Fill in leave request details (dates, type, reason)",
          expectedResult: "Form accepts valid leave request data"
        },
        {
          stepNumber: 3,
          action: "Submit leave request",
          expectedResult: "Request is submitted and confirmation is displayed"
        },
        {
          stepNumber: 4,
          action: "Log in as manager and review the leave request",
          expectedResult: "Manager can view pending leave request with all details"
        },
        {
          stepNumber: 5,
          action: "Approve the leave request",
          expectedResult: "Leave request is approved and employee is notified"
        }
      ],
      expectedOutcome: "Complete leave request workflow functions properly from submission to approval",
      testData: [
        "Valid leave dates within policy",
        "Appropriate leave type",
        "Manager approval credentials"
      ],
      status: "Not Started",
      estimatedTime: "60 minutes",
      relatedRequirement: "REQ-005"
    },
    {
      id: "TC-003",
      title: "Performance Review Management",
      description: "Verify performance review creation, completion, and tracking",
      category: "Performance Management",
      priority: "Medium",
      type: "Functional",
      preconditions: [
        "Manager is logged into the system",
        "Employee records exist",
        "Performance review template is configured"
      ],
      steps: [
        {
          stepNumber: 1,
          action: "Navigate to performance review management section",
          expectedResult: "Performance review dashboard loads with employee list"
        },
        {
          stepNumber: 2,
          action: "Create new performance review for an employee",
          expectedResult: "Review form opens with employee details pre-populated"
        },
        {
          stepNumber: 3,
          action: "Complete all sections of the performance review",
          expectedResult: "All review sections are completed and saved"
        },
        {
          stepNumber: 4,
          action: "Submit review and notify employee",
          expectedResult: "Review is submitted and employee receives notification"
        },
        {
          stepNumber: 5,
          action: "Verify review appears in employee's record",
          expectedResult: "Completed review is visible in employee's performance history"
        }
      ],
      expectedOutcome: "Performance review process works end-to-end with proper tracking and notifications",
      testData: [
        "Employee performance data",
        "Review criteria and ratings",
        "Goal setting information"
      ],
      status: "Not Started",
      estimatedTime: "50 minutes",
      relatedRequirement: "REQ-010"
    }
  ];
  
  return testCases;
}