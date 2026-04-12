import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { messagesApi } from "../../shared/services/apiServices";
import type { Message } from "../../shared/types";

interface MessagePage {
  messages: Message[];
  nextCursor: string | null;
  loading: boolean;
  initialized: boolean;
}

interface MessagesState {
  byConversation: Record<string, MessagePage>;
}

const defaultPage = (): MessagePage => ({
  messages: [],
  nextCursor: null,
  loading: false,
  initialized: false,
});

const initialState: MessagesState = { byConversation: {} };

export const fetchMessages = createAsyncThunk(
  "messages/fetch",
  async (
    { conversationId, cursor }: { conversationId: string; cursor?: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await messagesApi.getMessages(conversationId, cursor);
      return { conversationId, ...res.data.data! };
    } catch {
      return rejectWithValue("Failed to load messages");
    }
  },
);

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<Message>) {
      const cid = action.payload.conversation;
      if (!state.byConversation[cid]) state.byConversation[cid] = defaultPage();
      const exists = state.byConversation[cid].messages.some(
        (m) => m._id === action.payload._id,
      );
      if (!exists) state.byConversation[cid].messages.push(action.payload);
    },

    addOptimisticMessage(
      state,
      action: PayloadAction<{
        conversationId: string;
        content: string;
        sender: Message["sender"];
      }>,
    ) {
      const { conversationId, content, sender } = action.payload;
      if (!state.byConversation[conversationId]) {
        state.byConversation[conversationId] = defaultPage();
      }
      const tempId = "temp-" + crypto.randomUUID();
      const tempMsg: Message = {
        _id: tempId,
        conversation: conversationId,
        sender,
        type: "text",
        content,
        readBy: [],
        deliveredTo: [],
        isEdited: false,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pending: true,
        localId: tempId,
      };
      state.byConversation[conversationId].messages.push(tempMsg);
    },

    replacePendingMessage(
      state,
      action: PayloadAction<{ localId: string; message: Message }>,
    ) {
      const { localId, message } = action.payload;
      const cid = message.conversation;
      const page = state.byConversation[cid];
      if (!page) return;
      const idx = page.messages.findIndex((m) => m.localId === localId);
      if (idx >= 0) {
        page.messages[idx] = message;
      } else {
        const exists = page.messages.some((m) => m._id === message._id);
        if (!exists) page.messages.push(message);
      }
    },

    updateMessage(state, action: PayloadAction<Message>) {
      const cid = action.payload.conversation;
      const page = state.byConversation[cid];
      if (!page) return;
      const idx = page.messages.findIndex((m) => m._id === action.payload._id);
      if (idx >= 0) page.messages[idx] = action.payload;
    },

    deleteMessage(
      state,
      action: PayloadAction<{ messageId: string; conversationId: string }>,
    ) {
      const page = state.byConversation[action.payload.conversationId];
      if (!page) return;
      const msg = page.messages.find((m) => m._id === action.payload.messageId);
      if (msg) {
        msg.isDeleted = true;
        msg.content = "";
        msg.media = undefined;
      }
    },

    markMessagesRead(
      state,
      action: PayloadAction<{
        conversationId: string;
        userId: string;
        readAt: string;
      }>,
    ) {
      const { conversationId, userId, readAt } = action.payload;
      const page = state.byConversation[conversationId];
      if (!page) return;
      page.messages.forEach((m) => {
        const alreadyRead = m.readBy.some((r) => r.user === userId);
        if (!alreadyRead) m.readBy.push({ user: userId, readAt });
      });
    },

    clearConversationMessages(state, action: PayloadAction<string>) {
      delete state.byConversation[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state, action) => {
        const cid = action.meta.arg.conversationId;
        if (!state.byConversation[cid])
          state.byConversation[cid] = defaultPage();
        state.byConversation[cid].loading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { conversationId, messages, nextCursor } = action.payload;
        const page = state.byConversation[conversationId];
        page.loading = false;
        page.initialized = true;
        const existingIds = new Set(page.messages.map((m) => m._id));
        const newMsgs = (messages as Message[]).filter(
          (m) => !existingIds.has(m._id),
        );
        page.messages = [...newMsgs, ...page.messages];
        page.nextCursor = nextCursor;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        const cid = action.meta.arg.conversationId;
        if (state.byConversation[cid])
          state.byConversation[cid].loading = false;
      });
  },
});

export const {
  addMessage,
  addOptimisticMessage,
  replacePendingMessage,
  updateMessage,
  deleteMessage,
  markMessagesRead,
  clearConversationMessages,
} = messagesSlice.actions;

export default messagesSlice.reducer;
