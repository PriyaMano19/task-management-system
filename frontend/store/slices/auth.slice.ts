import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  login,
  logout,
  initializeAuth,
} from "@/features/auth/store/auth.thunks";
import { User } from "@/features/auth/types/auth.types";
import tokenService from "@/services/token.service";
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  initialized: false,
  error: null,
};
const resetAuthState = (state: AuthState) => {
  state.user = null;
  state.accessToken = null;
  state.refreshToken = null;
  state.isAuthenticated = false;
  state.loading = false;
  state.error = null;
};
const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },

   clearAuth: (state) => {
  resetAuthState(state);
},
  },

  extraReducers: (builder) => {
    builder

      // Login Started
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

    .addCase(login.fulfilled, (state, action) => {
      state.loading = false;
      state.initialized = true;
      state.isAuthenticated = true;

      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;

      tokenService.setAccessToken(action.payload.accessToken);
      tokenService.setRefreshToken(action.payload.refreshToken);
    })

      // Login Failed
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

  .addCase(logout.fulfilled, (state) => {
  resetAuthState(state);

  if (typeof window !== "undefined") {
    tokenService.clearTokens();
  }
})
      .addCase(initializeAuth.pending, (state) => {
  state.loading = true;
})

.addCase(initializeAuth.fulfilled, (state, action) => {
 

  state.loading = false;
  state.initialized = true;
  state.isAuthenticated = true;
  state.user = action.payload;

  state.accessToken = tokenService.getAccessToken();
  state.refreshToken = tokenService.getRefreshToken();
})

.addCase(initializeAuth.rejected, (state) => {
  resetAuthState(state);
  state.initialized = true;

  tokenService.clearTokens();
})
  },
});



export const { setUser, clearAuth } = authSlice.actions;

export default authSlice.reducer;