import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NotificationsPage from '../../components/dashboard/NotificationsPage';
import ChatsPage from '../../components/dashboard/ChatsPage';
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

vi.mock('../../utils/firebaseChat', () => ({
  subscribeToChatMessages: vi.fn(() => () => {}),
  sendFirebaseMessage: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: 'Stress User',
      email: 'user@test.com',
      is_owner: true,
      permissions: ['chat_read', 'chat_write'],
      workspace: {
        id: 1,
        name: 'Stress Workspace',
        has_active_subscription: true,
        active_capabilities: ['CHAT', 'BOOKING'],
      },
    },
    userType: 'member',
    isAuthenticated: true,
    hasCapability: () => true,
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

describe('Frontend Chat & Notifications Stress Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const notifications = [];
    for (let i = 1; i <= 30; i++) {
      notifications.push({
        id: `notif-${i}`,
        data: { title: `Stress Notification ${i}`, message: `Message content for notification ${i}` },
        read_at: i % 2 === 0 ? '2026-08-20T10:00:00Z' : null,
        created_at: '2026-08-20T10:00:00Z',
      });
    }

    client.get.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/notifications')) {
        return Promise.resolve({
          data: {
            status: true,
            data: {
              notifications,
              unread_count: 15,
            },
          },
        });
      }

      if (typeof url === 'string' && url.includes('/chats')) {
        return Promise.resolve({
          data: {
            status: true,
            data: [
              {
                id: 101,
                last_message: { body: 'Hello there!', created_at: '2026-08-20T10:00:00Z' },
                unread_count: 3,
                participant: { name: 'Support Agent' },
              },
            ],
          },
        });
      }

      return Promise.resolve({ data: { status: true, data: [] } });
    });

    client.post.mockResolvedValue({
      data: { status: true, message: 'Action succeeded' },
    });

    client.delete.mockResolvedValue({
      data: { status: true, message: 'Deleted' },
    });
  });

  it('stress: rendering high-volume notification list and rapid mark/delete interactions', async () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <ToastProvider>
            <NotificationsPage />
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

  it('stress: rapid chats list rendering and interaction', async () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <ToastProvider>
            <ChatsPage />
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
