import React from 'react';

interface DoodleCurrencyInputProps {
  value: number | '';
  onChange: (val: number) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  label?: string;
  required?: boolean;
}

export const DoodleCurrencyInput: React.FC<DoodleCurrencyInputProps> = ({
  value,
  onChange,
  placeholder = '0',
  className = '',
  id,
  label,
  required,
}) => {
  // Format numeric value with dot thousands separators
  const formattedDisplay =
    value !== '' && value !== undefined && !isNaN(Number(value))
      ? Number(value).toLocaleString('id-ID')
      : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^\d]/g, '');
    if (rawVal === '') {
      onChange(0);
    } else {
      onChange(parseInt(rawVal, 10));
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-bold uppercase text-slate-600 mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className={`relative flex items-center ${className}`}>
        <span className="absolute left-3 font-mono font-black text-slate-500 text-xs sm:text-sm select-none pointer-events-none">
          Rp
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          required={required}
          value={formattedDisplay}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-mono font-bold text-slate-900 bg-white border-2 border-slate-900 rounded-md shadow-xs focus:outline-none focus:bg-amber-50/50 [font-variant-numeric:tabular-nums]"
        />
      </div>
    </div>
  );
};
