import { useEffect, useState } from 'react';
import { FiRefreshCw, FiSave, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { adminContactService } from '../services/adminContact.service';
import { useLanguage } from '../context/LanguageContext';
import Pagination from '../components/Pagination';

const statusOptions = [
  { value: 'new', label: { vi: 'Mới', en: 'New' } },
  { value: 'read', label: { vi: 'Đã đọc', en: 'Read' } },
  { value: 'replied', label: { vi: 'Đã phản hồi', en: 'Replied' } },
];

const AdminContacts = () => {
  const { language } = useLanguage();
  const isEnglish = language === 'en';
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ new: 0, read: 0, replied: 0 });
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [drafts, setDrafts] = useState({});

  const loadMessages = async (page = 1, limitOverride = null) => {
    setLoading(true);
    try {
      const response = await adminContactService.getMessages({
        page,
        limit: limitOverride !== null ? limitOverride : pagination.limit,
        search: search || undefined,
        status: status || undefined,
      });
      const nextItems = response.items || [];
      setItems(nextItems);
      setSummary(response.summary || { new: 0, read: 0, replied: 0 });
      setPagination(response.pagination || { total: 0, page: 1, totalPages: 1, limit: limitOverride !== null ? limitOverride : pagination.limit });
      setDrafts((current) => {
        const nextDrafts = {};
        nextItems.forEach((item) => {
          nextDrafts[item.id] = {
            status: item.status || 'new',
            adminNote: item.adminNote || '',
          };
        });
        return nextDrafts;
      });
    } catch (error) {
      toast.error(error.response?.data?.message || (isEnglish ? 'Cannot load contact messages' : 'Không thể tải liên hệ'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMessages(1);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadMessages(1);
  };

  const handleSave = async (id) => {
    try {
      await adminContactService.updateMessage(id, drafts[id] || {});
      toast.success(isEnglish ? 'Updated successfully' : 'Cập nhật thành công');
      loadMessages(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || (isEnglish ? 'Update failed' : 'Cập nhật thất bại'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(isEnglish ? 'Delete this contact message?' : 'Xóa liên hệ này?')) return;
    try {
      await adminContactService.deleteMessage(id);
      toast.success(isEnglish ? 'Deleted successfully' : 'Xóa thành công');
      const nextPage = items.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page;
      loadMessages(nextPage);
    } catch (error) {
      toast.error(error.response?.data?.message || (isEnglish ? 'Delete failed' : 'Xóa thất bại'));
    }
  };

  const statusLabel = (value) => {
    const item = statusOptions.find((option) => option.value === value);
    return isEnglish ? item?.label.en : item?.label.vi;
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-[#004b38] p-6 text-white shadow-[0_14px_40px_rgba(1,56,42,0.28)]">
        <p className="text-xs uppercase tracking-[0.18em] text-[#9ed3c3]">{isEnglish ? 'Admin Contact' : 'Quản trị liên hệ'}</p>
        <h1 className="mt-2 text-4xl font-black">{isEnglish ? 'Support inbox' : 'Hộp thư hỗ trợ'}</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#cfe9df]">
          {isEnglish
            ? 'View, update status, add internal notes and manage all messages sent by users.'
            : 'Xem, cập nhật trạng thái, thêm ghi chú nội bộ và quản lý toàn bộ tin nhắn từ người dùng.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-[#FFFCF5] p-4 shadow-sm dark:bg-[#171a21]"><div className="text-xs uppercase text-[#718096]">{isEnglish ? 'New' : 'Mới'}</div><div className="mt-2 text-3xl font-black">{summary.new}</div></div>
        <div className="rounded-2xl bg-[#FFFCF5] p-4 shadow-sm dark:bg-[#171a21]"><div className="text-xs uppercase text-[#718096]">{isEnglish ? 'Read' : 'Đã đọc'}</div><div className="mt-2 text-3xl font-black">{summary.read}</div></div>
        <div className="rounded-2xl bg-[#FFFCF5] p-4 shadow-sm dark:bg-[#171a21]"><div className="text-xs uppercase text-[#718096]">{isEnglish ? 'Replied' : 'Đã phản hồi'}</div><div className="mt-2 text-3xl font-black">{summary.replied}</div></div>
      </div>

      <div className="rounded-2xl bg-[#FFFCF5] p-4 shadow-sm dark:bg-[#171a21]">
        <form onSubmit={handleSearch} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isEnglish ? 'Search name, email, subject...' : 'Tìm theo tên, email, tiêu đề...'}
            className="rounded-xl border border-[#d8dde5] bg-[#FFFCF5] dark:bg-[#171a21] px-3 py-2 text-sm outline-none focus:border-[#6aa386]"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-[#d8dde5] bg-[#FFFCF5] dark:bg-[#171a21] px-3 py-2 text-sm outline-none focus:border-[#6aa386]"
          >
            <option value="">{isEnglish ? 'All statuses' : 'Tất cả trạng thái'}</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{statusLabel(option.value)}</option>
            ))}
          </select>
        </form>
      </div>

      <div className="rounded-2xl bg-[#FFFCF5] shadow-sm dark:bg-[#171a21] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#FFFCF5] text-left text-xs uppercase tracking-wide text-[#728095]">
                <th className="px-4 py-3">{isEnglish ? 'Sender' : 'Người gửi'}</th>
                <th className="px-4 py-3">{isEnglish ? 'Subject' : 'Tiêu đề'}</th>
                <th className="px-4 py-3">{isEnglish ? 'Message' : 'Nội dung'}</th>
                <th className="px-4 py-3">{isEnglish ? 'Status' : 'Trạng thái'}</th>
                <th className="px-4 py-3">{isEnglish ? 'Internal note' : 'Ghi chú nội bộ'}</th>
                <th className="px-4 py-3 text-right">{isEnglish ? 'Actions' : 'Thao tác'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-6 text-center text-[#7b8798]" colSpan={6}>{isEnglish ? 'Loading...' : 'Đang tải...'}</td></tr>
              ) : items.length === 0 ? (
                <tr><td className="px-4 py-6 text-center text-[#7b8798]" colSpan={6}>{isEnglish ? 'No contact messages found' : 'Không có liên hệ nào'}</td></tr>
              ) : items.map((item) => {
                const draft = drafts[item.id] || { status: item.status, adminNote: item.adminNote || '' };
                return (
                  <tr key={item.id} className="border-t border-[#edf1f5] align-top">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#1f2a38]">{item.name}</div>
                      <div className="text-xs text-[#6f7f92]">{item.email}</div>
                      <div className="text-xs text-[#98a2b3]">{new Date(item.createdAt).toLocaleString(isEnglish ? 'en-US' : 'vi-VN')}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#24374f]">{item.subject}</td>
                    <td className="px-4 py-3 text-[#4b5f77] max-w-[420px] whitespace-pre-wrap">{item.message}</td>
                    <td className="px-4 py-3">
                      <select
                        value={draft.status}
                        onChange={(e) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, status: e.target.value } }))}
                        className="w-full rounded-lg border border-[#d8dde5] bg-[#FFFCF5] dark:bg-[#171a21] px-2 py-1 text-xs outline-none focus:border-[#6aa386]"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>{statusLabel(option.value)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <textarea
                        value={draft.adminNote}
                        onChange={(e) => setDrafts((current) => ({ ...current, [item.id]: { ...draft, adminNote: e.target.value } }))}
                        rows={3}
                        className="w-full rounded-lg border border-[#d8dde5] bg-[#FFFCF5] dark:bg-[#171a21] px-2 py-1 text-xs outline-none focus:border-[#6aa386]"
                        placeholder={isEnglish ? 'Add internal note...' : 'Thêm ghi chú nội bộ...'}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleSave(item.id)} className="inline-flex items-center gap-1 rounded-md border border-[#d8dde5] px-2.5 py-1.5 text-xs font-semibold text-[#245341] hover:bg-[#edf5f1]">
                          <FiSave size={13} /> {isEnglish ? 'Save' : 'Lưu'}
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                          <FiTrash2 size={13} /> {isEnglish ? 'Delete' : 'Xóa'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pagination.total > 0 && (
          <div className="px-4 pb-3">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => loadMessages(p)}
              itemsPerPage={pagination.limit}
              onItemsPerPageChange={(l) => loadMessages(1, l)}
              totalItems={pagination.total}
              showItemsPerPageSelector={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContacts;
