import axios from 'axios';
import { showAlert } from './alerts';

export const register = async (userData) => {
  console.log(userData);
  try {
    const response = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: userData,
    });
    console.log(response.data);
    if (response.data.status === 'success') {
      showAlert(
        'success',
        'Registred successfully',
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
