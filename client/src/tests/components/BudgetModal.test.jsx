/**
 * tests/components/BudgetModal.test.jsx
 * Kiểm thử giao diện và validation của BudgetModal
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import BudgetModal from '../../components/BudgetModal';

// ─── Mock contexts ────────────────────────────────────────────────────────────

const mockFetchCategories = vi.fn();

vi.mock('../../context/CategoryContext', () => ({
  useCategories: () => ({
    categories: [
      { _id: 'c1', name: 'Ăn uống',  type: 'expense', icon: '🍔' },
      { _id: 'c2', name: 'Di chuyển', type: 'expense', icon: '🚗' },
      { _id: 'c3', name: 'Lương',     type: 'income',  icon: '💰' },
    ],
    fetchCategories: mockFetchCategories,
  }),
}));

// ─── Helper ───────────────────────────────────────────────────────────────────

const renderModal = (props = {}) => {
  const defaultProps = {
    onClose: vi.fn(),
    onSave: vi.fn(),
    budget: null,
    ...props,
  };
  return render(<BudgetModal {...defaultProps} />);
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BudgetModal — render', () => {
  beforeEach(() => vi.clearAllMocks());

  it('Render modal với form đầy đủ', () => {
    renderModal();
    // Phải có nút Lưu
    expect(screen.getByRole('button', { name: /lưu|save|tạo|thêm/i })).toBeInTheDocument();
  });

  it('Fetch categories khi mount', () => {
    renderModal();
    expect(mockFetchCategories).toHaveBeenCalled();
  });

  it('Default period là "monthly"', () => {
    renderModal();
    const select = screen.getAllByRole('combobox')
      .find(s => s.value === 'monthly');
    expect(select).toBeTruthy();
  });
});

describe('BudgetModal — validation', () => {
  it('Hiển thị lỗi khi submit không có amount', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    renderModal({ onSave });

    const submitBtn = screen.getByRole('button', { name: /lưu|save|tạo|thêm/i });
    await user.click(submitBtn);

    // Phải hiện lỗi validation
    await waitFor(() => {
      const errorText = document.body.textContent;
      expect(
        errorText.includes('hợp lệ') ||
        errorText.includes('bắt buộc') ||
        errorText.includes('nhập') ||
        errorText.includes('số tiền')
      ).toBe(true);
    });

    // onSave không được gọi
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe('BudgetModal — sửa ngân sách', () => {
  const existingBudget = {
    _id: 'b1',
    categoryName: 'Ăn uống',
    amount: 3000000,
    period: 'monthly',
    alertThresholds: [80, 100],
    notificationEnabled: true,
    rolloverEnabled: false,
  };

  it('Điền sẵn dữ liệu khi chỉnh sửa', () => {
    renderModal({ budget: existingBudget });
    // CurrencyInput format số theo vi-VN: 3000000 → "3.000.000"
    // Dùng getByDisplayValue để tìm input có giá trị hiển thị đó
    const amountInput = screen.getByDisplayValue('3.000.000');
    expect(amountInput).toBeInTheDocument();
  });

  it('Select đúng period khi có budget', () => {
    renderModal({ budget: existingBudget });
    const monthlySelect = screen.getAllByRole('combobox')
      .find(s => s.value === 'monthly');
    expect(monthlySelect).toBeTruthy();
  });
});
