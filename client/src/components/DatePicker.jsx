import { useRef, useState, useEffect } from 'react';
import { FiCalendar, FiX } from 'react-icons/fi';

const DatePicker = ({ value, onChange, className = '', style = {}, clearable = true }) => {
  const [typedValue, setTypedValue] = useState('');
  const nativeInputRef = useRef(null);

  // Sync prop value (YYYY-MM-DD) to text input display (DD/MM/YYYY)
  useEffect(() => {
    if (value) {
      const [year, month, day] = value.split('-');
      if (year && month && day) {
        setTypedValue(`${day}/${month}/${year}`);
        return;
      }
    }
    setTypedValue('');
  }, [value]);

  // Format typing as DD/MM/YYYY with auto-slashes, support manual slash, and prevent deletion lock
  const handleTextChange = (e) => {
    let rawVal = e.target.value;
    const isDeletion = e.nativeEvent.inputType === 'deleteContentBackward';
    
    // Keep only digits and slashes
    rawVal = rawVal.replace(/[^\d/]/g, '');
    // Prevent consecutive slashes
    rawVal = rawVal.replace(/\/+/g, '/');

    // Split into day, month, year based on slash positions
    let day = '';
    let month = '';
    let year = '';

    const slashCount = (rawVal.match(/\//g) || []).length;
    if (slashCount === 0) {
      const digits = rawVal.replace(/\D/g, '');
      day = digits.substring(0, 2);
      month = digits.substring(2, 4);
      year = digits.substring(4, 8);
    } else if (slashCount === 1) {
      const firstSlashIdx = rawVal.indexOf('/');
      day = rawVal.substring(0, firstSlashIdx).replace(/\D/g, '').substring(0, 2);
      const rest = rawVal.substring(firstSlashIdx + 1);
      const restDigits = rest.replace(/\D/g, '');
      month = restDigits.substring(0, 2);
      year = restDigits.substring(2, 6);
    } else {
      const firstSlashIdx = rawVal.indexOf('/');
      const secondSlashIdx = rawVal.indexOf('/', firstSlashIdx + 1);
      day = rawVal.substring(0, firstSlashIdx).replace(/\D/g, '').substring(0, 2);
      month = rawVal.substring(firstSlashIdx + 1, secondSlashIdx).replace(/\D/g, '').substring(0, 2);
      year = rawVal.substring(secondSlashIdx + 1).replace(/\D/g, '').substring(0, 4);
    }

    // Apply smart padding to day
    if (day.length > 0) {
      const firstDayDigit = day[0];
      if (['4', '5', '6', '7', '8', '9'].includes(firstDayDigit)) {
        if (!(isDeletion && rawVal.length === 2)) {
          day = `0${firstDayDigit}`;
        }
      }
    }

    // Apply smart padding to month
    if (month.length > 0) {
      const firstMonthDigit = month[0];
      if (['2', '3', '4', '5', '6', '7', '8', '9'].includes(firstMonthDigit)) {
        const daySlashLen = day.length + 1;
        if (!(isDeletion && rawVal.length === (daySlashLen + 2))) {
          month = `0${firstMonthDigit}`;
        }
      }
    }

    // Reconstruct the formatted value
    let formatted = day;
    
    // Add slash after day if it is complete, or if there is more content
    if (day.length === 2 && !(isDeletion && rawVal.length === 2)) {
      formatted += '/';
    } else if (slashCount > 0 && day.length > 0) {
      formatted += '/';
    }

    if (month.length > 0) {
      formatted += month;
      // Add slash after month if it is complete, or if there is a year
      if (month.length === 2 && !(isDeletion && rawVal.length === 5)) {
        formatted += '/';
      } else if (slashCount > 1) {
        formatted += '/';
      }
    }

    if (year.length > 0) {
      formatted += year;
    }

    setTypedValue(formatted);

    // If it reaches full date length, validate and propagate to parent
    if (formatted.length === 10) {
      const [d, m, y] = formatted.split('/');
      const dayNum = parseInt(d, 10);
      const monthNum = parseInt(m, 10) - 1;
      const yearNum = parseInt(y, 10);
      
      const dateObj = new Date(yearNum, monthNum, dayNum);
      if (
        dateObj.getFullYear() === yearNum &&
        dateObj.getMonth() === monthNum &&
        dateObj.getDate() === dayNum &&
        yearNum >= 1000 && yearNum <= 3000
      ) {
        const isoDate = `${yearNum}-${String(monthNum + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        onChange(isoDate);
      }
    } else if (formatted.length === 0) {
      onChange('');
    }
  };

  // Reset to last valid value if user blurs with invalid/incomplete input
  const handleBlur = () => {
    if (typedValue.length > 0 && typedValue.length < 10) {
      // Revert to prop value
      if (value) {
        const [year, month, day] = value.split('-');
        setTypedValue(`${day}/${month}/${year}`);
      } else {
        setTypedValue('');
      }
    } else if (typedValue.length === 10) {
      // Verify validity
      const [d, m, y] = typedValue.split('/');
      const day = parseInt(d, 10);
      const month = parseInt(m, 10) - 1;
      const year = parseInt(y, 10);
      const dateObj = new Date(year, month, day);
      const isValid = dateObj.getFullYear() === year &&
                      dateObj.getMonth() === month &&
                      dateObj.getDate() === day &&
                      year >= 1000 && year <= 3000;
      if (!isValid) {
        if (value) {
          const [year, month, day] = value.split('-');
          setTypedValue(`${day}/${month}/${year}`);
        } else {
          setTypedValue('');
        }
      }
    }
  };

  const handleNativeChange = (e) => {
    onChange(e.target.value);
  };

  const triggerPicker = (e) => {
    e.stopPropagation();
    if (nativeInputRef.current) {
      try {
        nativeInputRef.current.showPicker();
      } catch (err) {
        nativeInputRef.current.focus();
      }
    }
  };

  return (
    <div 
      className={`relative flex items-center justify-between px-3 py-1.5 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#111111] text-gray-900 dark:text-white hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-200 ${className}`}
      style={style}
    >
      <input
        type="text"
        value={typedValue}
        onChange={handleTextChange}
        onBlur={handleBlur}
        placeholder="dd/mm/yyyy"
        className="bg-transparent text-gray-900 dark:text-white focus:outline-none text-sm w-full cursor-text"
      />
      <div className="flex items-center gap-1 shrink-0 ml-2">
        {value && clearable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-350 transition-colors"
          >
            <FiX size={14} />
          </button>
        )}
        <button
          type="button"
          onClick={triggerPicker}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-350 transition-colors flex items-center justify-center p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
        >
          <FiCalendar size={16} />
        </button>
      </div>
      <input
        ref={nativeInputRef}
        type="date"
        value={value || ''}
        onChange={handleNativeChange}
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
      />
    </div>
  );
};

export default DatePicker;
