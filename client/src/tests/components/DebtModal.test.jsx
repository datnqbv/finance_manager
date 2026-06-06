/**
 * tests/components/DebtModal.test.jsx
 * Kiểm thử render, validation và chỉnh sửa khoản nợ
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import DebtModal from '../../components/DebtModal';

const renderModal = (props = {}) => {
  const defaults = {
    debt: null,
    onClose: vi.fn(),
    onSave: vi.fn(),
    ...props,
  };
  return { ...render(<DebtModal {...defaults} />), ...defaults };
};

// ─── Render ───────────────────────────────────────────────────────────────────

describe('DebtModal — render', () => {
  it('Render modal và có nút Lưu', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /lưu|save|thêm|tạo/i })).toBeInTheDocument();
  });

  it('Title "Thêm khoản nợ" khi tạo mới', () => {
    renderModal();
    expect(screen.getByText(/thêm khoản nợ/i)).toBeInTheDocument();
  });

  it('Title "Sửa khoản nợ" khi chỉnh sửa', () => {
    renderModal({
      debt: { id: 'd1', type: 'borrow', personName: 'Nguyễn A', amount: 500000, description: '' }
    });
    expect(screen.getByText(/sửa khoản nợ/i)).toBeInTheDocument();
  });

  it('Có 2 loại: "Tôi đang vay" và "Tôi cho vay"', () => {
    renderModal();
    expect(screen.getByText(/tôi đang vay/i)).toBeInTheDocument();
    expect(screen.getByText(/tôi cho vay/i)).toBeInTheDocument();
  });

  it('Mặc định chọn loại "borrow" (Tôi đang vay)', () => {
    renderModal();
    const borrowBtn = screen.getByText(/tôi đang vay/i).closest('button');
    expect(borrowBtn).not.toBeNull();
    // button borrow được active (có class border-red-400 hoặc tương tự)
    expect(borrowBtn?.className).toMatch(/red|rose|active|border-opacity-100/);
  });
});

// ─── Validation ───────────────────────────────────────────────────────────────

describe('DebtModal — validation', () => {
  it('Không nhập tên → hiện lỗi', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    renderModal({ onSave });

    await user.click(screen.getByRole('button', { name: /lưu|save|thêm|tạo/i }));

    await waitFor(() => {
      expect(document.body.textContent).toMatch(/vui lòng nhập|tên|bắt buộc/i);
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('Không nhập amount → hiện lỗi', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    renderModal({ onSave });

    // Placeholder thực tế là "Nhập tên..."
    const nameInput = screen.getByPlaceholderText('Nhập tên...');
    await user.type(nameInput, 'Nguyễn A');

    await user.click(screen.getByRole('button', { name: /lưu|save|thêm|tạo/i }));

    await waitFor(() => {
      expect(document.body.textContent).toMatch(/số tiền|amount|hợp lệ/i);
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('Nhập đủ tên và amount → onSave được gọi', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue({ success: true });
    renderModal({ onSave });

    // personName placeholder là "Nhập tên..."
    const nameInput = screen.getByPlaceholderText('Nhập tên...');
    await user.type(nameInput, 'Trần B');

    // CurrencyInput - inputmode="numeric", placeholder="0"
    const amountInput = screen.getAllByRole('textbox').find(i => i.getAttribute('inputmode') === 'numeric');
    if (amountInput) await user.type(amountInput, '300000');

    await user.click(screen.getByRole('button', { name: /lưu|save|thêm|tạo/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ personName: 'Trần B', amount: 300000 })
      );
    });
  });
});

// ─── Chỉnh sửa ────────────────────────────────────────────────────────────────

describe('DebtModal — chỉnh sửa', () => {
  const existing = {
    id: 'd1',
    type: 'lend',
    personName: 'Nguyễn Văn C',
    amount: 1000000,
    description: 'Mượn tiền',
    dueDate: '2026-03-01T00:00:00.000Z',
  };

  it('Điền sẵn personName', () => {
    renderModal({ debt: existing });
    expect(screen.getByDisplayValue('Nguyễn Văn C')).toBeInTheDocument();
  });

  it('Điền sẵn amount (format vi-VN)', () => {
    renderModal({ debt: existing });
    expect(screen.getByDisplayValue('1.000.000')).toBeInTheDocument();
  });

  it('Nút loại bị disabled khi đang sửa', () => {
    renderModal({ debt: existing });
    const borrowBtn = screen.getByText(/tôi đang vay/i).closest('button');
    const lendBtn = screen.getByText(/tôi cho vay/i).closest('button');
    expect(borrowBtn).toBeDisabled();
    expect(lendBtn).toBeDisabled();
  });
});
