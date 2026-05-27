import { useEffect, useState } from 'react';
import { useWallets } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FiPlus, FiEdit2, FiTrash2, FiBriefcase, FiTrendingUp } from 'react-icons/fi';
import { BiTransfer } from 'react-icons/bi';
import WalletModal from '../components/WalletModal';
import api from '../services/api';

const Wallets = () => {
  const { user } = useAuth();
  const { wallets, loading, fetchWallets, createWallet, updateWallet, deleteWallet, transferFunds } = useWallets();
  const { language } = useLanguage();
  const isEnglish = language === 'en';

  const [showModal, setShowModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  
  // Quick Transfer State
  const [fromWalletId, setFromWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Transfer History State
  const [transfers, setTransfers] = useState([]);
  const [transfersLoading, setTransfersLoading] = useState(false);

  const fetchRecentTransfers = async () => {
    try {
      setTransfersLoading(true);
      const response = await api.get('/transactions', {
        params: { type: 'transfer', limit: 10 }
      });
      if (response.data?.success) {
        setTransfers(response.data.data || []);
      }
    } catch (err) {
      console.error('Lỗi khi tải lịch sử chuyển tiền:', err);
    } finally {
      setTransfersLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
    fetchRecentTransfers();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(isEnglish ? 'en-US' : 'vi-VN', { style: 'currency', currency: user?.currency || 'VND' }).format(amount);
  };

  const handleEdit = (wallet) => {
    setEditingWallet(wallet);
    setShowModal(true);
  };

  const handleDelete = async (wallet) => {
    if (wallet.isDefault) {
      alert(isEnglish ? 'Cannot delete the default wallet. Please set another wallet as default first.' : 'Không thể xóa ví mặc định. Vui lòng đặt ví khác làm mặc định trước.');
      return;
    }
    if (window.confirm(isEnglish ? `Are you sure you want to delete wallet "${wallet.name}"? All transactions inside this wallet will be moved to another wallet.` : `Bạn có chắc chắn muốn xóa ví "${wallet.name}"? Tất cả giao dịch thuộc ví này sẽ được chuyển sang ví khác.`)) {
      try {
        await deleteWallet(wallet.id);
      } catch (err) {}
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingWallet(null);
  };

  const handleSave = async (formData) => {
    if (editingWallet) {
      await updateWallet(editingWallet.id, formData);
    } else {
      await createWallet(formData);
    }
  };

  const handleQuickTransfer = async (e) => {
    e.preventDefault();
    if (!fromWalletId || !toWalletId || !transferAmount) return;

    try {
      setIsTransferring(true);
      await transferFunds({
        fromWalletId,
        toWalletId,
        amount: parseFloat(transferAmount),
        note: transferNote.trim() || undefined
      });
      setTransferAmount('');
      setTransferNote('');
      setFromWalletId('');
      setToWalletId('');
      await fetchRecentTransfers();
    } catch (err) {
      console.error(err);
    } finally {
      setIsTransferring(false);
    }
  };

  const adjustColorBrightness = (hex, percent) => {
    let R = parseInt(hex.substring(1, 3), 16);
    let G = parseInt(hex.substring(3, 5), 16);
    let B = parseInt(hex.substring(5, 7), 16);

    R = parseInt((R * (100 + percent)) / 100);
    G = parseInt((G * (100 + percent)) / 100);
    B = parseInt((B * (100 + percent)) / 100);

    R = R < 255 ? R : 255;
    G = G < 255 ? G : 255;
    B = B < 255 ? B : 255;

    R = R > 0 ? R : 0;
    G = G > 0 ? G : 0;
    B = B > 0 ? B : 0;

    const rHex = R.toString(16).padStart(2, '0');
    const gHex = G.toString(16).padStart(2, '0');
    const bHex = B.toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
  };

  const getCardStyle = (color) => {
    const c = color || '#3B82F6';
    return {
      background: `linear-gradient(135deg, ${c} 0%, ${adjustColorBrightness(c, -35)} 100%)`
    };
  };

  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Upper Panel */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        
        {/* Aggregate Asset Banner */}
        <div className="xl:col-span-8 rounded-2xl bg-[#0d3b30] p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-[#185e4e] opacity-30" />
          <div className="absolute -right-16 -bottom-16 h-56 w-56 rounded-full bg-[#185e4e] opacity-25" />
          
          <div className="relative">
            <div className="flex items-center gap-2">
              <FiBriefcase className="text-[#a6dfcc]" size={16} />
              <p className="text-xs uppercase tracking-widest text-[#a6dfcc]">
                {isEnglish ? 'Total Wallet Balance' : 'Tổng tài sản các ví'}
              </p>
            </div>
            <h1 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight">
              {formatCurrency(totalBalance)}
            </h1>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#c8f5e6]">
              <FiTrendingUp size={12} /> {wallets.length} {isEnglish ? 'Active Wallets' : 'Ví đang hoạt động'}
            </div>
          </div>
          
          <div className="relative mt-6 border-t border-[#1a5b4c] pt-4 flex gap-8">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#a6dfcc]">{isEnglish ? 'Main Wallet' : 'Ví mặc định'}</p>
              <p className="text-lg font-bold">
                {wallets.find(w => w.isDefault)?.name || '---'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#a6dfcc]">{isEnglish ? 'Default Icon' : 'Ký hiệu'}</p>
              <p className="text-lg font-bold">
                {wallets.find(w => w.isDefault)?.icon || '💼'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Fund Transfer Card */}
        <div className="xl:col-span-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-[#191d25] border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <BiTransfer size={20} className="text-emerald-500" />
              {isEnglish ? 'Quick Transfer' : 'Chuyển tiền nhanh'}
            </h3>
            
            <form onSubmit={handleQuickTransfer} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1">{isEnglish ? 'From' : 'Từ ví'}</label>
                  <select
                    required
                    value={fromWalletId}
                    onChange={(e) => setFromWalletId(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-200 bg-gray-50 px-2 py-2 dark:border-gray-800 dark:bg-[#232936] dark:text-white"
                  >
                    <option value="">-- {isEnglish ? 'Select' : 'Chọn ví'} --</option>
                    {wallets.map(w => (
                      <option key={w.id} value={w.id} disabled={w.id === toWalletId}>
                        {w.icon} {w.name} ({formatCurrency(w.balance)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 font-bold mb-1">{isEnglish ? 'To' : 'Đến ví'}</label>
                  <select
                    required
                    value={toWalletId}
                    onChange={(e) => setToWalletId(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-200 bg-gray-50 px-2 py-2 dark:border-gray-800 dark:bg-[#232936] dark:text-white"
                  >
                    <option value="">-- {isEnglish ? 'Select' : 'Chọn ví'} --</option>
                    {wallets.map(w => (
                      <option key={w.id} value={w.id} disabled={w.id === fromWalletId}>
                        {w.icon} {w.name} ({formatCurrency(w.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder={isEnglish ? 'Amount' : 'Số tiền'}
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-[#232936] dark:text-white"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder={isEnglish ? 'Note' : 'Ghi chú'}
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-[#232936] dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isTransferring || !fromWalletId || !toWalletId || !transferAmount}
                className="w-full rounded-xl bg-[#004b38] py-2 text-xs font-semibold text-white hover:bg-[#005e47] disabled:opacity-40 transition-colors"
              >
                {isTransferring ? (isEnglish ? 'Processing...' : 'Đang chuyển...') : (isEnglish ? 'Transfer Funds' : 'Xác nhận chuyển tiền')}
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Wallet Cards Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEnglish ? 'My Wallets' : 'Tài khoản ví của tôi'}
          </h3>
          <button
            onClick={() => {
              setEditingWallet(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#004b38] px-4 py-2 text-xs font-semibold text-white hover:bg-[#005e47] shadow-sm transition-colors"
          >
            <FiPlus size={14} />
            {isEnglish ? 'Add Wallet' : 'Thêm ví mới'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wallets.map((wallet) => (
            <div
              key={wallet.id}
              style={getCardStyle(wallet.color)}
              className="relative rounded-2xl p-5 text-white shadow-lg flex flex-col justify-between min-h-[180px] overflow-hidden group hover:scale-[1.02] transition-all duration-200"
            >
              {/* Card Chip decoration */}
              <div className="absolute right-6 top-16 h-8 w-10 rounded bg-yellow-400/20 border border-yellow-300/30 opacity-70" />
              
              <div className="flex items-start justify-between relative">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl bg-white/20 h-10 w-10 rounded-xl flex items-center justify-center backdrop-blur-md">
                    {wallet.icon || '💼'}
                  </span>
                  <div>
                    <h4 className="font-extrabold text-base tracking-wide truncate max-w-[140px]">
                      {wallet.name}
                    </h4>
                    {wallet.isDefault && (
                      <span className="inline-block text-[9px] font-black uppercase tracking-wider bg-white/30 text-white px-2 py-0.5 rounded-full mt-0.5">
                        {isEnglish ? 'Default' : 'Mặc định'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(wallet)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white transition-colors"
                    title={isEnglish ? 'Edit' : 'Sửa'}
                  >
                    <FiEdit2 size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(wallet)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/35 text-white transition-colors"
                    title={isEnglish ? 'Delete' : 'Xóa'}
                  >
                    <FiTrash2 size={12} />
                  </button>
                </div>
              </div>

              <div className="mt-8 relative">
                <p className="text-[10px] uppercase tracking-widest text-white/70">
                  {isEnglish ? 'Card Balance' : 'Số dư khả dụng'}
                </p>
                <p className="text-2xl font-black tracking-tight mt-1">
                  {formatCurrency(wallet.balance)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transfer History Section */}
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-[#191d25] border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <BiTransfer className="text-blue-500" size={22} />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEnglish ? 'Recent Transfers' : 'Lịch sử chuyển tiền gần đây'}
          </h3>
        </div>

        {transfersLoading && transfers.length === 0 ? (
          <div className="text-center py-6 text-sm text-gray-500">
            {isEnglish ? 'Loading history...' : 'Đang tải lịch sử...'}
          </div>
        ) : transfers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                  <th className="py-3 px-4">{isEnglish ? 'Date' : 'Ngày'}</th>
                  <th className="py-3 px-4">{isEnglish ? 'From Wallet' : 'Ví nguồn'}</th>
                  <th className="py-3 px-4"></th>
                  <th className="py-3 px-4">{isEnglish ? 'To Wallet' : 'Ví nhận'}</th>
                  <th className="py-3 px-4 text-right">{isEnglish ? 'Amount' : 'Số tiền'}</th>
                  <th className="py-3 px-4">{isEnglish ? 'Note' : 'Ghi chú'}</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-50 dark:border-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                      {new Date(tx.date).toLocaleDateString(isEnglish ? 'en-US' : 'vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      <span className="mr-1">{tx.wallet?.icon || '💳'}</span>
                      {tx.wallet?.name || (isEnglish ? 'Source Wallet' : 'Ví nguồn')}
                    </td>
                    <td className="py-3 px-4 text-blue-500 text-center font-bold">→</td>
                    <td className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      <span className="mr-1">{tx.toWallet?.icon || '💳'}</span>
                      {tx.toWallet?.name || (isEnglish ? 'Target Wallet' : 'Ví nhận')}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                      {tx.note || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {isEnglish ? 'No transfers logged yet.' : 'Chưa có lịch sử chuyển khoản nào.'}
          </div>
        )}
      </div>

      {/* Wallet Modal */}
      {showModal && (
        <WalletModal
          wallet={editingWallet}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}

    </div>
  );
};

export default Wallets;
