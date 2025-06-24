const API_KEY = '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';
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'meta-llama/llama-4-maverick-17b-128e-instruct'; // Using a more reliable model

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
  otherComments?: string;
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
- Ignore any corrupted, garbled, or non-text content in the document
- Focus on extracting meaningful business requirements content
- IMPORTANT: Include ANY important content that doesn't fit the structured fields in the "otherComments" field

SPECIAL INSTRUCTION FOR OTHER COMMENTS:
If the document contains any significant information that cannot be categorized into the structured fields above (project overview, stakeholders, requirements, user stories, business rules, constraints, assumptions, dependencies), include it in the "otherComments" field. This includes:
- Technical specifications or implementation details
- Risk considerations and mitigation strategies
- Compliance requirements or regulatory considerations
- Performance metrics or KPIs
- Timeline information or project phases
- Budget or resource considerations
- Integration requirements with external systems
- Data migration or legacy system considerations
- Training requirements
- Support and maintenance considerations
- Any other relevant business context or notes
- Important details that provide additional context for the project

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
  "dependencies": ["Array of dependency strings"],
  "otherComments": "Include any additional important information from the document that doesn't fit into the above structured categories. If no additional information is found, leave this as an empty string."
}

VALIDATION RULES:
- All arrays must have at least 1 item
- Priority values must be exactly: "Critical", "High", "Medium", or "Low"
- All strings must be non-empty except for otherComments which can be empty
- Functional requirements must have sequential REQ-XXX IDs
- User stories must have sequential US-XXX IDs
- Ignore any garbled text, symbols, or corrupted content from document parsing
- The otherComments field should capture meaningful additional context, not duplicate information already categorized`;

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
        // Add stop sequences to prevent extra content (max 4 items for Groq)
        stop: ["```", "Note:", "Explanation:", "\n\nHuman:"]
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
  // Validate input content
  if (!documentContent || documentContent.trim().length < 50) {
    throw new Error('Document content is too short or empty for meaningful analysis');
  }

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: SUMMARY_SYSTEM_PROMPT
    },
    {
      role: 'user',
      content: `Analyze this business requirements document and extract structured information. Pay special attention to capturing ANY important information that doesn't fit the structured categories in the "otherComments" field. Respond with ONLY the JSON object in the exact format specified:

DOCUMENT CONTENT:
${documentContent}

IMPORTANT: Make sure to include in "otherComments" any valuable information from the document that doesn't fit into the structured fields (project overview, stakeholders, requirements, user stories, business rules, constraints, assumptions, dependencies). This could include technical details, risk considerations, compliance requirements, timelines, budgets, implementation notes, or any other relevant context.

Remember: Respond with ONLY the JSON object, no markdown, no explanations.`
    }
  ];

  try {
    console.log('Calling AI service for summary generation...');
    const response = await makeAPICall(messages);
    console.log('Raw AI response received, parsing...');
    
    // More aggressive cleaning for messy content
    let cleanedResponse = response.trim();
    
    // Remove any markdown formatting
    cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Remove common AI prefixes more aggressively
    const prefixPatterns = [
      /^Here\s+is\s+the\s+JSON\s*:?\s*/i,
      /^Here's\s+the\s+JSON\s*:?\s*/i,
      /^The\s+JSON\s+structure\s+is\s*:?\s*/i,
      /^Based\s+on\s+the\s+analysis\s*:?\s*/i,
      /^Analysis\s+result\s*:?\s*/i,
      /^The\s+extracted\s+information\s*:?\s*/i
    ];
    
    for (const pattern of prefixPatterns) {
      cleanedResponse = cleanedResponse.replace(pattern, '');
    }
    
    // Find the JSON object more robustly
    const jsonStart = cleanedResponse.indexOf('{');
    if (jsonStart === -1) {
      throw new Error('AI response does not contain a valid JSON object - no opening brace found');
    }
    
    // Find the matching closing brace by counting braces
    let braceCount = 0;
    let jsonEnd = -1;
    
    for (let i = jsonStart; i < cleanedResponse.length; i++) {
      if (cleanedResponse[i] === '{') {
        braceCount++;
      } else if (cleanedResponse[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          jsonEnd = i + 1;
          break;
        }
      }
    }
    
    if (jsonEnd === -1) {
      throw new Error('AI response contains malformed JSON - no matching closing brace found');
    }
    
    const jsonOnly = cleanedResponse.substring(jsonStart, jsonEnd);
    console.log('Extracted JSON length:', jsonOnly.length);
    
    try {
      const parsedSummary = JSON.parse(jsonOnly) as StructuredSummary;
      console.log('Successfully parsed AI response');
      
      // Validate the structure
      if (!parsedSummary.projectOverview || !parsedSummary.functionalRequirements || !Array.isArray(parsedSummary.functionalRequirements)) {
        throw new Error('AI response has invalid structure - missing required fields');
      }
      
      // Ensure minimum content requirements
      if (parsedSummary.functionalRequirements.length === 0) {
        throw new Error('AI analysis did not extract any functional requirements from the document');
      }
      
      if (!parsedSummary.projectOverview.title || parsedSummary.projectOverview.title.trim().length === 0) {
        throw new Error('AI analysis could not determine a project title from the document');
      }
      
      // Ensure otherComments field exists
      if (!parsedSummary.otherComments) {
        parsedSummary.otherComments = '';
      }
      
      return parsedSummary;
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.log('Problematic JSON (first 500 chars):', jsonOnly.substring(0, 500));
      throw new Error(`AI response parsing failed: ${parseError instanceof Error ? parseError.message : 'Invalid JSON format'}`);
    }
  } catch (error) {
    console.error('Error generating summary:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate document summary - please check your document content and try again');
  }
}

export async function generateTestCases(summaryContent: StructuredSummary | string, regenerationOption?: string): Promise<TestCase[]> {
  console.log('generateTestCases called with:', typeof summaryContent, 'regeneration option:', regenerationOption);
  
  const contentToAnalyze = typeof summaryContent === 'string' 
    ? summaryContent 
    : JSON.stringify(summaryContent, null, 2);

  console.log('Content to analyze (first 500 chars):', contentToAnalyze.slice(0, 500));

  // Validate input
  if (!contentToAnalyze || contentToAnalyze.trim().length < 50) {
    throw new Error('Summary content is too short or empty for test case generation');
  }

  // Create specialized prompt based on regeneration option
  let specializedPrompt = '';
  if (regenerationOption) {
    switch (regenerationOption) {
      case 'more-rigorous':
        specializedPrompt = `
SPECIAL INSTRUCTIONS: Generate MORE RIGOROUS test cases with:
- Extensive edge cases and boundary testing
- Negative test scenarios and error handling
- Complex data validation scenarios
- Multiple user role testing
- Integration failure scenarios
- Performance edge cases
- Security vulnerability testing
- Data corruption and recovery scenarios
Generate 15-20 comprehensive test cases with detailed steps.`;
        break;
      case 'less-rigorous':
        specializedPrompt = `
SPECIAL INSTRUCTIONS: Generate BASIC test cases focusing on:
- Core functionality and happy path scenarios
- Essential user workflows
- Basic validation testing
- Primary use cases only
- Simplified test steps
Generate 5-8 essential test cases with clear, simple steps.`;
        break;
      case 'auth-flow':
        specializedPrompt = `
SPECIAL INSTRUCTIONS: Focus SPECIFICALLY on AUTHENTICATION & AUTHORIZATION:
- Login/logout functionality
- User registration and password management
- Role-based access control
- Session management
- Password reset and recovery
- Multi-factor authentication if applicable
- Permission validation
- Account lockout scenarios
Generate test cases ONLY for authentication and authorization features.`;
        break;
      case 'ui-ux':
        specializedPrompt = `
SPECIAL INSTRUCTIONS: Focus on UI/UX TESTING:
- User interface responsiveness
- Form validation and user feedback
- Navigation and user workflows
- Accessibility testing
- Cross-browser compatibility
- Mobile responsiveness
- User experience flows
- Visual design validation
Generate test cases focused on frontend and user experience.`;
        break;
      case 'api-integration':
        specializedPrompt = `
SPECIAL INSTRUCTIONS: Focus on API & INTEGRATION TESTING:
- API endpoint testing
- Data integration scenarios
- Third-party service integration
- Database connectivity
- Data synchronization
- API error handling
- Request/response validation
- System-to-system communication
Generate test cases for APIs and system integrations.`;
        break;
      case 'performance':
        specializedPrompt = `
SPECIAL INSTRUCTIONS: Focus on PERFORMANCE TESTING:
- Load testing scenarios
- Stress testing under high volume
- Response time validation
- Concurrent user testing
- Resource utilization
- Database performance
- Memory and CPU usage
- Scalability testing
Generate test cases focused on system performance and scalability.`;
        break;
      case 'security':
        specializedPrompt = `
SPECIAL INSTRUCTIONS: Focus on SECURITY TESTING:
- Input validation and SQL injection
- Cross-site scripting (XSS) prevention
- Authentication bypass attempts
- Authorization vulnerabilities
- Data encryption validation
- Sensitive data exposure
- Session security
- Access control testing
Generate test cases focused on security vulnerabilities and protection.`;
        break;
      case 'mobile':
        specializedPrompt = `
SPECIAL INSTRUCTIONS: Focus on MOBILE TESTING:
- Mobile device compatibility
- Touch interface testing
- Screen orientation changes
- Mobile-specific features
- App performance on mobile
- Network connectivity scenarios
- Battery usage impact
- Mobile user experience
Generate test cases specifically for mobile applications and responsive design.`;
        break;
    }
  }

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: TEST_CASE_SYSTEM_PROMPT + specializedPrompt
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
    console.log('Raw API response for test cases received, parsing...');
    
    // More aggressive cleaning for messy content
    let cleanedResponse = response.trim();
    
    // Remove any markdown formatting
    cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Remove common AI prefixes more aggressively
    const prefixPatterns = [
      /^Here\s+is\s+the\s+JSON\s*:?\s*/i,
      /^Here's\s+the\s+JSON\s*:?\s*/i,
      /^Here\s+are\s+the\s+test\s+cases\s*:?\s*/i,
      /^Based\s+on\s+the\s+requirements\s*:?\s*/i,
      /^Test\s+cases\s*:?\s*/i
    ];
    
    for (const pattern of prefixPatterns) {
      cleanedResponse = cleanedResponse.replace(pattern, '');
    }
    
    // Find the JSON array more robustly
    const arrayStart = cleanedResponse.indexOf('[');
    if (arrayStart === -1) {
      throw new Error('AI response does not contain a valid JSON array - no opening bracket found');
    }
    
    // Find the matching closing bracket by counting brackets
    let bracketCount = 0;
    let arrayEnd = -1;
    
    for (let i = arrayStart; i < cleanedResponse.length; i++) {
      if (cleanedResponse[i] === '[') {
        bracketCount++;
      } else if (cleanedResponse[i] === ']') {
        bracketCount--;
        if (bracketCount === 0) {
          arrayEnd = i + 1;
          break;
        }
      }
    }
    
    if (arrayEnd === -1) {
      throw new Error('AI response contains malformed JSON array - no matching closing bracket found');
    }
    
    const jsonOnly = cleanedResponse.substring(arrayStart, arrayEnd);
    console.log('Extracted JSON array length:', jsonOnly.length);
    
    try {
      const parsedTestCases = JSON.parse(jsonOnly) as TestCase[];
      console.log('Successfully parsed test cases from AI:', parsedTestCases.length, 'test cases');
      
      // Validate the response
      if (!Array.isArray(parsedTestCases) || parsedTestCases.length === 0) {
        throw new Error('AI did not generate any test cases from the requirements');
      }
      
      // Validate and clean each test case
      const validatedTestCases = parsedTestCases.map((testCase, index) => {
        if (!testCase.title || !testCase.description) {
          throw new Error(`Test case ${index + 1} is missing required fields (title or description)`);
        }
        
        return {
          id: testCase.id || `TC-${String(index + 1).padStart(3, '0')}`,
          title: testCase.title,
          description: testCase.description,
          category: testCase.category || 'General',
          priority: ['Critical', 'High', 'Medium', 'Low'].includes(testCase.priority) ? testCase.priority : 'Medium',
          type: ['Functional', 'Non-Functional', 'Integration', 'UI/UX', 'Security', 'Performance'].includes(testCase.type) ? testCase.type : 'Functional',
          preconditions: Array.isArray(testCase.preconditions) && testCase.preconditions.length > 0 ? testCase.preconditions : ['System is accessible and user has appropriate permissions'],
          steps: Array.isArray(testCase.steps) && testCase.steps.length > 0 ? testCase.steps.map((step, stepIndex) => ({
            stepNumber: step.stepNumber || stepIndex + 1,
            action: step.action || 'Perform required action',
            expectedResult: step.expectedResult || 'Expected result should be achieved'
          })) : [
            {
              stepNumber: 1,
              action: 'Execute the test scenario',
              expectedResult: 'System behaves as expected'
            }
          ],
          expectedOutcome: testCase.expectedOutcome || 'Test passes successfully',
          testData: Array.isArray(testCase.testData) && testCase.testData.length > 0 ? testCase.testData : ['Test data as required'],
          status: 'Not Started' as const,
          estimatedTime: testCase.estimatedTime || '30 minutes',
          relatedRequirement: testCase.relatedRequirement || ''
        };
      });
      
      console.log('Validated test cases:', validatedTestCases.length, 'test cases ready');
      return validatedTestCases;
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.log('Problematic JSON (first 500 chars):', jsonOnly.substring(0, 500));
      throw new Error(`Test case parsing failed: ${parseError instanceof Error ? parseError.message : 'Invalid JSON format'}`);
    }
  } catch (error) {
    console.error('Error generating test cases:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate test cases - please check your requirements and try again');
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
    dependencies: summary.dependencies?.length > 0 ? summary.dependencies : extractDependencies(originalContent),
    otherComments: summary.otherComments || extractOtherComments(originalContent)
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
    dependencies: extractDependencies(documentContent),
    otherComments: extractOtherComments(documentContent)
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

function extractOtherComments(content: string): string {
  const otherComments: string[] = [];
  
  // Define patterns for content that doesn't fit structured fields
  const patterns = [
    // Technical specifications and implementation details
    {
      name: 'Technical Specifications',
      regex: /technical\s*(specifications?|details?|requirements?)[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i
    },
    {
      name: 'Implementation Notes',
      regex: /implementation[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i
    },
    {
      name: 'Architecture Details',
      regex: /architecture[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i
    },
    
    // Risk and compliance
    {
      name: 'Risk Considerations',
      regex: /risks?[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i
    },
    {
      name: 'Compliance Requirements',
      regex: /(compliance|regulatory)[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i
    },
    {
      name: 'Security Considerations',
      regex: /security\s*(considerations?|notes?)[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i
    },
    
    // Project management aspects
    {
      name: 'Timeline Information',
      regex: /(timeline|schedule|phases?)[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i
    },
    {
      name: 'Budget Information',
      regex: /(budget|cost|resources?)[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i
    },
    {
      name: 'Milestones',
      regex: /milestones?[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i
    },
    
    // Integration and migration
    {
      name: 'Integration Requirements',
      regex: /integration\s*(requirements?|details?)[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i
    },
    {
      name: 'Data Migration',
      regex: /migration[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i
    },
    {
      name: 'Legacy System Notes',
      regex: /legacy[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i
    },
    
    // Support and maintenance
    {
      name: 'Training Requirements',
      regex: /training[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i
    },
    {
      name: 'Support Requirements',
      regex: /support[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i
    },
    {
      name: 'Maintenance Considerations',
      regex: /maintenance[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i
    },
    
    // Performance and monitoring
    {
      name: 'Performance Metrics',
      regex: /(kpi|metrics?|performance\s*indicators?)[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i
    },
    {
      name: 'Monitoring Requirements',
      regex: /monitoring[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i
    },
    
    // Notes and additional context
    {
      name: 'Additional Notes',
      regex: /(notes?|additional\s*information)[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i
    },
    {
      name: 'Special Considerations',
      regex: /special\s*considerations?[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i
    },
    {
      name: 'Out of Scope',
      regex: /(out\s*of\s*scope|not\s*included)[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i
    },
    {
      name: 'Future Enhancements',
      regex: /(future|enhancements?|roadmap)[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/i
    }
  ];
  
  // Extract content for each pattern
  patterns.forEach(pattern => {
    const match = content.match(pattern.regex);
    if (match) {
      const extractedContent = match[match.length - 1]; // Get the last capture group
      if (extractedContent && extractedContent.trim().length > 20) {
        const cleanContent = extractedContent
          .trim()
          .replace(/[*#-]/g, '') // Remove markdown formatting
          .replace(/\s+/g, ' ') // Normalize whitespace
          .substring(0, 500); // Limit length
        
        if (cleanContent.length > 20) {
          otherComments.push(`**${pattern.name}:** ${cleanContent}`);
        }
      }
    }
  });
  
  // Look for numbered sections that might not fit standard categories
  const numberedSections = content.match(/^\d+\.\s*[^:\n\r]+[:\s]*([^\n\r#]+(?:\n[^#\n\r]+)*)/gm);
  if (numberedSections) {
    numberedSections.forEach(section => {
      const sectionTitle = section.match(/^\d+\.\s*([^:\n\r]+)/);
      if (sectionTitle) {
        const title = sectionTitle[1].trim();
        // Only include if it doesn't match known structured categories
        const isStructuredCategory = [
          'requirements', 'stakeholder', 'user stories', 'business rules', 
          'constraint', 'assumption', 'dependencies', 'overview', 'objective'
        ].some(category => title.toLowerCase().includes(category));
        
        if (!isStructuredCategory && section.length > 50) {
          const cleanSection = section
            .replace(/^\d+\.\s*/, '')
            .trim()
            .replace(/\s+/g, ' ')
            .substring(0, 300);
          
          if (cleanSection.length > 30) {
            otherComments.push(`**${title}:** ${cleanSection}`);
          }
        }
      }
    });
  }
  
  // Look for any remaining bullet points in unstructured sections
  const remainingBullets = content.match(/[-*•]\s*([^\n\r]{20,})/g);
  if (remainingBullets && otherComments.length < 3) {
    remainingBullets.slice(0, 3).forEach(bullet => {
      const cleanBullet = bullet
        .replace(/[-*•]\s*/, '')
        .trim()
        .substring(0, 200);
      
      if (cleanBullet.length > 20) {
        otherComments.push(`• ${cleanBullet}`);
      }
    });
  }
  
  // Return combined comments or empty string
  if (otherComments.length > 0) {
    return otherComments.join('\n\n');
  }
  
  return '';
}