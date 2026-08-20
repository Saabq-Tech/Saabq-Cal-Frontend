import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onChildAdded, off } from 'firebase/database';

const DB_URL = import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://saabqcal-default-rtdb.europe-west1.firebasedatabase.app';
const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'saabqcal';

let dbInstance = null;

try {
  if (!getApps().length) {
    const app = initializeApp({
      databaseURL: DB_URL,
      projectId: PROJECT_ID,
    });
    dbInstance = getDatabase(app);
  } else {
    dbInstance = getDatabase(getApps()[0]);
  }
} catch (err) {
  console.warn('Firebase DB init warning:', err);
}

/**
 * Subscribe to real-time chat messages for a specific conversation.
 * @param {number|string} conversationId 
 * @param {function} onNewMessage Callback receiving real-time message object
 * @returns {function} Unsubscribe function
 */
export function subscribeToChatMessages(conversation, onNewMessage) {
  if (!conversation) return () => {};

  const identifier = typeof conversation === 'object'
    ? (conversation.uuid || conversation.id)
    : conversation;

  if (!identifier) return () => {};

  const path = `chats/conversation_${identifier}`;
  const subscriptionTime = Date.now() - 5000;

  const isHistorical = (data) => {
    if (!data) return true;
    if (data.created_at) {
      const msgTime = new Date(data.created_at).getTime();
      if (!isNaN(msgTime) && msgTime < subscriptionTime) {
        return true;
      }
    }
    return false;
  };

  // Strategy 1: Firebase JS SDK Realtime DB
  if (dbInstance) {
    try {
      const chatRef = ref(dbInstance, path);
      
      const unsubscribe = onChildAdded(chatRef, (snapshot) => {
        const data = snapshot.val();
        if (data && !isHistorical(data)) {
          onNewMessage(data);
        }
      });

      return () => {
        try {
          off(chatRef, 'child_added', unsubscribe);
        } catch {
          // ignore cleanup error
        }
      };
    } catch (e) {
      console.warn('Firebase SDK listener error, falling back to SSE:', e);
    }
  }

  // Strategy 2: EventSource SSE Stream fallback directly to Firebase Realtime DB URL
  if (typeof window !== 'undefined' && 'EventSource' in window) {
    try {
      const sseUrl = `${DB_URL}/${path}.json`;
      const es = new EventSource(sseUrl);

      es.addEventListener('put', (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && payload.data) {
            if (payload.path === '/' && typeof payload.data === 'object') {
              Object.values(payload.data).forEach((msg) => {
                if (!isHistorical(msg)) onNewMessage(msg);
              });
            } else if ((payload.data.id || payload.data.body) && !isHistorical(payload.data)) {
              onNewMessage(payload.data);
            }
          }
        } catch (err) {
          // ignore parse errors
        }
      });

      return () => es.close();
    } catch (err) {
      console.warn('SSE fallback error:', err);
    }
  }

  return () => {};
}
