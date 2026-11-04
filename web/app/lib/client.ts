import axios from 'axios';
import Cookies from 'js-cookie';

const _HEADERS = {
  contentTypeJson: { 'Content-Type': 'application/json' },
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: _HEADERS.contentTypeJson,
});

api.interceptors.request.use(config => {
  const token = Cookies.get('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const apiCountries = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_COUNTRY,
  headers: _HEADERS.contentTypeJson,
});

export { api, apiCountries };
