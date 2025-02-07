/* eslint-disable*/
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const response = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    if (response.data.status === 'success') {
      showAlert(
        'success',
        'Logged in successfully',
      );
      window.setTimeout(
        () => (location.href = '/'),
        1500,
      );
    }
  } catch (error) {
    showAlert(
      'error',
      error.response.data.message,
    );
  }
};

export const logout = async () => {
  try {
    const res = await axios.get(
      '/api/v1/users/logout',
    );
    if (res.data.status === 'success') {
      window.location.reload(true);
    }
  } catch (error) {
    showAlert(
      'error',
      "Error! Can't log out Please try again",
    );
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await axios({
      method: 'POST',
      url: '/api/v1/users/forgot-password',
      data: {
        email,
      },
    });
    if (response.data.status === 'success') {
      showAlert('success', response.data.message);
      return true;
    }
  } catch (error) {
    showAlert(
      'error',
      error.response.data.message,
    );
    return false;
  }
};

export const resetPassword = async (
  token,
  userData,
) => {
  try {
    const response = await axios({
      method: 'PATCH',
      url: `/api/v1/users/reset-password/${token}`,
      data: userData,
    });
    if (response.data.status === 'success') {
      showAlert(
        'success',
        'Your password has been reset successfully',
      );
      window.setTimeout(
        () => (location.href = '/'),
        1000,
      );
    }
  } catch (error) {
    showAlert(
      'error',
      error.response.data.message,
    );
  }
};
