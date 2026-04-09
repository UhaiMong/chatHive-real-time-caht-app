import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface TypingState {
  [conversationId: string]: { [userId: string]: boolean };
}

const initialState: TypingState = {};

const typingSlice = createSlice({
  name: "typing",
  initialState,
  reducers: {
    setTyping: (
      state,
      action: PayloadAction<{
        conversationId: string;
        userId: string;
        isTyping: boolean;
      }>,
    ) => {
      const { conversationId, userId, isTyping } = action.payload;
      if (!state[conversationId]) {
        state[conversationId] = {};
      }
      state[conversationId][userId] = isTyping;
    },
  },
});

export const { setTyping } = typingSlice.actions;
export default typingSlice.reducer;
