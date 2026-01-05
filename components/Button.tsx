import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-4 py-2 rounded font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
  
  const variants = {
    primary: "bg-royal-600 hover:bg-royal-500 text-white shadow-lg shadow-royal-900/20",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    danger: "bg-red-900/50 hover:bg-red-900/70 text-red-200 border border-red-900",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></span>
      ) : null}
      {children}
    </button>
  );
};