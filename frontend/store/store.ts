
import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from './SessionSlice';
import conversationReducer from './ConversationSlice';
import userReducer from './UserSlice';
import cookieMiddleware, { loadStateFromCookies } from './cookieMiddleware';

const preloadedState = loadStateFromCookies();

const store = configureStore({
  reducer: {
    session: sessionReducer,
    conversation: conversationReducer,
    user: userReducer
  },
  preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(cookieMiddleware)
});

export type AppDispatch = typeof store.dispatch;
export default store;