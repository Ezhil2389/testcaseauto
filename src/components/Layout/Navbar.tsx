import React from 'react';
import { useLocation } from 'react-router-dom';
import { FileText, Upload, Eye, Zap, ClipboardList, Check } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();
  
  const getStepStatus = (path: string) => {
    const currentPath = location.pathname;
    
    if (currentPath === path) return 'current';
    
    // Define the flow order
    const flowOrder = ['/', '/summary', '/generate-tests', '/test-management'];
    const currentIndex = flowOrder.indexOf(currentPath);
    const stepIndex = flowOrder.indexOf(path);
    
    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex < stepIndex) return 'upcoming';
    
    return 'upcoming';
  };

  const steps = [
    { path: '/', label: 'Upload Documents', icon: Upload, shortLabel: 'Upload' },
    { path: '/summary', label: 'Review Summary', icon: Eye, shortLabel: 'Review' },
    { path: '/generate-tests', label: 'Generate Tests', icon: Zap, shortLabel: 'Generate' },
    { path: '/test-management', label: 'Manage Tests', icon: ClipboardList, shortLabel: 'Manage' },
  ];
  
  return (
    <header className="bg-white border-b border-[var(--border-light)] sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="section-icon">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-xl text-[var(--text-primary)]">
                Test Case Generator
              </span>
              <p className="text-xs text-[var(--text-tertiary)] hidden sm:block">
                AI-Powered Testing Automation
              </p>
            </div>
          </div>
          
          {/* Workflow Steps - Desktop */}
          <nav className="hidden lg:flex items-center">
            <div className="flex items-center bg-[var(--surface)] rounded-2xl p-2 border border-[var(--border-light)]">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const status = getStepStatus(step.path);
                
                return (
                  <div key={step.path} className="flex items-center">
                    <div className={`
                      flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                      ${status === 'current' 
                        ? 'bg-[var(--primary)] text-white shadow-lg' 
                        : status === 'completed'
                        ? 'text-[var(--success)] hover:bg-green-50'
                        : 'text-[var(--text-tertiary)] hover:bg-gray-50'
                      }
                    `}>
                      <div className="relative">
                        {status === 'completed' ? (
                          <div className="w-5 h-5 bg-[var(--success)] rounded-full flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        ) : (
                          <Icon size={18} />
                        )}
                      </div>
                      <span className="hidden xl:block">{step.label}</span>
                      <span className="xl:hidden">{step.shortLabel}</span>
                    </div>
                    
                    {index < steps.length - 1 && (
                      <div className={`w-8 h-px mx-2 ${
                        steps.findIndex(s => s.path === location.pathname) > index
                          ? 'bg-[var(--success)]'
                          : 'bg-[var(--border)]'
                      }`}></div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>
          
          {/* Simplified Steps - Tablet */}
          <nav className="hidden md:flex lg:hidden items-center space-x-3">
            <div className="flex items-center bg-[var(--surface)] rounded-2xl p-2 border border-[var(--border-light)]">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const status = getStepStatus(step.path);
                
                return (
                  <div key={step.path} className="flex items-center">
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200
                      ${status === 'current' 
                        ? 'bg-[var(--primary)] text-white shadow-lg' 
                        : status === 'completed'
                        ? 'bg-[var(--success)] text-white'
                        : 'bg-gray-100 text-[var(--text-tertiary)] hover:bg-gray-200'
                      }
                    `}>
                      {status === 'completed' ? (
                        <Check size={18} />
                      ) : (
                        <Icon size={18} />
                      )}
                    </div>
                    
                    {index < steps.length - 1 && (
                      <div className={`w-6 h-px mx-2 ${
                        steps.findIndex(s => s.path === location.pathname) > index
                          ? 'bg-[var(--success)]'
                          : 'bg-[var(--border)]'
                      }`}></div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>
          
          {/* Mobile indicator */}
          <div className="md:hidden flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                Step {steps.findIndex(s => s.path === location.pathname) + 1}
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">
                of {steps.length}
              </div>
            </div>
            <div className="w-12 h-12 bg-[var(--primary)] rounded-xl flex items-center justify-center">
              {React.createElement(steps.find(s => s.path === location.pathname)?.icon || Upload, {
                size: 18,
                className: "text-white"
              })}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;