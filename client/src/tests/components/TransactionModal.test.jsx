/**
 * tests/components/TransactionModal.test.jsx
 * Kiểm thử giao diện và hành vi của modal thêm/sửa giao dịch
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import TransactionModal from '../../components/TransactionModal';

// ─── Mock contexts & dependencies ─────────────────────────────────────────────

const mockCreateTransaction = vi.fn();
const mockUpdateTransaction = vi.fn();
const mockFetchCategories  = vi.fn();

vi.mock('../../context/TransactionContext', () => ({
  useTransactions: () => ({
    createTransaction: mockCreateTransaction,
    updateTransaction: mockUpdateTransaction,
  }),
}));

vi.mock('../../context/CategoryContext', () => ({
  useCategories: () => ({
    categories: [
      { id: '1', name: 'Ăn uống',   type: 'expense', icon: '🍔' },
      { id: '2', name: 'Lương',      type: 'income',  icon: '💰' },
      { id: '3', name: 'Di chuyển',  type: 'expense', icon: '🚗' },
    ],
    fetchCategories: mockFetchCategories,
  }),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const renderModal = (props = {}) => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    transaction: null,
    ...props,
  };
  return render(<TransactionModal {...defaultProps} />);
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TransactionModal — render', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Không render khi isOpen=false', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('Render form khi isOpen=true', () => {
    const { container } = renderModal();
    // Phải có form và ít nhất 1 input/select
    const form = container.querySelector('form');
    expect(form).not.toBeNull();
    // Phải có 2 button loại giao dịch (Thu nhập / Chi tiêu)
    const typeButtons = screen.getAllByRole('button').filter(b =>
      b.textContent.includes('Thu nhập') || b.textContent.includes('Chi tiêu')
    );
    expect(typeButtons.length).toBe(2);
  });

  it('Fetch categories khi mở modal', () => {
    renderModal({ isOpen: true });
    expect(mockFetchCategories).toHaveBeenCalled();
  });
});

describe('TransactionModal — tạo mới', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateTransaction.mockResolvedValueOnce({ success: true });
  });

  it('Mặc định chọn loại "Chi tiêu"', () => {
    renderModal();
    // Type selector dùng 2 button: "Thu nhập" và "Chi tiêu"
    // Mặc định formData.type = 'expense' → button "Chi tiêu" phải có style active
    const expenseBtn = screen.getAllByRole('button').find(b =>
      b.textContent.trim() === 'Chi tiêu'
    );
    expect(expenseBtn).toBeDefined();
    expect(expenseBtn.className).toContain('bg-rose-600');
    expect(expenseBtn.className).toContain('text-white');
  });

  it('Có nút đóng modal', () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    // Nút đóng dùng icon <FiX> (không có text/aria-label)
    // → tìm button nằm trong header (bên cạnh title)
    const allButtons = screen.getAllByRole('button');
    // Modal có ít nhất 2 button: nút đóng + nút lưu
    expect(allButtons.length).toBeGreaterThanOrEqual(2);
    // Button đóng là button đầu tiên không phải type-select và không phải submit
    const closeBtn = allButtons.find(b => b.getAttribute('type') !== 'submit' &&
      !b.textContent.includes('Thu nhập') && !b.textContent.includes('Chi tiêu') &&
      !b.textContent.includes('Lưu') && !b.textContent.includes('Thêm')
    );
    expect(closeBtn).toBeDefined();
  });

  it('Có nút Lưu', () => {
    renderModal();
    const saveBtn = screen.getByRole('button', { name: /lưu|save|thêm|tạo/i });
    expect(saveBtn).toBeTruthy();
  });
});

describe('TransactionModal — sửa giao dịch', () => {
  const existingTransaction = {
    id: 'tx123',
    type: 'expense',
    category: 'Ăn uống',
    amount: 150000,
    note: 'Cà phê sáng',
    date: '2026-02-15T00:00:00.000Z',
  };

  it('Điền sẵn dữ liệu giao dịch vào form', () => {
    renderModal({ transaction: existingTransaction });

    // Note phải được điền
    expect(screen.getByDisplayValue('Cà phê sáng')).toBeInTheDocument();
  });

  it('Title thay đổi khi ở chế độ chỉnh sửa', () => {
    renderModal({ transaction: existingTransaction });
    // Phải có text "sửa" hoặc "chỉnh sửa" hoặc "cập nhật"
    const heading = document.body.textContent.toLowerCase();
    const isEditMode = heading.includes('sửa') || heading.includes('cập nhật') || heading.includes('chỉnh');
    expect(isEditMode).toBe(true);
  });
});
