// store/loadingComponentSlice.ts
import { createSlice } from '@reduxjs/toolkit';

interface ConversationState {
  id: string;
}

const initialState: ConversationState = {
    id: ""
};

export const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    setConversation(state, action) {
      state.id = action.payload;
    },
  },
});

export const { setConversation } = conversationSlice.actions;

export default conversationSlice.reducer;
