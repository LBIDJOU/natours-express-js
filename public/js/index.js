/* eslint-disable */
import { displayMap } from './mapBox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

// DOM elements
const map = document.querySelector('#map');
const loginForm = document.querySelector(
  '.login__form',
);
const logOutBtn = document.querySelector(
  '.nav__el--logout',
);
const userDataForm = document.querySelector(
  '.form-user-data',
);
const userSettingsForm = document.querySelector(
  '.form-user-settings',
);
const checkoutBtn =
  document.querySelector('#book-tour');

// Delegation
if (map) {
  const locations = JSON.parse(
    map.dataset.locations,
  );
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document
      .querySelector('#email')
      .value.trim();
    const password =
      document.querySelector('#password').value;
    login(email, password);
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', logout);
}

if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append(
      'username',
      document.querySelector(
        '.form-user-data #name',
      ).value,
    );
    form.append(
      'email',
      document.querySelector(
        '.form-user-data #email',
      ).value,
    );
    form.append(
      'photo',
      document.querySelector(
        '.form-user-data #photo',
      ).files[0],
    );
    // console.log(form);
    updateSettings('data', form);
  });
}

if (userSettingsForm) {
  userSettingsForm.addEventListener(
    'submit',
    async (e) => {
      e.preventDefault();
      document.querySelector(
        '.form-user-settings .btn--submit',
      ).textContent = 'Updating...';
      const currentPassword =
        document.querySelector(
          '.form-user-settings #password-current',
        ).value;
      const password = document.querySelector(
        '.form-user-settings #password',
      ).value;
      const confirmPassword =
        document.querySelector(
          '.form-user-settings #password-confirm',
        ).value;
      await updateSettings('password', {
        currentPassword,
        password,
        confirmPassword,
      });
      document.querySelector(
        '.form-user-settings .btn--submit',
      ).textContent = 'Save password';
      document.querySelector(
        '.form-user-settings #password-current',
      ).value = '';
      document.querySelector(
        '.form-user-settings #password',
      ).value = '';
      document.querySelector(
        '.form-user-settings #password-confirm',
      ).value = '';
    },
  );
}

if (checkoutBtn) {
  checkoutBtn.addEventListener(
    'click',
    async (e) => {
      e.target.textContent = 'Processing...';
      const { tourId } = e.target.dataset;
      bookTour(tourId);
    },
  );
}
