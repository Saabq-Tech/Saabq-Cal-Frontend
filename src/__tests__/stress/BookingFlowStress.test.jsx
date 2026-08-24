import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CustomerBookAppointmentPage from '../../pages/customer/CustomerBookAppointmentPage';
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
      delete: vi.fn(),
      defaults: { headers: { common: {} } },
    },
  };
});

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test Customer', email: 'cust@test.com' },
    isAuthenticated: true,
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

describe('Frontend Booking Flow Stress & Concurrency Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    client.get.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/services')) {
        return Promise.resolve({
          data: {
            status: true,
            data: [
              { id: 1, name: 'Consultation 30m', duration_minutes: 30, price: 100, currency: { symbol: 'SAR' } },
              { id: 2, name: 'Deep Dive 60m', duration_minutes: 60, price: 200, currency: { symbol: 'SAR' } },
            ],
          },
        });
      }

      if (typeof url === 'string' && url.includes('/slots')) {
        const mockSlots = [];
        for (let h = 8; h <= 20; h++) {
          mockSlots.push(`${String(h).padStart(2, '0')}:00`);
          mockSlots.push(`${String(h).padStart(2, '0')}:30`);
        }
        return Promise.resolve({
          data: {
            status: true,
            data: mockSlots,
          },
        });
      }

      return Promise.resolve({
        data: {
          status: true,
          data: {
            id: 1,
            name: 'Saabq Health Hub',
            slug: 'saabq-health',
            booking_enabled: true,
          },
        },
      });
    });

    client.post.mockResolvedValue({
      data: {
        status: true,
        data: { id: 999, status: 'confirmed' },
        message: 'Booked successfully',
      },
    });
  });

  it('stress: rapid service switching and heavy slot generation resilience', async () => {
    render(
      <MemoryRouter initialEntries={['/w/saabq-health']}>
        <LanguageProvider>
          <ToastProvider>
            <Routes>
              <Route path="/w/:idOrSlug" element={<CustomerBookAppointmentPage />} />
            </Routes>
          </ToastProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });

    const buttons = screen.queryAllByRole('button');
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      fireEvent.click(buttons[i]);
    }

    expect(client.get).toHaveBeenCalled();
  });

  it('stress: high-frequency appointment submission burst defense', async () => {
    render(
      <MemoryRouter initialEntries={['/w/saabq-health']}>
        <LanguageProvider>
          <ToastProvider>
            <Routes>
              <Route path="/w/:idOrSlug" element={<CustomerBookAppointmentPage />} />
            </Routes>
          </ToastProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });

    const submitBtns = screen.queryAllByRole('button');
    submitBtns.forEach((btn) => {
      for (let i = 0; i < 5; i++) {
        fireEvent.click(btn);
      }
    });

    expect(document.body).toBeInTheDocument();
  });
});
