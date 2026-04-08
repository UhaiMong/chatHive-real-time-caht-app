import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { authApi, usersApi } from "../../shared/services/apiServices";
import type { User, AuthResult } from "../../shared/types";
import { initSocket, disconnectSocket } from "../../shared/services/socket";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem("accessToken"),
  status: "idle",
  error: null,
};

const persistTokens = (result: AuthResult) => {
  localStorage.setItem("accessToken", result.accessToken);
  localStorage.setItem("refreshToken", result.refreshToken);
  initSocket(result.accessToken);
};

export const register = createAsyncThunk(
  "auth/register",
  async (
    data: { username: string; email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await authApi.register(data);
      return res.data.data!;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        e.response?.data?.message ?? "Registration failed",
      );
    }
  },
);

export const login = createAsyncThunk(
  "auth/login",
  async (data: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await authApi.login(data);
      return res.data.data!;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(e.response?.data?.message ?? "Login failed");
    }
  },
);

export const fetchMe = createAsyncThunk(
  "auth/me",
  async (_, { rejectWithValue }) => {
    try {
      const res = await authApi.me();
      return res.data.data!;
    } catch (err: unknown) {
      return rejectWithValue("Session expired");
    }
  },
);

// Get online user

export const getOnlineUsers = createAsyncThunk(
  "/users/online",
  async (_, { rejectWithValue }) => {
    try {
      const res = await usersApi.onlineUsers();
      return res.data.data || res.data;
    } catch (error) {
      return rejectWithValue("Failed to get online users");
    }
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  const refreshToken = localStorage.getItem("refreshToken") ?? "";
  try {
    await authApi.logout(refreshToken);
  } catch {
    /* noop */
  }
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  disconnectSocket();
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const loading = (state: AuthState) => {
      state.status = "loading";
      state.error = null;
    };
    const failed = (state: AuthState, action: PayloadAction<unknown>) => {
      state.status = "failed";
      state.error = action.payload as string;
    };

    builder
      .addCase(register.pending, loading)
      .addCase(register.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        persistTokens(action.payload);
      })
      .addCase(register.rejected, failed)

      .addCase(login.pending, loading)
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        persistTokens(action.payload);
      })
      .addCase(login.rejected, failed)

      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
      })

      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.status = "idle";
      });
  },
});

export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;
