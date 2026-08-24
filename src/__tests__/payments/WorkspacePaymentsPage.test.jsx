import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    user: { is_owner: true, permissions: ['payment_read', 'payment_write'] },
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

const renderComponent = () => {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <ToastProvider>
          <WorkspacePaymentsPage />
        </ToastProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
};

describe('WorkspacePaymentsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders workspace safe wallet summary cards and metrics', async () => {
    client.get.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('wallet')) {
        return Promise.resolve({
          data: {
            data: {
              currency: 'SAR',
              net_balance: 1500,
              total_credit: 2000,
              total_debit: 500,
              pending_balance: 300,
              total_count: 5,
              paid_count: 4,
              pending_count: 1,
            },
          },
        });
      }
      return Promise.resolve({
        data: {
          data: [
            {
              id: 101,
              payable_type: 'App\\Models\\Appointment',
              payable_id: 12,
              amount: '200.00',
              currency: 'SAR',
              status: 'paid',
              type: 'credit',
              method: 'bank_transfer',
              provider: 'manual',
              created_at: '2026-08-24T10:00:00Z',
            },
          ],
          meta: { current_page: 1, last_page: 1, total: 1 },
        },
      });
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('1500 SAR')).toBeInTheDocument();
      expect(screen.getByText('2000 SAR')).toBeInTheDocument();
      expect(screen.getByText('500 SAR')).toBeInTheDocument();
    });
  });

  it('renders credit and debit badges correctly in transaction list', async () => {
    client.get.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('wallet')) {
        return Promise.resolve({ data: { data: { net_balance: 0 } } });
      }
      return Promise.resolve({
        data: {
          data: [
            {
              id: 1,
              payable_type: 'App\\Models\\Appointment',
              payable_id: 10,
              amount: '150.00',
              currency: 'SAR',
              status: 'paid',
              type: 'credit',
              method: 'card',
              created_at: '2026-08-24T10:00:00Z',
            },
            {
              id: 2,
              payable_type: 'App\\Models\\Subscription',
              payable_id: 2,
              amount: '99.00',
              currency: 'SAR',
              status: 'paid',
              type: 'debit',
              method: 'bank_transfer',
              created_at: '2026-08-24T11:00:00Z',
            },
          ],
        },
      });
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText(/\(\+\) دائن/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/\(\-\) مدين/i).length).toBeGreaterThan(0);
    });
  });

  it('triggers payment verification API call on verify click', async () => {
    client.get.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('wallet')) {
        return Promise.resolve({ data: { data: { net_balance: 100 } } });
      }
      return Promise.resolve({
        data: {
          data: [
            {
              id: 55,
              payable_type: 'App\\Models\\Appointment',
              payable_id: 4,
              amount: '100.00',
              currency: 'SAR',
              status: 'verifying',
              type: 'credit',
              method: 'bank_transfer',
              proof_file: 'http://example.com/receipt.jpg',
              created_at: '2026-08-24T10:00:00Z',
            },
          ],
        },
      });
    });

    client.post.mockResolvedValue({
      data: { status: 'success', message: 'تم الاعتماد بنجاح' },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText(/التفاصيل \/ الإيصال/i)[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText(/التفاصيل \/ الإيصال/i)[0]);

    await waitFor(() => {
      expect(screen.getByText(/اعتماد والدفع/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/اعتماد والدفع/i));

    await waitFor(() => {
      expect(client.post).toHaveBeenCalledWith('/workspace-members/workspace/payments/55/verify');
    });
  });
});
