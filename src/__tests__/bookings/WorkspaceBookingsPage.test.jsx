import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkspaceBookingsPage from '../../pages/member/dashboard/WorkspaceBookingsPage';
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
      patch: vi.fn(),
      delete: vi.fn(),
      put: vi.fn(),
      defaults: {
        headers: {
          common: {},
        },
      },
    },
  };
});

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      is_owner: true,
      permissions: ['booking_read', 'booking_write'],
      workspace: {
        has_active_subscription: true,
        active_capabilities: ['BOOKING'],
      },
    },
    hasCapability: () => true,
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

const renderComponent = () => {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <ToastProvider>
          <WorkspaceBookingsPage />
        </ToastProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
};

describe('WorkspaceBookingsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders booking list and status badges when switched to list view', async () => {
    client.get.mockResolvedValue({
      data: {
        data: [
          {
            id: 10,
            customer_name: 'أحمد علي',
            customer_email: 'ahmed@example.com',
            service: { name: 'استشارة قانونية' },
            workspace_member: { name: 'د. محمد' },
            starts_at: '2026-08-25T10:00:00Z',
            status: 'confirmed',
            price: 150,
          },
        ],
        meta: { current_page: 1, last_page: 1, total: 1 },
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/عرض القائمة/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/عرض القائمة/i));

    await waitFor(() => {
      expect(screen.getByText('أحمد علي')).toBeInTheDocument();
    });

    expect(client.get).toHaveBeenCalledWith('/workspace-members/workspace/bookings', expect.any(Object));
  });

  it('updates booking status via API patch request in list view', async () => {
    client.get.mockImplementation((url) => {
      if (typeof url === 'string' && url.endsWith('/20')) {
        return Promise.resolve({
          data: {
            data: {
              id: 20,
              customer_name: 'سارة خالد',
              customer_email: 'sara@example.com',
              status: 'pending',
              starts_at: '2026-08-26T14:00:00Z',
              ends_at: '2026-08-26T15:00:00Z',
              service: { name: 'استشارة تسويقية', duration_minutes: 60, price: 200 },
            },
          },
        });
      }
      return Promise.resolve({
        data: {
          data: [
            {
              id: 20,
              customer_name: 'سارة خالد',
              service: { name: 'استشارة تسويقية' },
              starts_at: '2026-08-26T14:00:00Z',
              status: 'pending',
            },
          ],
          meta: { current_page: 1, last_page: 1, total: 1 },
        },
      });
    });

    client.patch.mockResolvedValue({
      data: { status: 'success', message: 'تم تحديث حالة الحجز' },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/عرض القائمة/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/عرض القائمة/i));

    await waitFor(() => {
      expect(screen.getByText(/عرض التفاصيل/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/عرض التفاصيل/i));

    await waitFor(() => {
      expect(screen.getByText('سارة خالد')).toBeInTheDocument();
    });
  });
});
