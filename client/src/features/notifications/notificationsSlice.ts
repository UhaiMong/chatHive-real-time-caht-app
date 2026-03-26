import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface NotificationsState {
  items: Notification[];
}

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: { items: [] } as NotificationsState,
  reducers: {
    addNotification(state, action: PayloadAction<Omit<Notification, 'id'>>) {
      state.items.push({ ...action.payload, id: crypto.randomUUID() });
    },
    removeNotification(state, action: PayloadAction<string>) {
      state.items = state.items.filter(n => n.id !== action.payload);
    },
  },
});

export const { addNotification, removeNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
