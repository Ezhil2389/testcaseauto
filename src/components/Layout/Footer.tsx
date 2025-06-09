import React from 'react';
import { Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-[var(--border-light)] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <span className="font-semibold">Test Case Generator</span>
            <span className="text-xs bg-[var(--primary)] bg-opacity-10 text-[var(--primary)] px-2 py-1 rounded-full">
              v1.0
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
            <span>Made with</span>
            <Heart size={14} className="text-[var(--error)] fill-current" />
            <span>for better testing • {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;