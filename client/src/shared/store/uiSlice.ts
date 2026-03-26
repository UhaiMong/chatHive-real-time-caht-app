import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarOpen: boolean;
  activeConversationId: string | null;
  replyToMessage: import('../types').Message | null;
  searchQuery: string;
  profilePanelOpen: boolean;
  newGroupModalOpen: boolean;
  newChatModalOpen: boolean;
}

const initialState: UiState = {
  sidebarOpen: true,
  activeConversationId: null,
  replyToMessage: null,
  searchQuery: '',
  profilePanelOpen: false,
  newGroupModalOpen: false,
  newChatModalOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveConversation(state, action: PayloadAction<string | null>) {
      state.activeConversationId = action.payload;
      state.replyToMessage = null;
      if (action.payload && window.innerWidth < 768) {
        state.sidebarOpen = false;
      }
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    setReplyTo(state, action: PayloadAction<import('../types').Message | null>) {
      state.replyToMessage = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setProfilePanelOpen(state, action: PayloadAction<boolean>) {
      state.profilePanelOpen = action.payload;
    },
    setNewGroupModalOpen(state, action: PayloadAction<boolean>) {
      state.newGroupModalOpen = action.payload;
    },
    setNewChatModalOpen(state, action: PayloadAction<boolean>) {
      state.newChatModalOpen = action.payload;
    },
  },
});

export const {
  setActiveConversation,
  toggleSidebar,
  setSidebarOpen,
  setReplyTo,
  setSearchQuery,
  setProfilePanelOpen,
  setNewGroupModalOpen,
  setNewChatModalOpen,
} = uiSlice.actions;

export default uiSlice.reducer;
