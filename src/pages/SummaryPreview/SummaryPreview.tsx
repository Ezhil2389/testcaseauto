import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Check, ArrowRight, ArrowLeft, Users, Target, Shield, Settings, User, CheckCircle, AlertTriangle, Clock, List, X, Plus } from 'lucide-react';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import { useDocumentStore } from '../../store/documentStore';
import { StructuredSummary } from '../../services/groqService';

const SummaryPreview: React.FC = () => {
  const { currentSummary, updateStructuredSummary } = useDocumentStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState<StructuredSummary | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect if no summary is available
    if (!currentSummary) {
      navigate('/');
      return;
    }
    
    // Initialize edited summary with current structured content
    if (currentSummary.structuredContent) {
      setEditedSummary(currentSummary.editedStructuredContent || currentSummary.structuredContent);
    }
  }, [currentSummary, navigate]);
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleSave = () => {
    if (editedSummary) {
      updateStructuredSummary(editedSummary);
    }
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditedSummary(currentSummary?.editedStructuredContent || currentSummary?.structuredContent || null);
    setIsEditing(false);
  };
  
  const handleNext = () => {
    navigate('/generate-tests');
  };
  
  const handleBack = () => {
    navigate('/');
  };
  
  // Editing helper functions
  const updateProjectOverview = (field: keyof StructuredSummary['projectOverview'], value: any) => {
    if (!editedSummary) return;
    setEditedSummary({
      ...editedSummary,
      projectOverview: {
        ...editedSummary.projectOverview,
        [field]: value
      }
    });
  };

  const addObjective = () => {
    if (!editedSummary) return;
    setEditedSummary({
      ...editedSummary,
      projectOverview: {
        ...editedSummary.projectOverview,
        objectives: [...editedSummary.projectOverview.objectives, 'New objective']
      }
    });
  };

  const removeObjective = (index: number) => {
    if (!editedSummary) return;
    setEditedSummary({
      ...editedSummary,
      projectOverview: {
        ...editedSummary.projectOverview,
        objectives: editedSummary.projectOverview.objectives.filter((_, i) => i !== index)
      }
    });
  };

  const updateObjective = (index: number, value: string) => {
    if (!editedSummary) return;
    const newObjectives = [...editedSummary.projectOverview.objectives];
    newObjectives[index] = value;
    setEditedSummary({
      ...editedSummary,
      projectOverview: {
        ...editedSummary.projectOverview,
        objectives: newObjectives
      }
    });
  };

  const addStakeholder = () => {
    if (!editedSummary) return;
    setEditedSummary({
      ...editedSummary,
      stakeholders: [...editedSummary.stakeholders, {
        name: 'New Stakeholder',
        role: 'Role',
        responsibilities: ['Responsibility']
      }]
    });
  };

  const removeStakeholder = (index: number) => {
    if (!editedSummary) return;
    setEditedSummary({
      ...editedSummary,
      stakeholders: editedSummary.stakeholders.filter((_, i) => i !== index)
    });
  };

  const updateStakeholder = (index: number, field: string, value: any) => {
    if (!editedSummary) return;
    const newStakeholders = [...editedSummary.stakeholders];
    newStakeholders[index] = { ...newStakeholders[index], [field]: value };
    setEditedSummary({
      ...editedSummary,
      stakeholders: newStakeholders
    });
  };

  const addRequirement = () => {
    if (!editedSummary) return;
    const newId = `REQ-${String(editedSummary.functionalRequirements.length + 1).padStart(3, '0')}`;
    setEditedSummary({
      ...editedSummary,
      functionalRequirements: [...editedSummary.functionalRequirements, {
        id: newId,
        title: 'New Requirement',
        description: 'Requirement description',
        priority: 'Medium' as const,
        acceptanceCriteria: ['Acceptance criteria']
      }]
    });
  };

  const removeRequirement = (index: number) => {
    if (!editedSummary) return;
    setEditedSummary({
      ...editedSummary,
      functionalRequirements: editedSummary.functionalRequirements.filter((_, i) => i !== index)
    });
  };

  const updateRequirement = (index: number, field: string, value: any) => {
    if (!editedSummary) return;
    const newRequirements = [...editedSummary.functionalRequirements];
    newRequirements[index] = { ...newRequirements[index], [field]: value };
    setEditedSummary({
      ...editedSummary,
      functionalRequirements: newRequirements
    });
  };

  // Non-Functional Requirements editing
  const addNonFunctionalRequirement = () => {
    if (!editedSummary) return;
    setEditedSummary({
      ...editedSummary,
      nonFunctionalRequirements: [...editedSummary.nonFunctionalRequirements, {
        category: 'New Category',
        requirements: ['New requirement']
      }]
    });
  };

  const removeNonFunctionalRequirement = (index: number) => {
    if (!editedSummary) return;
    setEditedSummary({
      ...editedSummary,
      nonFunctionalRequirements: editedSummary.nonFunctionalRequirements.filter((_, i) => i !== index)
    });
  };

  const updateNonFunctionalRequirement = (index: number, field: string, value: any) => {
    if (!editedSummary) return;
    const newNFRs = [...editedSummary.nonFunctionalRequirements];
    newNFRs[index] = { ...newNFRs[index], [field]: value };
    setEditedSummary({
      ...editedSummary,
      nonFunctionalRequirements: newNFRs
    });
  };

  const addNFRRequirement = (categoryIndex: number) => {
    if (!editedSummary) return;
    const newNFRs = [...editedSummary.nonFunctionalRequirements];
    newNFRs[categoryIndex].requirements.push('New requirement');
    setEditedSummary({
      ...editedSummary,
      nonFunctionalRequirements: newNFRs
    });
  };

  const removeNFRRequirement = (categoryIndex: number, reqIndex: number) => {
    if (!editedSummary) return;
    const newNFRs = [...editedSummary.nonFunctionalRequirements];
    newNFRs[categoryIndex].requirements = newNFRs[categoryIndex].requirements.filter((_, i) => i !== reqIndex);
    setEditedSummary({
      ...editedSummary,
      nonFunctionalRequirements: newNFRs
    });
  };

  const updateNFRRequirement = (categoryIndex: number, reqIndex: number, value: string) => {
    if (!editedSummary) return;
    const newNFRs = [...editedSummary.nonFunctionalRequirements];
    newNFRs[categoryIndex].requirements[reqIndex] = value;
    setEditedSummary({
      ...editedSummary,
      nonFunctionalRequirements: newNFRs
    });
  };

  // User Stories editing
  const addUserStory = () => {
    if (!editedSummary) return;
    const newId = `US-${String(editedSummary.userStories.length + 1).padStart(3, '0')}`;
    setEditedSummary({
      ...editedSummary,
      userStories: [...editedSummary.userStories, {
        id: newId,
        asA: 'User',
        iWant: 'to perform action',
        soThat: 'I can achieve goal',
        acceptanceCriteria: ['Acceptance criteria'],
        priority: 'Medium' as const
      }]
    });
  };

  const removeUserStory = (index: number) => {
    if (!editedSummary) return;
    setEditedSummary({
      ...editedSummary,
      userStories: editedSummary.userStories.filter((_, i) => i !== index)
    });
  };

  const updateUserStory = (index: number, field: string, value: any) => {
    if (!editedSummary) return;
    const newStories = [...editedSummary.userStories];
    newStories[index] = { ...newStories[index], [field]: value };
    setEditedSummary({
      ...editedSummary,
      userStories: newStories
    });
  };

  const addUserStoryCriteria = (storyIndex: number) => {
    if (!editedSummary) return;
    const newStories = [...editedSummary.userStories];
    newStories[storyIndex].acceptanceCriteria.push('New criteria');
    setEditedSummary({
      ...editedSummary,
      userStories: newStories
    });
  };

  const removeUserStoryCriteria = (storyIndex: number, criteriaIndex: number) => {
    if (!editedSummary) return;
    const newStories = [...editedSummary.userStories];
    newStories[storyIndex].acceptanceCriteria = newStories[storyIndex].acceptanceCriteria.filter((_, i) => i !== criteriaIndex);
    setEditedSummary({
      ...editedSummary,
      userStories: newStories
    });
  };

  const updateUserStoryCriteria = (storyIndex: number, criteriaIndex: number, value: string) => {
    if (!editedSummary) return;
    const newStories = [...editedSummary.userStories];
    newStories[storyIndex].acceptanceCriteria[criteriaIndex] = value;
    setEditedSummary({
      ...editedSummary,
      userStories: newStories
    });
  };

  // Simple array editing functions
  const addToArray = (field: keyof StructuredSummary, value: string) => {
    if (!editedSummary) return;
    setEditedSummary({
      ...editedSummary,
      [field]: [...(editedSummary[field] as string[]), value]
    });
  };

  const removeFromArray = (field: keyof StructuredSummary, index: number) => {
    if (!editedSummary) return;
    setEditedSummary({
      ...editedSummary,
      [field]: (editedSummary[field] as string[]).filter((_, i) => i !== index)
    });
  };

  const updateArrayItem = (field: keyof StructuredSummary, index: number, value: string) => {
    if (!editedSummary) return;
    const newArray = [...(editedSummary[field] as string[])];
    newArray[index] = value;
    setEditedSummary({
      ...editedSummary,
      [field]: newArray
    });
  };
  
  if (!currentSummary || !currentSummary.structuredContent) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <p className="text-lg text-red-600">No structured summary available. Please upload documents again.</p>
        <Button onClick={handleBack} className="mt-4">
          <ArrowLeft size={16} />
          Back to Upload
        </Button>
      </div>
    );
  }
  
  const summary = editedSummary || currentSummary.editedStructuredContent || currentSummary.structuredContent;
  
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const EditableInput = ({ value, onChange, className = "", placeholder = "" }: { 
    value: string; 
    onChange: (value: string) => void; 
    className?: string;
    placeholder?: string;
  }) => (
    isEditing ? (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        placeholder={placeholder}
      />
    ) : (
      <span className={className}>{value}</span>
    )
  );

  const EditableTextarea = ({ value, onChange, className = "", placeholder = "" }: { 
    value: string; 
    onChange: (value: string) => void; 
    className?: string;
    placeholder?: string;
  }) => (
    isEditing ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${className}`}
        placeholder={placeholder}
        rows={3}
      />
    ) : (
      <span className={className}>{value}</span>
    )
  );

  const EditableSelect = ({ value, onChange, options, className = "" }: {
    value: string;
    onChange: (value: any) => void;
    options: { value: string; label: string }[];
    className?: string;
  }) => (
    isEditing ? (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-white border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    ) : (
      <span className={`text-xs font-medium px-2 py-1 rounded border ${getPriorityColor(value)}`}>
        {value}
      </span>
    )
  );
  
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Requirements Analysis</h1>
        <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
          Review the comprehensive analysis of your business requirements document
        </p>
        <div className="flex justify-center">
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <p className="text-sm text-green-800">
              Generated on {currentSummary.generatedDate.toLocaleDateString()} at {currentSummary.generatedDate.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
      
      {/* Project Overview */}
      <Card className="card-spacious">
        <div className="section-header">
          <div className="section-icon bg-blue-50 text-blue-600">
            <Target size={24} />
          </div>
          <div>
            <h2>Project Overview</h2>
            <p className="mt-2">High-level project information and objectives</p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">
              <EditableInput
                value={summary.projectOverview.title}
                onChange={(value) => updateProjectOverview('title', value)}
                className="font-semibold text-lg"
                placeholder="Project title"
              />
            </h3>
            <EditableTextarea
              value={summary.projectOverview.description}
              onChange={(value) => updateProjectOverview('description', value)}
              className="text-[var(--text-secondary)]"
              placeholder="Project description"
            />
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Project Scope</h4>
            <EditableTextarea
              value={summary.projectOverview.scope}
              onChange={(value) => updateProjectOverview('scope', value)}
              className="text-[var(--text-secondary)]"
              placeholder="Project scope"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Business Objectives</h4>
              {isEditing && (
                <Button
                  onClick={addObjective}
                  variant="outline"
                  size="sm"
                >
                  <Plus size={16} />
                  Add Objective
                </Button>
              )}
            </div>
            <div className="grid gap-2">
              {summary.projectOverview.objectives.map((objective, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <EditableInput
                      value={objective}
                      onChange={(value) => updateObjective(index, value)}
                      className="text-blue-900 w-full"
                      placeholder="Objective description"
                    />
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => removeObjective(index)}
                      className="text-red-500 hover:text-red-700 flex-shrink-0"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Stakeholders */}
      <Card className="card-spacious">
        <div className="section-header">
          <div className="section-icon bg-purple-50 text-purple-600">
            <Users size={24} />
          </div>
          <div>
            <h2>Stakeholders</h2>
            <p className="mt-2">Key personnel and their responsibilities</p>
          </div>
          {isEditing && (
            <Button
              onClick={addStakeholder}
              variant="outline"
              size="sm"
            >
              <Plus size={16} />
              Add Stakeholder
            </Button>
          )}
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary.stakeholders.map((stakeholder, index) => (
            <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-4 relative">
              {isEditing && (
                <button
                  onClick={() => removeStakeholder(index)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              )}
              <div className="flex items-center gap-2 mb-3">
                <User size={18} className="text-purple-600" />
                <EditableInput
                  value={stakeholder.name}
                  onChange={(value) => updateStakeholder(index, 'name', value)}
                  className="font-medium text-purple-900"
                  placeholder="Stakeholder name"
                />
              </div>
              <EditableInput
                value={stakeholder.role}
                onChange={(value) => updateStakeholder(index, 'role', value)}
                className="text-sm text-purple-700 mb-3 block"
                placeholder="Role"
              />
              <div className="space-y-1">
                {stakeholder.responsibilities.map((resp, respIndex) => (
                  <div key={respIndex} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5 flex-shrink-0" />
                    <EditableInput
                      value={resp}
                      onChange={(value) => {
                        const newResponsibilities = [...stakeholder.responsibilities];
                        newResponsibilities[respIndex] = value;
                        updateStakeholder(index, 'responsibilities', newResponsibilities);
                      }}
                      className="text-xs text-purple-800 flex-1"
                      placeholder="Responsibility"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Functional Requirements */}
      <Card className="card-spacious">
        <div className="section-header">
          <div className="section-icon bg-green-50 text-green-600">
            <List size={24} />
          </div>
          <div>
            <h2>Functional Requirements</h2>
            <p className="mt-2">Core system functionality and features</p>
          </div>
          {isEditing && (
            <Button
              onClick={addRequirement}
              variant="outline"
              size="sm"
            >
              <Plus size={16} />
              Add Requirement
            </Button>
          )}
        </div>
        
        <div className="space-y-4">
          {summary.functionalRequirements.map((req, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
              {isEditing && (
                <button
                  onClick={() => removeRequirement(index)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              )}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                      {req.id}
                    </span>
                    <EditableSelect
                      value={req.priority}
                      onChange={(value) => updateRequirement(index, 'priority', value)}
                      options={[
                        { value: 'Critical', label: 'Critical' },
                        { value: 'High', label: 'High' },
                        { value: 'Medium', label: 'Medium' },
                        { value: 'Low', label: 'Low' }
                      ]}
                    />
                  </div>
                  <h4 className="font-medium mb-2">
                    <EditableInput
                      value={req.title}
                      onChange={(value) => updateRequirement(index, 'title', value)}
                      className="font-medium w-full"
                      placeholder="Requirement title"
                    />
                  </h4>
                  <EditableTextarea
                    value={req.description}
                    onChange={(value) => updateRequirement(index, 'description', value)}
                    className="text-sm text-[var(--text-secondary)] mb-3 w-full"
                    placeholder="Requirement description"
                  />
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-medium mb-2">Acceptance Criteria</h5>
                <div className="space-y-1">
                  {req.acceptanceCriteria.map((criteria, criteriaIndex) => (
                    <div key={criteriaIndex} className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <EditableInput
                        value={criteria}
                        onChange={(value) => {
                          const newCriteria = [...req.acceptanceCriteria];
                          newCriteria[criteriaIndex] = value;
                          updateRequirement(index, 'acceptanceCriteria', newCriteria);
                        }}
                        className="text-sm text-[var(--text-secondary)] flex-1"
                        placeholder="Acceptance criteria"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Non-Functional Requirements */}
      <Card className="card-spacious">
        <div className="section-header">
          <div className="section-icon bg-amber-50 text-amber-600">
            <Shield size={24} />
          </div>
          <div>
            <h2>Non-Functional Requirements</h2>
            <p className="mt-2">Performance, security, and quality requirements</p>
          </div>
          {isEditing && (
            <Button
              onClick={addNonFunctionalRequirement}
              variant="outline"
              size="sm"
            >
              <Plus size={16} />
              Add Category
            </Button>
          )}
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {summary.nonFunctionalRequirements.map((nfr, index) => (
            <div key={index} className="bg-amber-50 border border-amber-200 rounded-lg p-4 relative">
              {isEditing && (
                <button
                  onClick={() => removeNonFunctionalRequirement(index)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              )}
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-amber-900 flex items-center gap-2">
                  <Settings size={16} />
                  <EditableInput
                    value={nfr.category}
                    onChange={(value) => updateNonFunctionalRequirement(index, 'category', value)}
                    className="font-medium text-amber-900"
                    placeholder="Category name"
                  />
                </h4>
                {isEditing && (
                  <Button
                    onClick={() => addNFRRequirement(index)}
                    variant="outline"
                    size="sm"
                  >
                    <Plus size={12} />
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {nfr.requirements.map((req, reqIndex) => (
                  <div key={reqIndex} className="flex items-start gap-2">
                    <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <EditableInput
                      value={req}
                      onChange={(value) => updateNFRRequirement(index, reqIndex, value)}
                      className="text-sm text-amber-800 flex-1"
                      placeholder="Requirement description"
                    />
                    {isEditing && (
                      <button
                        onClick={() => removeNFRRequirement(index, reqIndex)}
                        className="text-red-500 hover:text-red-700 flex-shrink-0"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* User Stories */}
      <Card className="card-spacious">
        <div className="section-header">
          <div className="section-icon bg-indigo-50 text-indigo-600">
            <User size={24} />
          </div>
          <div>
            <h2>User Stories</h2>
            <p className="mt-2">User-centered requirements and scenarios</p>
          </div>
          {isEditing && (
            <Button
              onClick={addUserStory}
              variant="outline"
              size="sm"
            >
              <Plus size={16} />
              Add User Story
            </Button>
          )}
        </div>
        
        <div className="space-y-4">
          {summary.userStories.map((story, index) => (
            <div key={index} className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 relative">
              {isEditing && (
                <button
                  onClick={() => removeUserStory(index)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              )}
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded">
                  {story.id}
                </span>
                <EditableSelect
                  value={story.priority}
                  onChange={(value) => updateUserStory(index, 'priority', value)}
                  options={[
                    { value: 'Critical', label: 'Critical' },
                    { value: 'High', label: 'High' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'Low', label: 'Low' }
                  ]}
                />
              </div>
              
              <div className="mb-3">
                <p className="text-indigo-900">
                  <strong>As a</strong>{' '}
                  <EditableInput
                    value={story.asA}
                    onChange={(value) => updateUserStory(index, 'asA', value)}
                    className="text-indigo-900 inline"
                    placeholder="user type"
                  />
                  , <strong>I want</strong>{' '}
                  <EditableInput
                    value={story.iWant}
                    onChange={(value) => updateUserStory(index, 'iWant', value)}
                    className="text-indigo-900 inline"
                    placeholder="what they want"
                  />
                  {' '}<strong>so that</strong>{' '}
                  <EditableInput
                    value={story.soThat}
                    onChange={(value) => updateUserStory(index, 'soThat', value)}
                    className="text-indigo-900 inline"
                    placeholder="why they want it"
                  />
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-medium text-indigo-900">Acceptance Criteria</h5>
                  {isEditing && (
                    <Button
                      onClick={() => addUserStoryCriteria(index)}
                      variant="outline"
                      size="sm"
                    >
                      <Plus size={12} />
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  {story.acceptanceCriteria.map((criteria, criteriaIndex) => (
                    <div key={criteriaIndex} className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                      <EditableInput
                        value={criteria}
                        onChange={(value) => updateUserStoryCriteria(index, criteriaIndex, value)}
                        className="text-sm text-indigo-800 flex-1"
                        placeholder="Acceptance criteria"
                      />
                      {isEditing && (
                        <button
                          onClick={() => removeUserStoryCriteria(index, criteriaIndex)}
                          className="text-red-500 hover:text-red-700 flex-shrink-0"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Business Rules & Additional Info */}
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Settings size={20} className="text-blue-600" />
              Business Rules
            </h3>
            {isEditing && (
              <Button
                onClick={() => addToArray('businessRules', 'New business rule')}
                variant="outline"
                size="sm"
              >
                <Plus size={16} />
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {summary.businessRules.map((rule, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded relative">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                <EditableInput
                  value={rule}
                  onChange={(value) => updateArrayItem('businessRules', index, value)}
                  className="text-sm text-blue-900 flex-1"
                  placeholder="Business rule"
                />
                {isEditing && (
                  <button
                    onClick={() => removeFromArray('businessRules', index)}
                    className="text-red-500 hover:text-red-700 flex-shrink-0"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-600" />
              Constraints
            </h3>
            {isEditing && (
              <Button
                onClick={() => addToArray('constraints', 'New constraint')}
                variant="outline"
                size="sm"
              >
                <Plus size={16} />
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {summary.constraints.map((constraint, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-amber-50 rounded relative">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                <EditableInput
                  value={constraint}
                  onChange={(value) => updateArrayItem('constraints', index, value)}
                  className="text-sm text-amber-900 flex-1"
                  placeholder="Constraint"
                />
                {isEditing && (
                  <button
                    onClick={() => removeFromArray('constraints', index)}
                    className="text-red-500 hover:text-red-700 flex-shrink-0"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle size={20} className="text-green-600" />
              Assumptions
            </h3>
            {isEditing && (
              <Button
                onClick={() => addToArray('assumptions', 'New assumption')}
                variant="outline"
                size="sm"
              >
                <Plus size={16} />
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {summary.assumptions.map((assumption, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-green-50 rounded relative">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                <EditableInput
                  value={assumption}
                  onChange={(value) => updateArrayItem('assumptions', index, value)}
                  className="text-sm text-green-900 flex-1"
                  placeholder="Assumption"
                />
                {isEditing && (
                  <button
                    onClick={() => removeFromArray('assumptions', index)}
                    className="text-red-500 hover:text-red-700 flex-shrink-0"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock size={20} className="text-purple-600" />
              Dependencies
            </h3>
            {isEditing && (
              <Button
                onClick={() => addToArray('dependencies', 'New dependency')}
                variant="outline"
                size="sm"
              >
                <Plus size={16} />
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {summary.dependencies.map((dependency, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-purple-50 rounded relative">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0" />
                <EditableInput
                  value={dependency}
                  onChange={(value) => updateArrayItem('dependencies', index, value)}
                  className="text-sm text-purple-900 flex-1"
                  placeholder="Dependency"
                />
                {isEditing && (
                  <button
                    onClick={() => removeFromArray('dependencies', index)}
                    className="text-red-500 hover:text-red-700 flex-shrink-0"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-8">
        <Button
          variant="outline"
          onClick={handleBack}
          size="lg"
        >
          <ArrowLeft size={16} />
          Back to Upload
        </Button>
        
        <div className="flex gap-4">
          {!isEditing ? (
            <Button
              variant="outline"
              onClick={handleEdit}
              size="lg"
            >
              <Edit size={16} />
              Edit Summary
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
              >
                <Check size={16} />
                Save Changes
              </Button>
            </div>
          )}
          
          <Button
            onClick={handleNext}
            size="lg"
            className="btn-primary"
          >
            Generate Test Cases
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SummaryPreview;