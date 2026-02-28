/**
 * tests/components/CurrencyInput.test.jsx
 * Kiểm thử hiển thị, format số và gọi onChange đúng
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import CurrencyInput from '../../components/CurrencyInput';

const renderInput = (props = {}) => {
  const defaults = { value: '', onChange: vi.fn(), ...props };
  return { ...render(<CurrencyInput {...defaults} />), onChange: defaults.onChange };
};

// ─── Render ───────────────────────────────────────────────────────────────────

describe('CurrencyInput — render', () => {
  it('Render input element', () => {
    renderInput();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('Hiển thị placeholder mặc định "0"', () => {
    renderInput();
    expect(screen.getByPlaceholderText('0')).toBeInTheDocument();
  });

  it('Hiển thị placeholder tùy chỉnh', () => {
    renderInput({ placeholder: 'Nhập số tiền' });
    expect(screen.getByPlaceholderText('Nhập số tiền')).toBeInTheDocument();
  });

  it('inputMode là "numeric"', () => {
    renderInput();
    expect(screen.getByRole('textbox')).toHaveAttribute('inputmode', 'numeric');
  });
});

// ─── Format giá trị ───────────────────────────────────────────────────────────

describe('CurrencyInput — format giá trị', () => {
  it('value=0 → hiển thị "0"', () => {
    renderInput({ value: 0 });
    expect(screen.getByDisplayValue('0')).toBeInTheDocument();
  });

  it('value=1000 → hiển thị "1.000"', () => {
    renderInput({ value: 1000 });
    expect(screen.getByDisplayValue('1.000')).toBeInTheDocument();
  });

  it('value=3000000 → hiển thị "3.000.000"', () => {
    renderInput({ value: 3000000 });
    expect(screen.getByDisplayValue('3.000.000')).toBeInTheDocument();
  });

  it('value rỗng → hiển thị rỗng', () => {
    renderInput({ value: '' });
    expect(screen.getByRole('textbox').value).toBe('');
  });

  it('value undefined → hiển thị rỗng', () => {
    renderInput({ value: undefined });
    expect(screen.getByRole('textbox').value).toBe('');
  });
});

// ─── Xử lý nhập liệu ─────────────────────────────────────────────────────────

describe('CurrencyInput — nhập liệu', () => {
  it('Nhập số → onChange gọi với Number', async () => {
    const user = userEvent.setup();
    const { onChange } = renderInput({ value: '' });

    await user.type(screen.getByRole('textbox'), '150000');
    expect(onChange).toHaveBeenCalled();
    // Lần gọi cuối phải là số 150000
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall).toBe(150000);
  });

  it('Xóa hết → onChange gọi với chuỗi rỗng ""', async () => {
    const user = userEvent.setup();
    const { onChange } = renderInput({ value: 5000 });

    const input = screen.getByRole('textbox');
    await user.clear(input);

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall).toBe('');
  });

  it('Nhập chữ cái → bị lọc bỏ, onChange không gọi với chữ', async () => {
    const user = userEvent.setup();
    const { onChange } = renderInput({ value: '' });

    await user.type(screen.getByRole('textbox'), 'abc');
    // onChange được gọi nhưng giá trị trả về là '' (không có số)
    onChange.mock.calls.forEach(([val]) => {
      expect(typeof val === 'number' || val === '').toBe(true);
    });
  });
});

// ─── Sync value từ bên ngoài ─────────────────────────────────────────────────

describe('CurrencyInput — sync value', () => {
  it('Khi value thay đổi từ props → display cập nhật', () => {
    const { rerender } = render(<CurrencyInput value={1000} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('1.000')).toBeInTheDocument();

    rerender(<CurrencyInput value={5000000} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('5.000.000')).toBeInTheDocument();
  });
});

// ─── Error state ──────────────────────────────────────────────────────────────

describe('CurrencyInput — trạng thái lỗi', () => {
  it('error=true → có class border-red-500', () => {
    renderInput({ error: true });
    expect(screen.getByRole('textbox').className).toContain('border-red-500');
  });

  it('error=false → không có class border-red-500', () => {
    renderInput({ error: false });
    expect(screen.getByRole('textbox').className).not.toContain('border-red-500');
  });
});
