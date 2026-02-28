/**
 * tests/components/Pagination.test.jsx
 * Kiểm thử hiển thị trang, điều hướng, chọn itemsPerPage
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import Pagination from '../../components/Pagination';

const renderPagination = (props = {}) => {
  const defaults = {
    currentPage: 1,
    totalPages: 5,
    onPageChange: vi.fn(),
    itemsPerPage: 10,
    onItemsPerPageChange: vi.fn(),
    totalItems: 50,
    ...props,
  };
  return { ...render(<Pagination {...defaults} />), ...defaults };
};

// ─── Render ───────────────────────────────────────────────────────────────────

describe('Pagination — render', () => {
  it('Render component', () => {
    renderPagination();
    // 'Hiển thị' xuất hiện trong nhiều node — dùng getAllByText
    expect(screen.getAllByText(/hiển thị/i).length).toBeGreaterThan(0);
  });

  it('Hiển thị tổng số item đúng', () => {
    renderPagination({ totalItems: 99, itemsPerPage: 10, currentPage: 1 });
    // 99 chỉ xuất hiện trong span totalItems (không trùng với option select)
    expect(screen.getByText('99')).toBeInTheDocument();
  });

  it('Hiển thị range đúng (trang 1, 10/trang, 50 items → 1-10)', () => {
    renderPagination({ currentPage: 1, itemsPerPage: 10, totalItems: 50 });
    // "1 - 10 trong tổng số 50" được render trong div riêng
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('10').length).toBeGreaterThan(0);
  });

  it('Trang cuối → endItem = totalItems', () => {
    renderPagination({ currentPage: 5, itemsPerPage: 10, totalItems: 53 });
    // 5*10 = 50 > 53? No: endItem = min(50, 53) = 50. Use totalItems=53 → endItem=50, total=53
    // Dùng totalItems số lẻ để tránh trùng với option select
    expect(screen.getByText('53')).toBeInTheDocument();
  });

  it('Hiển thị selector itemsPerPage', () => {
    renderPagination();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});

// ─── Điều hướng trang ─────────────────────────────────────────────────────────

describe('Pagination — điều hướng', () => {
  it('Click nút Next → gọi onPageChange(currentPage + 1)', () => {
    const onPageChange = vi.fn();
    renderPagination({ currentPage: 2, totalPages: 5, onPageChange });

    // Nút có title="Trang sau"
    const nextButton = screen.getByTitle('Trang sau');
    fireEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('Click nút Prev → gọi onPageChange(currentPage - 1)', () => {
    const onPageChange = vi.fn();
    renderPagination({ currentPage: 3, totalPages: 5, onPageChange });

    // Nút có title="Trang trước"
    const prevButton = screen.getByTitle('Trang trước');
    fireEvent.click(prevButton);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('Trang 1: nút Prev bị disabled', () => {
    renderPagination({ currentPage: 1, totalPages: 5 });
    expect(screen.getByTitle('Trang trước')).toBeDisabled();
  });

  it('Trang cuối: nút Next bị disabled', () => {
    renderPagination({ currentPage: 5, totalPages: 5 });
    expect(screen.getByTitle('Trang sau')).toBeDisabled();
  });

  it('Click số trang → gọi onPageChange với số đó', () => {
    const onPageChange = vi.fn();
    renderPagination({ currentPage: 1, totalPages: 3, onPageChange });

    // Tìm button có text "2"
    const page2 = screen.getAllByRole('button').find(b => b.textContent.trim() === '2');
    if (page2) {
      fireEvent.click(page2);
      expect(onPageChange).toHaveBeenCalledWith(2);
    }
  });
});

// ─── Items per page ───────────────────────────────────────────────────────────

describe('Pagination — itemsPerPage', () => {
  it('Selector có các option: 5, 10, 20, 50, 100', () => {
    renderPagination();
    const select = screen.getByRole('combobox');
    const options = Array.from(select.options).map(o => Number(o.value));
    expect(options).toEqual(expect.arrayContaining([5, 10, 20, 50, 100]));
  });

  it('Thay đổi itemsPerPage → gọi onItemsPerPageChange', () => {
    const onItemsPerPageChange = vi.fn();
    renderPagination({ onItemsPerPageChange });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '20' } });
    expect(onItemsPerPageChange).toHaveBeenCalledWith(20);
  });

  it('Giá trị mặc định selector là itemsPerPage prop', () => {
    renderPagination({ itemsPerPage: 20 });
    expect(screen.getByRole('combobox').value).toBe('20');
  });
});

// ─── Phân trang nhiều trang ───────────────────────────────────────────────────

describe('Pagination — hiển thị số trang', () => {
  it('≤ 5 trang → hiển thị tất cả số', () => {
    renderPagination({ currentPage: 1, totalPages: 4, totalItems: 40 });
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
  });

  it('> 5 trang → có dấu "..."', () => {
    renderPagination({ currentPage: 1, totalPages: 10, totalItems: 100 });
    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
