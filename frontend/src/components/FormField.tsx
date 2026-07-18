import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'textarea' | 'select';
  placeholder?: string;
  error?: string;
  register: UseFormRegisterReturn;
  options?: { value: string; label: string }[];
}

export default function FormField({
  label,
  name,
  type = 'text',
  placeholder,
  error,
  register,
  options,
}: FormFieldProps) {
  const baseInputClasses = `w-full bg-slate-950/40 border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
    error
      ? 'border-rose-500/50 focus:ring-rose-500/25 focus:border-rose-500'
      : 'border-white/10 focus:ring-cyan-500/25 focus:border-cyan-500/50'
  }`;

  return (
    <div className="flex flex-col gap-2 w-full text-left">
      <label htmlFor={name} className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
        {label}
      </label>

      {type === 'textarea' ? (
        <textarea
          id={name}
          placeholder={placeholder}
          rows={4}
          className={`${baseInputClasses} resize-none`}
          {...register}
        />
      ) : type === 'select' ? (
        <div className="relative w-full">
          <select id={name} className={`${baseInputClasses} appearance-none pr-10`} {...register}>
            <option value="" className="bg-slate-950">
              {placeholder || 'Select an option'}
            </option>
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-slate-950">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      ) : (
        <input
          id={name}
          type={type}
          placeholder={placeholder}
          className={baseInputClasses}
          {...register}
        />
      )}

      {error && (
        <span className="text-xs text-rose-400 font-medium mt-0.5 animate-fade-in-pure">
          {error}
        </span>
      )}
    </div>
  );
}
