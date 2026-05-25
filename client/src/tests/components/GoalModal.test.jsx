/**
 * tests/components/GoalModal.test.jsx
 * Kiểm thử render, validation và chỉnh sửa mục tiêu tiết kiệm
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import GoalModal from '../../components/GoalModal';

const renderModal = (props = {}) => {
  const defaults = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    goal: null,
    ...props,
  };
  return { ...render(<GoalModal {...defaults} />), ...defaults };
};

// ─── Render ───────────────────────────────────────────────────────────────────

describe('GoalModal — render', () => {
  it('Không render khi isOpen=false', () => {
    const { container } = renderModal({ isOpen: false });
    expect(container.firstChild).toBeNull();
  });

  it('Render form khi isOpen=true', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /tạo|lưu|save|thêm/i })).toBeInTheDocument();
  });

  it('Title "Tạo mục tiêu mới" khi không có goal', () => {
    renderModal();
    expect(document.body.textContent).toMatch(/tạo mục tiêu|thêm mục tiêu/i);
  });

  it('Title "Chỉnh sửa" khi có goal', () => {
    renderModal({
      goal: {
        id: 'g1', name: 'Mua xe', targetAmount: 30000000,
        currentAmount: 0, deadline: '2027-01-01', priority: 'high',
        icon: '🚗', color: '#3b82f6',
      },
    });
    expect(document.body.textContent).toMatch(/sửa|chỉnh sửa|cập nhật/i);
  });

  it('Có selector priority (Thấp / Trung bình / Cao)', () => {
    renderModal();
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);
  });

  it('Có các icon option để chọn', () => {
    renderModal();
    expect(document.body.textContent).toContain('🎯');
  });
});

// ─── Validation ───────────────────────────────────────────────────────────────

describe('GoalModal — validation', () => {
  it('Submit thiếu tên → hiện lỗi, không gọi onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderModal({ onSubmit });

    await user.click(screen.getByRole('button', { name: /tạo|lưu|save|thêm/i }));

    await waitFor(() => {
      expect(document.body.textContent).toMatch(/tên mục tiêu|bắt buộc|vui lòng/i);
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('Submit thiếu targetAmount → hiện lỗi', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderModal({ onSubmit });

    const inputs = screen.getAllByRole('textbox');
    const nameInput = inputs.find(i => i.getAttribute('inputmode') !== 'numeric');
    if (nameInput) await user.type(nameInput, 'Mua xe');

    await user.click(screen.getByRole('button', { name: /tạo|lưu|save|thêm/i }));

    await waitFor(() => {
      expect(document.body.textContent).toMatch(/số tiền|mục tiêu|lớn hơn 0/i);
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('Nhập đủ tên, targetAmount và deadline → onSubmit được gọi', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({});
    renderModal({ onSubmit });

    // Điền tên - dùng placeholder chính xác để tránh match với textarea description
    const nameInput = screen.getByPlaceholderText('VD: Quỹ khẩn cấp, Du lịch, Mua xe...');
    await user.type(nameInput, 'Mua xe máy');

    // Điền targetAmount (CurrencyInput — inputmode="numeric")
    const numericInputs = screen.getAllByRole('textbox').filter(i => i.getAttribute('inputmode') === 'numeric');
    if (numericInputs[0]) await user.type(numericInputs[0], '30000000');

    // Điền deadline (input type=date)
    const dateInput = document.querySelector('input[type="date"][name="deadline"]') ||
      document.querySelector('input[type="date"]');
    if (dateInput) fireEvent.change(dateInput, { target: { value: '2027-12-31' } });

    await user.click(screen.getByRole('button', { name: /tạo|lưu|save|thêm/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Mua xe máy' })
      );
    });
  });
});

// ─── Chỉnh sửa ────────────────────────────────────────────────────────────────

describe('GoalModal — chỉnh sửa', () => {
  const existing = {
    id: 'g1',
    name: 'Du lịch Nhật Bản',
    description: 'Tiết kiệm đi Nhật',
    targetAmount: 50000000,
    currentAmount: 5000000,
    deadline: '2027-06-01T00:00:00.000Z',
    priority: 'high',
    icon: '✈️',
    color: '#10b981',
  };

  it('Điền sẵn tên goal', () => {
    renderModal({ goal: existing });
    expect(screen.getByDisplayValue('Du lịch Nhật Bản')).toBeInTheDocument();
  });

  it('Điền sẵn targetAmount (format)', () => {
    renderModal({ goal: existing });
    expect(screen.getByDisplayValue('50.000.000')).toBeInTheDocument();
  });

  it('Điền sẵn currentAmount', () => {
    renderModal({ goal: existing });
    expect(screen.getByDisplayValue('5.000.000')).toBeInTheDocument();
  });

  it('Reset form khi isOpen thay đổi (tạo mới sau sửa)', () => {
    const { rerender } = renderModal({ goal: existing });
    expect(screen.getByDisplayValue('Du lịch Nhật Bản')).toBeInTheDocument();

    rerender(<GoalModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} goal={null} />);

    const nameInput = screen.getAllByRole('textbox').find(i => i.getAttribute('inputmode') !== 'numeric');
    expect(nameInput?.value ?? '').toBe('');
  });
});
