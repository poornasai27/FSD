import API, { setTokenHeader } from './api';

const TOKEN_KEY = 'aimi_token';
const USER_KEY = 'aimi_user';

export const persistAuth = ({ token, user }) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  setTokenHeader(token);
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  setTokenHeader(null);
};

export const getStoredToken = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    setTokenHeader(token);
  }
  return token;
};

export const getStoredUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const setAuthToken = setTokenHeader;

export const register = async (payload) => {
  const response = await API.post('/auth/register', payload);
  return response.data.data;
};

export const login = async (payload) => {
  const response = await API.post('/auth/login', payload);
  return response.data.data;
};
