import { useState, useMemo } from 'react';
import { FiChevronLeft, FiChevronRight, FiX, FiEdit2, FiTrash2 } from 'react-icons/fi';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const TransactionCalendar = ({
  transactions = [],
  onEdit,
  onDelete,
  calendarMonth,           // { year, month } controlled from parent
  onMonthChange,           // (year, month) => void
  formatCurrency,
  loading = false,
}) => {
  const [selectedDay, setSelectedDay] = useState(null); // Date string YYYY-MM-DD

  const { year, month } = calendarMonth;

  // Build calendar grid (always 6 rows × 7 cols)
  const { cells, monthLabel } = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay  = new Date(year, month, 0);
    // Monday-based: Mon=0 … Sun=6
    const startOffset = (firstDay.getDay() + 6) % 7;
    const totalDays   = lastDay.getDate();

    const cells = [];
    for (let i = 0; i < 42; i++) {
      const dayNum = i - startOffset + 1;
      if (dayNum < 1 || dayNum > totalDays) {
        cells.push(null);
      } else {
        cells.push(dayNum);
      }
    }

    const monthLabel = firstDay.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
    return { cells, monthLabel };
  }, [year, month]);

  // Group transactions by day string YYYY-MM-DD
  const byDay = useMemo(() => {
    const map = {};
    for (const t of transactions) {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }
    return map;
  }, [transactions]);

  const toKey = (day) =>
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const prevMonth = () => {
    if (month === 1) onMonthChange(year - 1, 12);
    else             onMonthChange(year, month - 1);
  };
  const nextMonth = () => {
    if (month === 12) onMonthChange(year + 1, 1);
    else              onMonthChange(year, month + 1);
  };
  const goToday = () => {
    onMonthChange(today.getFullYear(), today.getMonth() + 1);
  };

  // Summary for selected day
  const selectedDayTxs = selectedDay ? (byDay[selectedDay] || []) : [];
  const selectedIncome  = selectedDayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const selectedExpense = selectedDayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  // Month totals
  const monthIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="card space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <FiChevronLeft size={18} />
          </button>
          <h2 className="text-base font-bold text-gray-900 dark:text-white capitalize min-w-[160px] text-center">
            {monthLabel}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <FiChevronRight size={18} />
          </button>
          <button
            onClick={goToday}
            className="ml-1 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 hover:opacity-80 transition"
          >
            Hôm nay
          </button>
        </div>

        {/* Month summary */}
        <div className="flex items-center gap-4 text-sm">
          {loading && <span className="text-xs text-gray-400">Đang tải...</span>}
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            +{formatCurrency(monthIncome)}
          </span>
          <span className="flex items-center gap-1.5 text-red-500 dark:text-red-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            -{formatCurrency(monthExpense)}
          </span>
          <span className={`font-bold ${monthIncome - monthExpense >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
            = {formatCurrency(monthIncome - monthExpense)}
          </span>
        </div>
      </div>

      {/* ── Weekday headers ── */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map(d => (
          <div
            key={d}
            className={`text-center text-xs font-semibold py-1.5 rounded-lg ${
              d === 'CN'
                ? 'text-red-500 dark:text-red-400'
                : d === 'T7'
                ? 'text-blue-500 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── Day cells ── */}
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const key       = toKey(day);
          const dayTxs    = byDay[key] || [];
          const income    = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
          const expense   = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
          const isToday   = key === todayKey;
          const isSelected = key === selectedDay;
          const hasTxs    = dayTxs.length > 0;

          // Day-of-week: Sunday = col 7 (idx % 7 === 6 since Mon-based), Saturday = col 6 (idx%7===5)
          const colPos = idx % 7; // 0=Mon ... 5=Sat ... 6=Sun
          const isSun = colPos === 6;
          const isSat = colPos === 5;

          return (
            <button
              key={key}
              onClick={() => setSelectedDay(isSelected ? null : key)}
              className={`relative flex flex-col items-center p-1 rounded-xl transition-all duration-150 text-left group
                ${isSelected
                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                  : isToday
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 ring-2 ring-emerald-400'
                  : hasTxs
                  ? 'bg-gray-50 dark:bg-[#1a1a1a] hover:bg-gray-100 dark:hover:bg-[#222]'
                  : 'hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'}
              `}
              style={{ minHeight: '70px' }}
            >
              {/* Date number */}
              <span className={`text-xs font-bold self-end mr-0.5 mt-0.5 ${
                isSelected
                  ? 'text-white'
                  : isToday
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : isSun
                  ? 'text-red-500 dark:text-red-400'
                  : isSat
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                {day}
              </span>

              {/* Transaction dots + amounts */}
              {hasTxs && (
                <div className="w-full mt-auto space-y-0.5 px-0.5">
                  {income > 0 && (
                    <div className={`text-[10px] font-semibold truncate leading-tight px-1 py-0.5 rounded ${
                      isSelected
                        ? 'text-emerald-100 bg-emerald-600/50'
                        : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                    }`}>
                      +{formatCurrency(income)}
                    </div>
                  )}
                  {expense > 0 && (
                    <div className={`text-[10px] font-semibold truncate leading-tight px-1 py-0.5 rounded ${
                      isSelected
                        ? 'text-red-100 bg-red-600/40'
                        : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10'
                    }`}>
                      -{formatCurrency(expense)}
                    </div>
                  )}
                  {/* tx count dot */}
                  <div className={`flex justify-end ${isSelected ? 'opacity-70' : ''}`}>
                    <span className={`text-[9px] px-1 rounded-full ${
                      isSelected
                        ? 'text-white/80'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {dayTxs.length} giao dịch
                    </span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Day detail drawer ── */}
      {selectedDay && (
        <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">
                Ngày {new Date(selectedDay + 'T00:00:00').toLocaleDateString('vi-VN', {
                  weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
                })}
              </h3>
              <div className="flex gap-3 mt-0.5 text-sm">
                {selectedIncome > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    +{formatCurrency(selectedIncome)}
                  </span>
                )}
                {selectedExpense > 0 && (
                  <span className="text-red-500 dark:text-red-400 font-semibold">
                    -{formatCurrency(selectedExpense)}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition"
            >
              <FiX size={16} />
            </button>
          </div>

          {selectedDayTxs.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Không có giao dịch</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {selectedDayTxs.map(t => (
                <div
                  key={t._id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] hover:bg-gray-100 dark:hover:bg-[#222] transition group/row"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${
                    t.type === 'income'
                      ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600'
                      : 'bg-red-100 dark:bg-red-500/15 text-red-500'
                  }`}>
                    {t.type === 'income' ? '▲' : '▼'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {t.category}
                    </p>
                    {t.note && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t.note}</p>
                    )}
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0 ${
                    t.type === 'income'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-500 dark:text-red-400'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover/row:opacity-100 transition">
                    <button
                      onClick={() => onEdit(t)}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(t._id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionCalendar;
