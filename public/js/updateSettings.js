/* eslint-disable*/
import axios from 'axios';
import { showAlert } from './alerts';

// Type either 'passord' or 'data'
export const updateSettings = async (
  type,
  data,
) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/update-my-password'
        : '/api/v1/users/update-my-profile';

    const response = await axios({
      method: 'PATCH',
      url,
      data,
    });
    if (response.data.status === 'success') {
      showAlert(
        'success',
        `${type.toUpperCase()} updated successfully`,
      );
    }
  } catch (error) {
    showAlert(
      'error',
      error.response.data.message,
    );
  }
  window.location.reload();
};
