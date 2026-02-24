import { useState } from 'react';
import { useDebt } from '../context/DebtContext';
import { useAuth } from '../context/AuthContext';
import DebtModal from '../components/DebtModal';
import {
  FiPlus, FiEdit2, FiTrash2, FiClock, FiCheck,
  FiChevronDown, FiChevronUp, FiAlertTriangle
} from 'react-icons/fi';

const Debts = () => {
  const { user } = useAuth();
  const { debts, stats, loading, createDebt, updateDebt, deleteDebt, addPayment, settleDebt } = useDebt();

  const [showModal, setShowModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [filterType, setFilterType]       = useState('all');   // all | lend | borrow
  const [filterStatus, setFilterStatus]   = useState('active');// active | settled | all
  const [expandedId, setExpandedId]       = useState(null);    // id of card showing history
  const [payingId, setPayingId]           = useState(null);
  const [payAmount, setPayAmount]         = useState('');
  const [payNote, setPayNote]             = useState('');

  const fmt = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: user?.currency || 'VND' }).format(n);

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  const daysUntil = (d) => {
    if (!d) return null;
    return Math.ceil((new Date(d) - new Date()) / 86400000);
  };

  const filtered = debts.filter(d => {
    if (filterType !== 'all'   && d.type   !== filterType)   return false;
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    return true;
  });

  const handleSave = async (data) => {
    if (editingDebt) return updateDebt(editingDebt._id, data);
    return createDebt(data);
  };

  const handleDelete = async (debt) => {
    if (window.confirm(`Xóa khoản nợ "${debt.personName}"?`)) deleteDebt(debt._id);
  };

  const handlePay = async (id) => {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return;
    const res = await addPayment(id, amount, payNote.trim());
    if (res.success) { setPayingId(null); setPayAmount(''); setPayNote(''); }
  };

  const paidPct = (d) => d.amount === 0 ? 100 : Math.round(((d.amount - d.remainingAmount) / d.amount) * 100);

  if (loading && debts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🤝</span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Quản lý nợ</h1>
          </div>
          <p className="text-sm text-gray-400 mt-0.5 ml-7">Theo dõi các khoản vay mượn cá nhân</p>
        </div>
        <button
          onClick={() => { setEditingDebt(null); setShowModal(true); }}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm self-start sm:self-auto"
        >
          <FiPlus size={16} /> Thêm khoản nợ
        </button>
      </div>

      {/* ── Stats ── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Người khác nợ tôi', value: fmt(stats.totalLend),   border: 'border-l-emerald-500', icon: '💰', color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Tôi đang nợ',       value: fmt(stats.totalBorrow), border: 'border-l-red-500',     icon: '💸', color: 'text-red-600 dark:text-red-400' },
            { label: 'Khoản đang cho vay', value: stats.activeLend + ' khoản',   border: 'border-l-blue-500',    icon: '🤝', color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Khoản đang vay',    value: stats.activeBorrow + ' khoản', border: 'border-l-amber-500',   icon: '📋', color: 'text-amber-600 dark:text-amber-400' },
          ].map((s, i) => (
            <div key={i} className={`bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222] border-l-4 ${s.border} rounded-2xl px-4 py-3`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{s.label}</p>
                  <p className={`text-lg font-black leading-tight ${s.color}`}>{s.value}</p>
                </div>
                <span className="text-2xl">{s.icon}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2">
        {/* Type filter */}
        <div className="flex items-center bg-gray-100 dark:bg-[#1a1a1a] p-1 rounded-xl gap-0.5">
          {[{ label: 'Tất cả', value: 'all' }, { label: '🤝 Tôi cho vay', value: 'lend' }, { label: '💸 Tôi vay', value: 'borrow' }].map(f => (
            <button
              key={f.value}
              onClick={() => setFilterType(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${ filterType === f.value ? 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700' }`}
            >{f.label}</button>
          ))}
        </div>
        {/* Status filter */}
        <div className="flex items-center bg-gray-100 dark:bg-[#1a1a1a] p-1 rounded-xl gap-0.5">
          {[{ label: 'Đang hoạt động', value: 'active' }, { label: 'Đã tất toán', value: 'settled' }, { label: 'Tất cả', value: 'all' }].map(f => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${ filterStatus === f.value ? 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700' }`}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {/* ── Cards ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🤝</div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Chưa có khoản nợ nào</p>
          <p className="text-xs text-gray-400 mb-5">Thêm khoản vay mượn để theo dõi</p>
          <button onClick={() => { setEditingDebt(null); setShowModal(true); }} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            <FiPlus size={15} /> Thêm khoản đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(debt => {
            const isLend     = debt.type === 'lend';
            const isSettled  = debt.status === 'settled';
            const pct        = paidPct(debt);
            const days       = daysUntil(debt.dueDate);
            const overdue    = days !== null && days < 0 && !isSettled;
            const nearDue    = days !== null && days >= 0 && days <= 7 && !isSettled;
            const expanded   = expandedId === debt._id;
            const paying     = payingId   === debt._id;

            return (
              <div
                key={debt._id}
                className={`group bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222] border-l-4 rounded-2xl p-5 hover:shadow-md transition-all duration-200 ${
                  isSettled   ? 'border-l-gray-300 dark:border-l-[#333] opacity-70'
                  : isLend    ? 'border-l-emerald-500'
                  : 'border-l-red-500'
                }`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isLend
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {isLend ? '🤝 Cho vay' : '💸 Tôi vay'}
                      </span>
                      {isSettled && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400">
                          ✅ Tất toán
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{debt.personName}</h3>
                    {debt.description && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{debt.description}</p>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                    <button onClick={() => { setEditingDebt(debt); setShowModal(true); }} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#2a2a2a] text-gray-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-500/20 dark:hover:text-blue-400 transition">
                      <FiEdit2 size={12} />
                    </button>
                    <button onClick={() => handleDelete(debt)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#2a2a2a] text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400 transition">
                      <FiTrash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Amount + progress */}
                <div className="mb-3">
                  <div className="flex items-end justify-between mb-1.5">
                    <div>
                      <p className="text-xs text-gray-400">Còn lại</p>
                      <p className={`text-xl font-black ${isLend ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {fmt(debt.remainingAmount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Gốc</p>
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{fmt(debt.amount)}</p>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${isSettled ? 'bg-gray-400' : isLend ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-right">Đã trả {pct}%</p>
                </div>

                {/* Due date */}
                {debt.dueDate && (
                  <div className={`flex items-center gap-1.5 text-xs font-medium mb-3 ${
                    isSettled ? 'text-gray-400'
                    : overdue  ? 'text-red-600 dark:text-red-400'
                    : nearDue  ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {overdue ? <FiAlertTriangle size={12} /> : <FiClock size={12} />}
                    {overdue
                      ? `Quá hạn ${Math.abs(days)} ngày`
                      : days === 0 ? 'Hạn hôm nay!'
                      : nearDue ? `Còn ${days} ngày (${fmtDate(debt.dueDate)})`
                      : `Hạn: ${fmtDate(debt.dueDate)}`}
                  </div>
                )}

                {/* Actions buttons */}
                {!isSettled && (
                  <div className="space-y-2">
                    {paying ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={payAmount}
                            onChange={e => setPayAmount(e.target.value)}
                            placeholder="Số tiền"
                            min="1"
                            step="1000"
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-xl dark:bg-[#1a1a1a] dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                          <button onClick={() => handlePay(debt._id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition">OK</button>
                          <button onClick={() => { setPayingId(null); setPayAmount(''); setPayNote(''); }} className="bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 px-3 py-2 rounded-xl text-xs font-bold transition">Hủy</button>
                        </div>
                        <input
                          type="text"
                          value={payNote}
                          onChange={e => setPayNote(e.target.value)}
                          placeholder="Ghi chú (tùy chọn)..."
                          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-xl dark:bg-[#1a1a1a] dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setPayingId(debt._id); setPayAmount(''); setPayNote(''); }}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                            isLend
                              ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100'
                              : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 hover:bg-red-100'
                          }`}
                        >
                          {isLend ? '+ Thu tiền' : '+ Ghi trả nợ'}
                        </button>
                        <button
                          onClick={() => settleDebt(debt._id)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition flex items-center gap-1"
                          title="Đánh dấu tất toán"
                        >
                          <FiCheck size={13} /> Tất toán
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* History toggle */}
                {debt.paymentHistory?.length > 0 && (
                  <button
                    onClick={() => setExpandedId(expanded ? null : debt._id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] transition mt-2"
                  >
                    <span className="flex items-center gap-1.5">
                      <FiClock size={12} /> Lịch sử thanh toán
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full">{debt.paymentHistory.length}</span>
                      {expanded ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
                    </span>
                  </button>
                )}

                {/* History drawer */}
                {expanded && (
                  <div className="mt-2 border border-gray-100 dark:border-[#2a2a2a] rounded-xl overflow-hidden">
                    <div className="bg-gray-50 dark:bg-[#1a1a1a] px-3 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Lịch sử
                    </div>
                    <div className="max-h-52 overflow-y-auto divide-y divide-gray-100 dark:divide-[#222]">
                      {[...debt.paymentHistory].reverse().map((h, i) => (
                        <div key={i} className="flex items-start justify-between gap-2 px-3 py-2.5">
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold ${isLend ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                              {isLend ? '+' : '-'}{fmt(h.amount)}
                            </p>
                            {h.note && <p className="text-xs text-gray-400 truncate mt-0.5">{h.note}</p>}
                          </div>
                          <p className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">{fmtDate(h.date)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <DebtModal
          debt={editingDebt}
          onClose={() => { setShowModal(false); setEditingDebt(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Debts;
