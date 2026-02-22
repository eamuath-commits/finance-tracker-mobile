import axios from 'axios';
import { Platform } from 'react-native';

/**
 * API Service for Finance Tracker
 * Connects to the existing FastAPI backend
 *
 * For physical device testing, replace with your machine's local IP or deployed URL
 * For iOS simulator, localhost works. For Android emulator, use 10.0.2.2
 */
const getBaseURL = () => {
    // TODO: Replace with your actual backend URL or local IP for device testing
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:8000'; // Android emulator -> host machine
    }
    return 'http://localhost:8000'; // iOS simulator
};

const api = axios.create({
    baseURL: getBaseURL(),
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- Accounts ---
export const getAccounts = () => api.get('/accounts/');

// --- Credit Cards ---
export const getCreditCards = () => api.get('/credit-cards/');
export const getCreditCard = (id) => api.get(`/credit-cards/${id}`);
export const getCreditCardTransactions = (id) => api.get(`/credit-cards/${id}/transactions`);

// --- Transactions ---
export const getTransactions = (skip = 0, limit = 1000) =>
    api.get('/transactions/', { params: { skip, limit } });

export const getTransaction = (id) => api.get(`/transactions/${id}`);

export const createTransaction = (data) => api.post('/transactions/', data);

export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data);

export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);

export const getPendingTransactions = () => api.get('/transactions/pending');

// --- Obligations ---
export const getObligations = () => api.get('/obligations/');
export const getObligationPayments = (id) => api.get(`/obligations/${id}/payments`);

// --- Loans ---
export const getLoans = () => api.get('/loans/');

// --- Merchants ---
export const getMerchants = () => api.get('/merchants/');

// --- Analysis ---
export const getAllocationAnalysis = () => api.get('/analysis/allocation');

// --- Messages / SMS ---
export const getMessages = () => api.get('/messages/');
export const retryMessage = (id) => api.post(`/messages/${id}/retry`);

// --- Utility: Set a custom API URL (for settings screen) ---
export const setBaseURL = (url) => {
    api.defaults.baseURL = url;
};

export const getBaseUrl = () => api.defaults.baseURL;

export default api;
