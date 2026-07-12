import React, { useState } from 'react';

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

export const Select = ({ children, value, onValueChange }: SelectProps) => (
  <div>{children}</div>
);

export const SelectTrigger = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <button className={`px-3 py-2 border border-gray-300 rounded-lg text-left ${className}`}>
    {children}
  </button>
);

export const SelectValue = ({ placeholder }: { placeholder?: string }) => (
  <span className="text-gray-600">{placeholder}</span>
);

export const SelectContent = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
    {children}
  </div>
);

export const SelectItem = ({ value, children }: SelectItemProps) => (
  <option value={value}>{children}</option>
);
