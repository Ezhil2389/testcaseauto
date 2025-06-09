import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'solid',
  padding = 'md',
  shadow = 'md',
  ...props
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  const variantClasses = {
    glass: 'card-glass',
    solid: 'card',
    outline: 'bg-transparent border-2 border-white/20 rounded-2xl backdrop-blur-sm',
  };
  
  const classes = `
    ${variantClasses[variant]}
    ${paddingClasses[padding]} 
    ${shadowClasses[shadow]} 
    transition-all duration-300
    ${className}
  `.trim().replace(/\s+/g, ' ');
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;