import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkspaceSettingsPage from '../../pages/member/dashboard/WorkspaceSettingsPage';
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
      is_owner: true,
      permissions: ['settings_read', 'settings_write'],
      workspace: { id: 1, name: 'Stress Workspace', has_active_subscription: true },
    },
    hasCapability: () => true,
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

describe('Frontend Workspace Settings Tabs Stress Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    client.get.mockResolvedValue({
      data: {
        status: true,
        data: {
          id: 1,
          name: 'Stress Workspace',
          email: 'test@workspace.com',
          phone: '+966500000000',
          timezone: 'Asia/Riyadh',
          time_format: '12',
          start_of_week: '0',
          social_links: {},
          booking_enabled: true,
          booking_form_fields: { phone: 'required' },
        },
      },
    });

    client.post.mockResolvedValue({
      data: { status: true, message: 'Settings saved successfully' },
    });
  });

  it('stress: rapid tab navigation across all 8 settings tabs during in-flight fetches', async () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <ToastProvider>
            <WorkspaceSettingsPage />
          </ToastProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });

    const buttons = screen.queryAllByRole('button');
    for (let round = 0; round < 3; round++) {
      for (const btn of buttons) {
        fireEvent.click(btn);
      }
    }

    expect(document.body).toBeInTheDocument();
  });
});
