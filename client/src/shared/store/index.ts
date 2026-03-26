import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import conversationsReducer from '../../features/conversations/conversationsSlice';
import messagesReducer from '../../features/chat/messagesSlice';
import uiReducer from './uiSlice';
import notificationsReducer from '../../features/notifications/notificationsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    conversations: conversationsReducer,
    messages: messagesReducer,
    ui: uiReducer,
    notifications: notificationsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
