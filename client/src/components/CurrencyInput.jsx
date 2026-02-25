import { useState, useEffect } from 'react';

const fmt = (n) => {
  if (n === '' || n === null || n === undefined) return '';
  const num = Number(n);
  if (isNaN(num)) return '';
  return num.toLocaleString('vi-VN');
};

/**
 * CurrencyInput — text input that formats the value with Vietnamese dot separators.
 *
 * Props:
 *  value      — raw number (or string-number) stored in parent state
 *  onChange   — called with the raw Number value (0 when empty)
 *  placeholder
 *  className  — extra classes appended to the base `input` class
 *  baseClass  — override base class entirely (e.g. for GoalModal's custom classes)
 *  error      — boolean; adds border-red-500 when true
 *  min        — minimum value for validation hint (not enforced by browser)
 */
const CurrencyInput = ({
  value,
  onChange,
  placeholder = '0',
  className = '',
  baseClass = 'input',
  error = false,
  ...rest
}) => {
  const [display, setDisplay] = useState(fmt(value));

  // Sync when value changes externally (e.g. opening edit modal)
  useEffect(() => {
    setDisplay(fmt(value));
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setDisplay(raw ? fmt(raw) : '');
    onChange(raw ? Number(raw) : '');
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      className={`${baseClass} ${error ? 'border-red-500' : ''} ${className}`.trim()}
      {...rest}
    />
  );
};

export default CurrencyInput;
