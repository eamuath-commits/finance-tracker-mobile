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
    return 'http://10.10.80.150:8000'; // SIT backend server
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
export const createAccount = (data) => api.post('/accounts/', data);
export const updateAccount = (id, data) => api.put(`/accounts/${id}`, data);
export const deleteAccount = (id) => api.delete(`/accounts/${id}`);
export const recalculateBalance = (id) => api.post(`/accounts/${id}/recalculate-balance`);
export const recalculateAllBalances = () => api.post('/accounts/recalculate-all-balances');

// --- Credit Cards ---
export const getCreditCards = () => api.get('/credit-cards/');
export const getCreditCard = (id) => api.get(`/credit-cards/${id}`);
export const createCreditCard = (data) => api.post('/credit-cards/', data);
export const updateCreditCard = (id, data) => api.put(`/credit-cards/${id}`, data);
export const deleteCreditCard = (id) => api.delete(`/credit-cards/${id}`);
export const getCreditCardTransactions = (id) => api.get(`/credit-cards/${id}/transactions`);
export const recordCreditCardPayment = (id, amount, fromAccountId) =>
    api.post(`/credit-cards/${id}/payment`, null, {
        params: { amount, from_account_id: fromAccountId },
    });

// --- Transactions ---
export const getTransactions = (skip = 0, limit = 1000) =>
    api.get('/transactions/', { params: { skip, limit } });

export const getTransaction = (id) => api.get(`/transactions/${id}`);

export const createTransaction = (data) => api.post('/transactions/', data);

export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data);

export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);

export const getPendingTransactions = () => api.get('/transactions/pending');

export const bulkDeleteTransactions = (ids) =>
    api.post('/transactions/bulk-delete', { transaction_ids: ids });

// --- Obligations ---
export const getObligations = () => api.get('/obligations/');
export const createObligation = (data) => api.post('/obligations/', data);
export const updateObligation = (id, data) => api.put(`/obligations/${id}`, data);
export const deleteObligation = (id) => api.delete(`/obligations/${id}`);
export const getObligationsMonthlyStatus = (monthOffset = 0) =>
    api.get('/obligations/monthly-status', { params: { month_offset: monthOffset } });
export const getObligationsForecast = (monthsAhead = 1) =>
    api.get('/obligations/forecast', { params: { months_ahead: monthsAhead } });
export const payObligation = (id, data) => api.post(`/obligations/${id}/pay`, data);
export const getObligationPayments = (id) => api.get(`/obligations/${id}/payments`);
export const deletePayment = (paymentId) => api.delete(`/obligations/history/${paymentId}`);

// --- Loans ---
export const getLoans = () => api.get('/loans/');
export const createLoan = (data) => api.post('/loans/', data);
export const updateLoan = (id, data) => api.put(`/loans/${id}`, data);
export const deleteLoan = (id) => api.delete(`/loans/${id}`);

// --- Merchants ---
export const getMerchants = () => api.get('/merchants/');
export const getMerchant = (id) => api.get(`/merchants/${id}`);
export const updateMerchant = (id, data) => api.put(`/merchants/${id}`, data);
export const deleteMerchant = (id) => api.delete(`/merchants/${id}`);

// --- Categories ---
export const getCategories = () => api.get('/categories/');
export const createCategory = (data) => api.post('/categories/', data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// --- Analysis ---
export const getAllocationAnalysis = () => api.get('/analysis/allocation');

// --- Messages / SMS ---
export const getMessages = () => api.get('/messages/');
export const retryMessage = (id) => api.post(`/messages/${id}/retry`);
export const ingestSMS = (sender, body) => api.post('/sms/ingest', { sender, body });

// --- Savings Goals ---
export const getGoals = () => api.get('/goals/');
export const createGoal = (data) => api.post('/goals/', data);
export const updateGoal = (id, data) => api.put(`/goals/${id}`, data);
export const deleteGoal = (id) => api.delete(`/goals/${id}`);

// --- Utility: Set a custom API URL (for settings screen) ---
export const setBaseURL = (url) => {
    api.defaults.baseURL = url;
};

export const getBaseUrl = () => api.defaults.baseURL;

export default api;
