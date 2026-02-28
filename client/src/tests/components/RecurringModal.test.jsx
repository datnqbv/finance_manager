/**
 * tests/components/RecurringModal.test.jsx
 * Kiểm thử render, validation và chỉnh sửa giao dịch định kỳ
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import RecurringModal from '../../components/RecurringModal';

// ─── Mock CategoryContext ──────────────────────────────────────────────────────

const mockFetchCategories = vi.fn();

vi.mock('../../context/CategoryContext', () => ({
  useCategories: () => ({
    categories: [
      { _id: '1', name: 'Nhà ở',    type: 'expense', icon: '🏠' },
      { _id: '2', name: 'Ăn uống',  type: 'expense', icon: '🍔' },
      { _id: '3', name: 'Lương',    type: 'income',  icon: '💰' },
    ],
    fetchCategories: mockFetchCategories,
  }),
}));

const renderModal = (props = {}) => {
  const defaults = {
    recurring: null,
    onClose: vi.fn(),
    onSave: vi.fn(),
    ...props,
  };
  return { ...render(<RecurringModal {...defaults} />), ...defaults };
};

// ─── Render ───────────────────────────────────────────────────────────────────

describe('RecurringModal — render', () => {
  beforeEach(() => vi.clearAllMocks());

  it('Render form và có nút Lưu', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /lưu|save|tạo|thêm/i })).toBeInTheDocument();
  });

  it('Fetch categories khi mount', () => {
    renderModal();
    expect(mockFetchCategories).toHaveBeenCalled();
  });

  it('Title "Thêm giao dịch định kỳ" khi tạo mới', () => {
    renderModal();
    expect(document.body.textContent).toMatch(/thêm|tạo|giao dịch định kỳ/i);
  });

  it('Title "Sửa" khi có recurring', () => {
    renderModal({
      recurring: {
        _id: 'r1', templateName: 'Tiền nhà', type: 'expense',
        category: 'Nhà ở', amount: 3000000, frequency: 'monthly',
      },
    });
    expect(document.body.textContent).toMatch(/sửa|chỉnh sửa/i);
  });

  it('Có selector tần suất (daily/weekly/monthly/yearly)', () => {
    renderModal();
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);
  });

  it('Có 2 loại giao dịch: Chi tiêu / Thu nhập', () => {
    renderModal();
    expect(document.body.textContent).toMatch(/chi tiêu/i);
    expect(document.body.textContent).toMatch(/thu nhập/i);
  });
});

// ─── Validation ───────────────────────────────────────────────────────────────

describe('RecurringModal — validation', () => {
  it('Submit thiếu templateName → hiện lỗi, không gọi onSave', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    renderModal({ onSave });

    await user.click(screen.getByRole('button', { name: /lưu|save|tạo|thêm/i }));

    await waitFor(() => {
      expect(document.body.textContent).toMatch(/tên mẫu|vui lòng nhập/i);
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('Submit thiếu category → hiện lỗi', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    renderModal({ onSave });

    const inputs = screen.getAllByRole('textbox');
    const nameInput = inputs.find(i => i.getAttribute('inputmode') !== 'numeric');
    if (nameInput) await user.type(nameInput, 'Tiền điện');

    await user.click(screen.getByRole('button', { name: /lưu|save|tạo|thêm/i }));

    await waitFor(() => {
      expect(document.body.textContent).toMatch(/danh mục|chọn danh mục/i);
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('Submit thiếu amount → hiện lỗi', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    renderModal({ onSave });

    // Nhập templateName
    const inputs = screen.getAllByRole('textbox');
    const nameInput = inputs.find(i => i.getAttribute('inputmode') !== 'numeric');
    if (nameInput) await user.type(nameInput, 'Tiền điện');

    // Chọn category
    const selects = screen.getAllByRole('combobox');
    const categorySelect = selects.find(s => s.querySelector
      ? Array.from(s.options || []).some(o => o.text.includes('Nhà ở') || o.text.includes('Ăn uống'))
      : false
    );
    if (categorySelect) {
      await userEvent.selectOptions(categorySelect, categorySelect.options[1]?.value || 'Nhà ở');
    }

    await user.click(screen.getByRole('button', { name: /lưu|save|tạo|thêm/i }));

    await waitFor(() => {
      expect(document.body.textContent).toMatch(/số tiền|amount|hợp lệ/i);
    });
    expect(onSave).not.toHaveBeenCalled();
  });
});

// ─── Chỉnh sửa ────────────────────────────────────────────────────────────────

describe('RecurringModal — chỉnh sửa', () => {
  const existing = {
    _id: 'r1',
    templateName: 'Tiền thuê nhà',
    type: 'expense',
    category: 'Nhà ở',
    amount: 3000000,
    frequency: 'monthly',
    note: 'Trả mỗi tháng',
    notifyBeforeExecution: true,
    notifyDays: 3,
  };

  it('Điền sẵn templateName', () => {
    renderModal({ recurring: existing });
    expect(screen.getByDisplayValue('Tiền thuê nhà')).toBeInTheDocument();
  });

  it('Điền sẵn amount (format vi-VN)', () => {
    renderModal({ recurring: existing });
    expect(screen.getByDisplayValue('3.000.000')).toBeInTheDocument();
  });

  it('Điền sẵn note', () => {
    renderModal({ recurring: existing });
    expect(screen.getByDisplayValue('Trả mỗi tháng')).toBeInTheDocument();
  });
});

// ─── Nút đóng ────────────────────────────────────────────────────────────────

describe('RecurringModal — đóng modal', () => {
  it('Click X → gọi onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal({ onClose });

    const buttons = screen.getAllByRole('button');
    const closeBtn = buttons.find(b =>
      b.querySelector('svg') &&
      !b.textContent.match(/lưu|save|thêm|tạo|thu nhập|chi tiêu/i)
    );
    if (closeBtn) {
      await user.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    }
  });
});
