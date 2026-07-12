import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'default' | 'outline' | 'destructive';
}

export const Button = ({
  children,
  onClick,
  className = '',
  disabled = false,
  type = 'button',
  variant = 'default',
}: ButtonProps) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};
