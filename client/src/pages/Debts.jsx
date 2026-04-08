import { useState } from 'react';
import { useDebt } from '../context/DebtContext';
import { useAuth } from '../context/AuthContext';
import DebtModal from '../components/DebtModal';
import {
  FiPlus, FiEdit2, FiTrash2, FiClock, FiCheck,
  FiAlertTriangle, FiTrendingUp
} from 'react-icons/fi';
import { DebtsSkeleton } from '../components/LoadingSkeleton';
import CurrencyInput from '../components/CurrencyInput';
import Pagination from '../components/Pagination';

const Debts = () => {
  const ITEMS_PER_PAGE = 8;
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
  const [currentPage, setCurrentPage]     = useState(1);

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

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedDebts = filtered.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  const activeDebts = debts.filter(d => d.status === 'active');
  const totalLend = stats?.totalLend ?? debts.filter(d => d.type === 'lend').reduce((s, d) => s + (d.remainingAmount || 0), 0);
  const totalBorrow = stats?.totalBorrow ?? debts.filter(d => d.type === 'borrow').reduce((s, d) => s + (d.remainingAmount || 0), 0);
  const netBalance = totalLend - totalBorrow;
  const settledCount = debts.filter(d => d.status === 'settled').length;

  const topProgressDebts = [...activeDebts]
    .sort((a, b) => paidPct(b) - paidPct(a))
    .slice(0, 3);

  const dueSoonDebts = [...activeDebts]
    .filter(d => d.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 3);

  const chartDebts = [...activeDebts]
    .sort((a, b) => (b.amount || 0) - (a.amount || 0))
    .slice(0, 6);

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
    return <DebtsSkeleton />;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-8 rounded-xl bg-[#004b38] p-6 text-white shadow-[0_14px_40px_rgba(1,56,42,0.28)] relative overflow-hidden">
          <div className="absolute -right-8 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full bg-[#4c8f7a] opacity-35" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="text-[#b8e4d6]">🤝</span>
              <p className="text-xs uppercase tracking-[0.18em] text-[#9ed3c3]">Quản lý công nợ</p>
            </div>
            <h1 className="mt-3 text-5xl font-black tracking-tight">{fmt(Math.abs(netBalance))}</h1>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-[#d8fff2]">
              <FiTrendingUp size={12} /> {netBalance >= 0 ? 'Vị thế dương' : 'Vị thế âm'} ({netBalance >= 0 ? 'Bạn đang được nợ nhiều hơn' : 'Bạn đang nợ nhiều hơn'})
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 border-t border-[#1e6b57] pt-5 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#9ed3c3]">Người khác nợ tôi</p>
                <p className="mt-1 text-2xl font-bold">{fmt(totalLend)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#9ed3c3]">Tôi đang nợ</p>
                <p className="mt-1 text-2xl font-bold">{fmt(totalBorrow)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#9ed3c3]">Đã tất toán</p>
                <p className="mt-1 text-2xl font-bold">{settledCount}/{debts.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-4">
          <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-[#191d25]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#181c24] dark:text-[#eef1f5]">Tiến độ trả nợ</h3>
              <button onClick={() => { setEditingDebt(null); setShowModal(true); }} className="text-xs font-semibold text-[#3a4a62] hover:underline dark:text-[#b9c3d0]">
                Thêm mới
              </button>
            </div>

            <div className="space-y-3">
              {topProgressDebts.length > 0 ? topProgressDebts.map((debt) => {
                const pct = paidPct(debt);
                return (
                  <div key={debt._id}>
                    <div className="mb-1 flex items-center justify-between text-xs text-[#586074] dark:text-[#a9afbb]">
                      <span className="font-semibold truncate pr-3">{debt.personName}</span>
                      <span className="font-bold">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#e3e7ee] dark:bg-[#2d3340]">
                      <div className={`h-full rounded-full ${debt.type === 'lend' ? 'bg-emerald-600' : 'bg-red-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              }) : (
                <p className="text-sm text-[#6f7480] dark:text-[#a4acba]">Bạn chưa có khoản nợ nào.</p>
              )}
            </div>

            <div className="mt-4 rounded-xl bg-[#f1f4f8] p-3 dark:bg-[#222935]">
              <p className="text-xs font-semibold text-[#5a6374] dark:text-[#adb5c3]">Gợi ý thông minh</p>
              <p className="mt-1 text-sm font-semibold text-[#1f2733] dark:text-[#e8edf4]">
                {activeDebts.length > 0
                  ? 'Ưu tiên xử lý các khoản sắp đến hạn để tránh phát sinh quá hạn.'
                  : 'Tuyệt vời! Bạn không có khoản nợ đang hoạt động.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-8 rounded-xl bg-white p-5 shadow-sm dark:bg-[#191d25]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">Biến động công nợ</h3>
              <p className="text-sm text-[#6f7480] dark:text-[#a4acba]">Đã thanh toán và còn lại theo từng khoản</p>
            </div>
            <div className="text-xs font-semibold text-[#5e6573] dark:text-[#a7afbc]">Top 6 khoản</div>
          </div>

          {chartDebts.length > 0 ? (
            <div className="flex items-end gap-4 h-[220px] px-2">
              {chartDebts.map((debt) => {
                const progress = paidPct(debt);
                const reachedHeight = Math.max(progress, 8);
                const remainHeight = Math.max(100 - progress, 8);
                return (
                  <div key={debt._id} className="flex-1 min-w-0">
                    <div className="h-[170px] flex items-end justify-center gap-2">
                      <div className={`w-4 rounded-t-md ${debt.type === 'lend' ? 'bg-[#0b6f53]' : 'bg-[#b4534b]'}`} style={{ height: `${reachedHeight}%` }} />
                      <div className="w-4 rounded-t-md bg-[#b7c4d8]" style={{ height: `${remainHeight}%` }} />
                    </div>
                    <p className="mt-2 truncate text-center text-[11px] font-semibold text-[#6a7280] dark:text-[#aeb5c2]">{debt.personName}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-[#6f7480] dark:text-[#a4acba]">
              Chưa có dữ liệu công nợ.
            </div>
          )}
        </div>

        <div className="xl:col-span-4 rounded-xl bg-white p-5 shadow-sm dark:bg-[#191d25]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">Khoản sắp tới hạn</h3>
            <span className="text-xs font-semibold text-[#3a4a62] dark:text-[#b9c3d0]">Lịch nợ</span>
          </div>

          <div className="space-y-3">
            {dueSoonDebts.length > 0 ? dueSoonDebts.map((debt) => {
              const days = daysUntil(debt.dueDate);
              const overdue = days !== null && days < 0;
              return (
                <div key={debt._id} className="flex items-center justify-between rounded-xl bg-[#f4f6f9] p-3 dark:bg-[#232936]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${overdue ? 'bg-[#f3d7d2] text-[#7b3e35]' : 'bg-[#dfe8f6] text-[#476082]'}`}>
                      {overdue ? <FiAlertTriangle size={14} /> : <FiClock size={14} />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#1f2733] dark:text-[#e8edf4]">{debt.personName}</p>
                      <p className={`text-xs ${overdue ? 'text-red-600 dark:text-red-400' : 'text-[#6f7480] dark:text-[#a4acba]'}`}>
                        {overdue ? `Quá hạn ${Math.abs(days)} ngày` : `Còn ${days} ngày`}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-[#1a1f29] dark:text-[#eff2f6]">{fmt(debt.remainingAmount)}</p>
                </div>
              );
            }) : (
              <p className="text-sm text-[#6f7480] dark:text-[#a4acba]">Không có khoản nào gần đến hạn.</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm dark:bg-[#191d25]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eceff4] px-5 py-4 dark:border-[#2b313d]">
          <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">Danh sách công nợ</h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              {[{ label: 'Tất cả', value: 'all' }, { label: 'Tôi cho vay', value: 'lend' }, { label: 'Tôi vay', value: 'borrow' }].map(f => (
                <button
                  key={f.value}
                  onClick={() => {
                    setFilterType(f.value);
                    setCurrentPage(1);
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    filterType === f.value
                      ? 'bg-[#eceff4] text-[#1f2733] dark:bg-[#303746] dark:text-[#f1f4f8]'
                      : 'bg-[#f8f9fb] text-[#6f7480] hover:bg-[#edf1f6] dark:bg-[#232936] dark:text-[#a4acba] dark:hover:bg-[#2d3442]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
              {[{ label: 'Đang hoạt động', value: 'active' }, { label: 'Đã tất toán', value: 'settled' }, { label: 'Tất cả trạng thái', value: 'all' }].map(f => (
                <button
                  key={f.value}
                  onClick={() => {
                    setFilterStatus(f.value);
                    setCurrentPage(1);
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    filterStatus === f.value
                      ? 'bg-[#eceff4] text-[#1f2733] dark:bg-[#303746] dark:text-[#f1f4f8]'
                      : 'bg-[#f8f9fb] text-[#6f7480] hover:bg-[#edf1f6] dark:bg-[#232936] dark:text-[#a4acba] dark:hover:bg-[#2d3442]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setEditingDebt(null); setShowModal(true); }}
              className="ml-1 inline-flex items-center gap-1.5 rounded-xl bg-[#003d2d] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#00523d]"
            >
              <FiPlus size={13} /> Thêm khoản nợ
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[#eceff4] bg-[#f8f9fb] text-left text-xs font-bold uppercase tracking-wider text-[#7a808c] dark:border-[#2b313d] dark:bg-[#232936] dark:text-[#9fa7b4]">
                <th className="px-5 py-3">Đối tượng</th>
                <th className="px-5 py-3">Loại</th>
                <th className="px-5 py-3">Còn lại</th>
                <th className="px-5 py-3">Gốc</th>
                <th className="px-5 py-3">Tiến độ</th>
                <th className="px-5 py-3">Hạn</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDebts.length > 0 ? paginatedDebts.map((debt, idx) => {
                const isLend = debt.type === 'lend';
                const isSettled = debt.status === 'settled';
                const pct = paidPct(debt);
                const days = daysUntil(debt.dueDate);
                const overdue = days !== null && days < 0 && !isSettled;
                const expanded = expandedId === debt._id;
                const paying = payingId === debt._id;

                return [
                  <tr key={`row-${debt._id}`} className={`border-b border-[#eef1f6] dark:border-[#2a303b] ${idx % 2 === 1 ? 'bg-[#fcfdff] dark:bg-[#1d222c]' : ''}`}>
                    <td className="px-5 py-4">
                      <p className="font-bold text-[#1d2430] dark:text-[#eef1f5]">{debt.personName}</p>
                      <p className="text-xs text-[#6f7480] dark:text-[#a4acba]">{debt.description || 'Khoản vay mượn cá nhân'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${isLend ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                        {isLend ? 'Cho vay' : 'Tôi vay'}
                      </span>
                    </td>
                    <td className={`px-5 py-4 font-semibold ${isLend ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>{fmt(debt.remainingAmount)}</td>
                    <td className="px-5 py-4 text-[#303846] dark:text-[#c9d1db] font-semibold">{fmt(debt.amount)}</td>
                    <td className="px-5 py-4">
                      <div className="w-24">
                        <p className="text-xs font-semibold text-[#4f596b] dark:text-[#b9c3d1] mb-1">{pct}%</p>
                        <div className="h-2 rounded-full bg-[#e3e7ee] dark:bg-[#2d3340]">
                          <div className={`h-full rounded-full ${isSettled ? 'bg-gray-400' : isLend ? 'bg-emerald-600' : 'bg-red-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold">
                      {debt.dueDate ? (
                        <span className={overdue ? 'text-red-600 dark:text-red-400' : 'text-[#6f7480] dark:text-[#a4acba]'}>
                          {overdue ? `Quá hạn ${Math.abs(days)} ngày` : fmtDate(debt.dueDate)}
                        </span>
                      ) : <span className="text-[#6f7480] dark:text-[#a4acba]">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${isSettled ? 'bg-[#e4f8ef] text-[#12724e] dark:bg-[#213c33] dark:text-[#80d6b4]' : 'bg-[#fff4db] text-[#8a6a2f] dark:bg-[#3a3422] dark:text-[#f0d493]'}`}>
                        {isSettled ? 'Tất toán' : 'Đang hoạt động'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isSettled && (
                          <button
                            onClick={() => {
                              setPayingId(paying ? null : debt._id);
                              setExpandedId(null);
                              setPayAmount('');
                              setPayNote('');
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#e7f6ee] text-[#1f7d55] hover:bg-[#d7f0e4] dark:bg-[#204236] dark:text-[#8edbbb] dark:hover:bg-[#285344]"
                            title="Ghi thanh toán"
                          >
                            <FiPlus size={14} />
                          </button>
                        )}
                        {(debt.paymentHistory?.length ?? 0) > 0 && (
                          <button
                            onClick={() => {
                              setExpandedId(expanded ? null : debt._id);
                              setPayingId(null);
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef2f7] text-[#5c6676] hover:bg-[#dfe6ef] dark:bg-[#2a303b] dark:text-[#b8c0cc] dark:hover:bg-[#364050]"
                            title="Lịch sử"
                          >
                            <FiClock size={14} />
                          </button>
                        )}
                        {!isSettled && (
                          <button
                            onClick={() => settleDebt(debt._id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#e6ecfa] text-[#6177a6] hover:bg-[#dce6fa] dark:bg-[#313b54] dark:text-[#a9bcdf] dark:hover:bg-[#39455f]"
                            title="Tất toán"
                          >
                            <FiCheck size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => { setEditingDebt(debt); setShowModal(true); }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef2f7] text-[#5c6676] hover:bg-[#dfe6ef] dark:bg-[#2a303b] dark:text-[#b8c0cc] dark:hover:bg-[#364050]"
                          title="Chỉnh sửa"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(debt)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#f8eceb] text-[#a55d56] hover:bg-[#f4dedc] dark:bg-[#3b2a2c] dark:text-[#e0a29a] dark:hover:bg-[#4a3336]"
                          title="Xóa"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>,

                  paying ? (
                    <tr key={`pay-${debt._id}`} className="border-b border-[#eef1f6] dark:border-[#2a303b] bg-[#f8fbfa] dark:bg-[#1f2d29]">
                      <td colSpan={8} className="px-5 py-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                          <div className="md:w-64">
                            <CurrencyInput
                              value={payAmount}
                              onChange={v => setPayAmount(v)}
                              placeholder="Số tiền"
                              baseClass="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#334640] rounded-xl dark:bg-[#18231f] dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                          <input
                            type="text"
                            value={payNote}
                            onChange={e => setPayNote(e.target.value)}
                            placeholder="Ghi chú (tùy chọn)..."
                            className="md:flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-[#334640] rounded-xl dark:bg-[#18231f] dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                          <div className="flex items-center gap-2">
                            <button onClick={() => handlePay(debt._id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition">Xác nhận</button>
                            <button onClick={() => { setPayingId(null); setPayAmount(''); setPayNote(''); }} className="bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 px-3 py-2 rounded-xl text-xs font-bold transition">Hủy</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null,

                  expanded ? (
                    <tr key={`history-${debt._id}`} className="border-b border-[#eef1f6] dark:border-[#2a303b] bg-[#f9fafc] dark:bg-[#212734]">
                      <td colSpan={8} className="px-5 py-3">
                        <div className="max-h-52 overflow-y-auto divide-y divide-gray-100 dark:divide-[#2b3241] rounded-xl border border-[#e8edf4] dark:border-[#2f3748]">
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
                      </td>
                    </tr>
                  ) : null,
                ];
              }) : (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <p className="text-sm text-[#6f7480] dark:text-[#a4acba]">Không có khoản nợ phù hợp với bộ lọc hiện tại.</p>
                    <button
                      onClick={() => { setEditingDebt(null); setShowModal(true); }}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#003d2d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00523d]"
                    >
                      <FiPlus size={14} /> Thêm khoản đầu tiên
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalItems > 0 && (
          <div className="px-5 pb-4">
            <Pagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={ITEMS_PER_PAGE}
              onItemsPerPageChange={() => {}}
              totalItems={totalItems}
              showItemsPerPageSelector={false}
            />
          </div>
        )}
      </div>

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
