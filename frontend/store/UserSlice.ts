import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserState {
  userId: string;
  name: string;
  userRole: string;
  token: string;
  language: string
}

const initialState: UserState = {
  userId: "",
  name: "",
  userRole: "",
  token: "",
  language: ""
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserState>) {
      return {
        ...state,
        ...action.payload
      };
    },
    clearUser(state) {
      state.userId = "";
      state.name = "";
      state.userRole = "";
      state.token = "";
      state.language = "English"
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;

// Add type-safe reducer export
export type UserReducer = typeof userSlice.reducer;

export default userSlice.reducer;