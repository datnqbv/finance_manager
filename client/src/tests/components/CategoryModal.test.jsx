/**
 * tests/components/CategoryModal.test.jsx
 * Kiểm thử render, validation và chỉnh sửa danh mục
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import CategoryModal from '../../components/CategoryModal';

const renderModal = (props = {}) => {
  const defaults = {
    category: null,
    onClose: vi.fn(),
    onSave: vi.fn(),
    ...props,
  };
  return { ...render(<CategoryModal {...defaults} />), ...defaults };
};

// ─── Render ───────────────────────────────────────────────────────────────────

describe('CategoryModal — render', () => {
  it('Render modal khi mở', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /lưu|save|tạo|thêm/i })).toBeInTheDocument();
  });

  it('Title "Thêm danh mục" khi tạo mới', () => {
    renderModal();
    expect(document.body.textContent).toMatch(/thêm danh mục|tạo danh mục/i);
  });

  it('Title "Sửa danh mục" khi chỉnh sửa', () => {
    renderModal({ category: { id: 'c1', name: 'Ăn uống', type: 'expense', icon: '🍔', color: '#3B82F6' } });
    expect(document.body.textContent).toMatch(/sửa danh mục|chỉnh sửa/i);
  });

  it('Có nút đóng (X)', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    const buttons = screen.getAllByRole('button');
    const closeBtn = buttons.find(b =>
      b.querySelector('svg') &&
      !b.textContent.match(/lưu|save|thêm|tạo/i)
    );
    expect(closeBtn).toBeDefined();
  });

  it('Có selector type (Chi tiêu / Thu nhập)', () => {
    renderModal();
    expect(document.body.textContent).toMatch(/chi tiêu|thu nhập/i);
  });
});

// ─── Validation ───────────────────────────────────────────────────────────────

describe('CategoryModal — validation', () => {
  it('Submit không có tên → hiện lỗi, không gọi onSave', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    renderModal({ onSave });

    await user.click(screen.getByRole('button', { name: /lưu|save|tạo|thêm/i }));

    await waitFor(() => {
      expect(document.body.textContent).toMatch(/vui lòng nhập|bắt buộc|tên danh mục/i);
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('Tên quá 50 ký tự → hiện lỗi', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    renderModal({ onSave });

    // Form có 2 textbox: name + color hex. Tìm qua placeholder.
    const input = screen.getByPlaceholderText(/Ví dụ.*Ăn uống/i);
    // Dùng fireEvent.change để bypass maxLength={50} của DOM
    fireEvent.change(input, { target: { value: 'a'.repeat(51) } });
    await user.click(screen.getByRole('button', { name: /lưu|save|tạo|thêm/i }));

    await waitFor(() => {
      expect(document.body.textContent).toMatch(/50 ký tự|quá dài/i);
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('Nhập tên hợp lệ → onSave được gọi', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue({});
    renderModal({ onSave });

    const input = screen.getByPlaceholderText(/Ví dụ.*Ăn uống/i);
    await user.type(input, 'Danh mục test');
    await user.click(screen.getByRole('button', { name: /lưu|save|tạo|thêm/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Danh mục test' })
      );
    });
  });
});

// ─── Chỉnh sửa ────────────────────────────────────────────────────────────────

describe('CategoryModal — chỉnh sửa', () => {
  const existing = {
    id: 'c1',
    name: 'Ăn uống',
    icon: '🍔',
    color: '#EF4444',
    type: 'expense',
    order: 1,
  };

  it('Điền sẵn tên khi có category', () => {
    renderModal({ category: existing });
    expect(screen.getByDisplayValue('Ăn uống')).toBeInTheDocument();
  });

  it('Xóa lỗi khi bắt đầu nhập lại', async () => {
    const user = userEvent.setup();
    renderModal();

    // Trigger lỗi trước
    await user.click(screen.getByRole('button', { name: /lưu|save|tạo|thêm/i }));

    await waitFor(() => {
      expect(document.body.textContent).toMatch(/vui lòng nhập/i);
    });

    // Nhập vào thì lỗi biến mất
    const input = screen.getByPlaceholderText(/Ví dụ.*Ăn uống/i);
    await user.type(input, 'Test');

    await waitFor(() => {
      expect(document.body.textContent).not.toMatch(/vui lòng nhập|bắt buộc/i);
    });
  });
});
