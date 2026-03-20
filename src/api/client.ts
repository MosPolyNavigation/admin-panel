import axios from 'axios';
import { BASE_API_URL } from '../config.ts';

export const graphqlClient = axios.create({
  baseURL: BASE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const restClient = axios.create({
  baseURL: BASE_API_URL,
});
