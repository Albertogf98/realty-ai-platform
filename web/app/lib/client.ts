import axios from 'axios';

const _HEADERS = {
  contentTypeJson: { 'Content-Type': 'application/json' },
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: _HEADERS.contentTypeJson,
});

const apiCountries = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_COUNTRY,
  headers: _HEADERS.contentTypeJson,
});

export { api, apiCountries };
