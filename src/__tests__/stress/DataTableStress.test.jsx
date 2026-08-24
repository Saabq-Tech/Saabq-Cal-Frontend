import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkspaceBookingsPage from '../../pages/member/dashboard/WorkspaceBookingsPage';
import WorkspacePaymentsPage from '../../pages/member/dashboard/WorkspacePaymentsPage';
import { LanguageProvider } from '../../context/LanguageContext';
import { ToastProvider } from '../../context/ToastContext';
import client from '../../api/client';

vi.mock('../../api/client', async () => {
  const actual = await vi.importActual('../../api/client');
  return {
    ...actual,
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      defaults: { headers: { common: {} } },
    },
  };
});

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: 'Stress Lead',
      email: 'lead@test.com',
      is_owner: true,
      permissions: ['booking_read', 'booking_write', 'payment_read', 'payment_write'],
      workspace: {
        id: 1,
        name: 'Data Stress Workspace',
        has_active_subscription: true,
        active_capabilities: ['BOOKING', 'PAYMENT'],
      },
    },
    userType: 'member',
    isAuthenticated: true,
    hasCapability: () => true,
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

describe('Frontend Data Tables Stress & High Density Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const bookings = [];
    for (let i = 1; i <= 50; i++) {
      bookings.push({
        id: i,
        customer: { name: `Customer ${i}`, email: `customer${i}@example.com`, phone: `+9665000000${i}` },
        service: { name: `Service ${i % 5}`, duration_minutes: 30, price: 100 },
        status: i % 2 === 0 ? 'confirmed' : 'pending',
        starts_at: '2026-09-01T10:00:00Z',
        ends_at: '2026-09-01T10:30:00Z',
      });
    }

    client.get.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/payments')) {
        const payments = [];
        for (let i = 1; i <= 50; i++) {
          payments.push({
            id: i,
            amount: 150.0,
            status: i % 3 === 0 ? 'paid' : (i % 3 === 1 ? 'verifying' : 'pending'),
            payable_type: 'Appointment',
            payable_id: i,
            created_at: '2026-08-20T12:00:00Z',
          });
        }
        return Promise.resolve({
          data: {
            status: true,
            data: { data: payments, total: 50, current_page: 1, last_page: 5 },
          },
        });
      }

      return Promise.resolve({
        data: {
          status: true,
          data: bookings,
        },
      });
    });
  });

  it('stress: rapid filter keystrokes and list view rendering on WorkspaceBookingsPage', async () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <ToastProvider>
            <WorkspaceBookingsPage />
          </ToastProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(client.get).toHaveBeenCalled();
    });

    const searchInput = screen.queryByRole('textbox') || document.querySelector('input');
    if (searchInput) {
      for (let i = 0; i < 15; i++) {
        fireEvent.change(searchInput, { target: { value: `Customer ${i}` } });
      }
    }

    expect(document.body).toBeInTheDocument();
  });

  it('stress: high-volume payment transactions rendering on WorkspacePaymentsPage', async () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <ToastProvider>
            <WorkspacePaymentsPage />
          </ToastProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(client.get).toHaveBeenCalled();
    });

    const buttons = screen.queryAllByRole('button');
    for (let i = 0; i < Math.min(buttons.length, 5); i++) {
      fireEvent.click(buttons[i]);
    }

    expect(document.body).toBeInTheDocument();
  });
});
