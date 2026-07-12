import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Input = ({ className = '', ...props }: InputProps) => (
  <input
    {...props}
    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${className}`}
  />
);
