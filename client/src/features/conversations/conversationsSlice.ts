import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { conversationsApi } from '../../shared/services/apiServices';
import type { Conversation, Message } from '../../shared/types';

interface ConversationsState {
  items: Conversation[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  typingUsers: Record<string, string[]>; // conversationId → userIds
}

const initialState: ConversationsState = {
  items: [],
  status: 'idle',
  typingUsers: {},
};

export const fetchConversations = createAsyncThunk(
  'conversations/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await conversationsApi.getAll();
      return res.data.data!;
    } catch {
      return rejectWithValue('Failed to load conversations');
    }
  }
);

export const getOrCreateDirect = createAsyncThunk(
  'conversations/getOrCreateDirect',
  async (userId: string, { rejectWithValue }) => {
    try {
      const res = await conversationsApi.getOrCreateDirect(userId);
      return res.data.data!;
    } catch {
      return rejectWithValue('Failed to open conversation');
    }
  }
);

export const createGroup = createAsyncThunk(
  'conversations/createGroup',
  async (data: { name: string; participantIds: string[] }, { rejectWithValue }) => {
    try {
      const res = await conversationsApi.createGroup(data);
      return res.data.data!;
    } catch {
      return rejectWithValue('Failed to create group');
    }
  }
);

const conversationsSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    upsertConversation(state, action: PayloadAction<Conversation>) {
      const idx = state.items.findIndex(c => c._id === action.payload._id);
      if (idx >= 0) {
        state.items[idx] = action.payload;
      } else {
        state.items.unshift(action.payload);
      }
    },
    updateLastMessage(state, action: PayloadAction<{ conversationId: string; message: Message }>) {
      const conv = state.items.find(c => c._id === action.payload.conversationId);
      if (conv) {
        conv.lastMessage = action.payload.message;
        conv.lastActivity = action.payload.message.createdAt;
        // Move to top
        const sorted = [...state.items].sort(
          (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
        );
        state.items = sorted;
      }
    },
    incrementUnread(state, action: PayloadAction<{ conversationId: string }>) {
      const conv = state.items.find(c => c._id === action.payload.conversationId);
      if (conv) conv.unreadCount = (conv.unreadCount ?? 0) + 1;
    },
    clearUnread(state, action: PayloadAction<string>) {
      const conv = state.items.find(c => c._id === action.payload);
      if (conv) conv.unreadCount = 0;
    },
    setTyping(
      state,
      action: PayloadAction<{ conversationId: string; userId: string; isTyping: boolean }>
    ) {
      const { conversationId, userId, isTyping } = action.payload;
      const current = state.typingUsers[conversationId] ?? [];
      if (isTyping) {
        state.typingUsers[conversationId] = [...new Set([...current, userId])];
      } else {
        state.typingUsers[conversationId] = current.filter(id => id !== userId);
      }
    },
    updateParticipantStatus(
      state,
      action: PayloadAction<{ userId: string; status: 'online' | 'offline'; lastSeen?: string }>
    ) {
      const { userId, status, lastSeen } = action.payload;
      state.items.forEach(conv => {
        const participant = conv.participants.find(p => p._id === userId);
        if (participant) {
          participant.status = status;
          if (lastSeen) participant.lastSeen = lastSeen;
        }
      });
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchConversations.pending, state => { state.status = 'loading'; })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchConversations.rejected, state => { state.status = 'failed'; })
      .addCase(getOrCreateDirect.fulfilled, (state, action) => {
        const exists = state.items.find(c => c._id === action.payload._id);
        if (!exists) state.items.unshift(action.payload);
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      });
  },
});

export const {
  upsertConversation,
  updateLastMessage,
  incrementUnread,
  clearUnread,
  setTyping,
  updateParticipantStatus,
} = conversationsSlice.actions;

export default conversationsSlice.reducer;
