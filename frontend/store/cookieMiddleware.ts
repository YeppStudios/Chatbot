import Cookies from 'js-cookie';
import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '@/types';

const COOKIE_NAME = 'app_state';
const COOKIE_EXPIRY = 7; // days

interface CookieOptions {
  expires?: number;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

const cookieMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  const state = store.getState() as RootState;

  // Select which parts of the state to persist
  const stateToPersist = {
    user: state.user,
    language: state.language,
    // Add or remove other slices as needed
  };

  const cookieOptions: CookieOptions = {
    expires: COOKIE_EXPIRY,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  try {
    Cookies.set(COOKIE_NAME, JSON.stringify(stateToPersist), cookieOptions);
  } catch (error) {
    console.error('Failed to save state to cookies:', error);
  }

  return result;
};

export const loadStateFromCookies = (): Partial<RootState> | undefined => {
  try {
    const cookieState = Cookies.get(COOKIE_NAME);
    if (!cookieState) return undefined;
    return JSON.parse(cookieState);
  } catch (error) {
    console.error('Failed to load state from cookies:', error);
    return undefined;
  }
};

export default cookieMiddleware;