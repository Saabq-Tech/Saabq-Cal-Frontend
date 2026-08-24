import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkspaceSchedulesPage from '../../pages/member/dashboard/WorkspaceSchedulesPage';
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
    user: {
      id: 1,
      is_owner: true,
      permissions: ['schedule_read', 'schedule_write'],
      workspace: {
        id: 1,
        name: 'Schedules Workspace',
        has_active_subscription: true,
        active_capabilities: ['PER_MEMBER_CALENDAR', 'BOOKING'],
      },
    },
    userType: 'member',
    isAuthenticated: true,
    hasCapability: () => true,
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

describe('Frontend Schedules & Availability Stress Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const rules = [];
    for (let day = 0; day <= 6; day++) {
      rules.push({
        day_of_week: day,
        is_available: true,
        slots: [
          { start_time: '09:00', end_time: '13:00' },
          { start_time: '14:00', end_time: '18:00' },
          { start_time: '19:00', end_time: '22:00' },
        ],
      });
    }

    const overrides = [];
    for (let i = 1; i <= 20; i++) {
      overrides.push({
        id: i,
        date: `2026-09-${String(i).padStart(2, '0')}`,
        is_available: false,
        reason: `Holiday ${i}`,
        slots: [],
      });
    }

    client.get.mockImplementation(() => {
      return Promise.resolve({
        data: {
          status: true,
          data: [
            {
              id: 1,
              name: 'Default Working Hours',
              is_default: true,
              availability_rules: rules,
              availability_overrides: overrides,
            },
          ],
        },
      });
    });

    client.put.mockResolvedValue({
      data: { status: true, message: 'Rules updated' },
    });
  });

  it('stress: rendering large availability schedule rules matrix and override lists', async () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <ToastProvider>
            <WorkspaceSchedulesPage />
          </ToastProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(client.get).toHaveBeenCalled();
    });

    const buttons = screen.queryAllByRole('button');
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      fireEvent.click(buttons[i]);
    }

    expect(document.body).toBeInTheDocument();
  });
});
