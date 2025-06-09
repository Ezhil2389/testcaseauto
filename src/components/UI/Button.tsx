import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'btn focus-ring';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
  };
  
  const sizeClasses = {
    sm: 'text-sm px-4 py-2.5 min-h-[36px]',
    md: 'text-base px-6 py-3 min-h-[44px]',
    lg: 'text-lg px-8 py-4 min-h-[52px]',
  };
  
  // If className includes specific styling, use it; otherwise use variant classes
  const variantClass = className.includes('bg-') || className.includes('text-') 
    ? '' 
    : variantClasses[variant];
  
  const classes = `
    ${baseClasses}
    ${variantClass}
    ${sizeClasses[size]}
    ${isLoading || disabled ? 'opacity-70 cursor-not-allowed pointer-events-none' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');
  
  return (
    <button
      className={classes}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="spinner" />
          <span>Processing...</span>
        </>
      ) : children}
    </button>
  );
};

export default Button;