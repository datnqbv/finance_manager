/**
 * tests/components/PrivateRoute.test.jsx + PublicRoute.test.jsx
 * Kiểm thử redirect khi đã / chưa đăng nhập
 */
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// ─── Mock AuthContext ──────────────────────────────────────────────────────────

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../components/Layout', () => ({
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));

import { useAuth } from '../../context/AuthContext';
import PrivateRoute from '../../components/PrivateRoute';
import PublicRoute from '../../components/PublicRoute';

// ─── PrivateRoute ─────────────────────────────────────────────────────────────

describe('PrivateRoute', () => {
  it('Đang loading → hiển thị spinner', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, loading: true });

    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );

    // Spinner: có element với class animate-spin
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).not.toBeNull();
  });

  it('Chưa đăng nhập → redirect /login', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, loading: false });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/" element={<PrivateRoute />} />
          <Route path="/dashboard" element={<PrivateRoute />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('Đã đăng nhập → render Layout + Outlet', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, loading: false });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<div>Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });
});

// ─── PublicRoute ──────────────────────────────────────────────────────────────

describe('PublicRoute', () => {
  it('Chưa đăng nhập → redirect /home', () => {
    useAuth.mockReturnValue({ user: null });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<PublicRoute />} />
          <Route path="/home" element={<div>Home Page</div>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('Đã đăng nhập → redirect /dashboard', () => {
    useAuth.mockReturnValue({ user: { id: '1', name: 'Test' } });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<PublicRoute />} />
          <Route path="/home" element={<div>Home Page</div>} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });
});
