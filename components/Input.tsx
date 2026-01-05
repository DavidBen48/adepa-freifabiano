import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, ...props }) => {
  return (
    <div className="w-full mb-4">
      {label && (
        <label className="block text-sm font-medium text-slate-400 mb-1">
          {label} {props.required && <span className="text-royal-500">*</span>}
        </label>
      )}
      <input
        className={`w-full bg-slate-900 border ${error ? 'border-red-500' : 'border-slate-700'} rounded p-2 text-slate-100 focus:outline-none focus:border-royal-500 focus:ring-1 focus:ring-royal-500 transition-colors ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: string[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className, ...props }) => {
    return (
        <div className="w-full mb-4">
            {label && (
                <label className="block text-sm font-medium text-slate-400 mb-1">
                    {label} {props.required && <span className="text-royal-500">*</span>}
                </label>
            )}
            <select
                className={`w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:outline-none focus:border-royal-500 focus:ring-1 focus:ring-royal-500 transition-colors ${className}`}
                {...props}
            >
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </div>
    );
};