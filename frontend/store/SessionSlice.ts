// store/loadingComponentSlice.ts
import { createSlice } from '@reduxjs/toolkit';

interface SessionState {
  id: string;
}

const initialState: SessionState = {
    id: "",
};

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSessionId(state, action) {
      state.id = action.payload;
    },
  },
});

export const { setSessionId } = sessionSlice.actions;

export default sessionSlice.reducer;
