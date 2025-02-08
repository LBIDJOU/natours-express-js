/* eslint-disable */
import { displayMap } from './mapBox';
import { register } from './register';
import { showAlert } from './alerts';
import {
  login,
  logout,
  forgotPassword,
  resetPassword,
} from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

// DOM elements
const map = document.querySelector('#map');
const registerForm = document.querySelector(
  '.register__form',
);
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

const searchField = document.querySelector(
  '.nav__search-input',
);
const forgotPassForm = document.querySelector(
  '.forgot__pass__form',
);
const resetPasswordForm = document.querySelector(
  '.reset__pass__form',
);

const alertMsg =
  document.querySelector('body').dataset.alert;
// Delegation
if (alertMsg) {
  showAlert('success', alertMsg, 15);
}
if (searchField) {
  searchField.addEventListener(
    'input',
    function () {
      let query = this.value.toLowerCase();
      query === ''
        ? (document.querySelector(
            '.nav__search-btn',
          ).style.display = 'block')
        : (document.querySelector(
            '.nav__search-btn',
          ).style.display = 'none');
      let tourCards =
        document.querySelectorAll('.card');
      tourCards.forEach((card) => {
        let tourName = card
          .querySelector('.tour__name')
          .textContent.toLowerCase();
        if (tourName.includes(query)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    },
  );
}
if (map) {
  const locations = JSON.parse(
    map.dataset.locations,
  );
  displayMap(locations);
}

//
if (registerForm) {
  registerForm.addEventListener(
    'submit',
    async (e) => {
      e.preventDefault();
      const username =
        registerForm.querySelector('#name').value;
      const email =
        registerForm.querySelector(
          '#email',
        ).value;
      const password =
        registerForm.querySelector(
          '#password',
        ).value;
      const confirmPassword =
        registerForm.querySelector(
          '#password-confirm',
        ).value;
      await register({
        username,
        email,
        password,
        confirmPassword,
      });
    },
  );
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

if (forgotPassForm) {
  forgotPassForm.addEventListener(
    'submit',
    async (e) => {
      e.preventDefault();
      forgotPassForm.querySelector(
        '.btn--green',
      ).textContent = 'Sending...';
      const email =
        forgotPassForm.querySelector(
          '#email',
        ).value;

      if (await forgotPassword(email)) {
        forgotPassForm.querySelector(
          'span.info p',
        ).textContent =
          `An email contains reset passowrd link was sent to ${email}. Please check your email`;
        forgotPassForm
          .querySelector('span.info p')
          .classList.add('msg--success');
      } else {
        forgotPassForm.querySelector(
          'span.info p',
        ).textContent =
          `There is no account that matches your email. Please try again!`;
        forgotPassForm
          .querySelector('span.info p')
          .classList.add('msg--error');
      }
      forgotPassForm.querySelector(
        '#email',
      ).value = '';
      forgotPassForm.querySelector(
        '.btn--green',
      ).textContent = 'Following';
    },
  );
}

if (resetPasswordForm) {
  resetPasswordForm.addEventListener(
    'submit',
    async (e) => {
      e.preventDefault();
      resetPasswordForm.querySelector(
        '.btn--green',
      ).textContent = 'Processing...';
      const token = document.querySelector(
        '.reset__pass__form',
      ).dataset.token;
      const password =
        resetPasswordForm.querySelector(
          '.reset__pass__form #password',
        ).value;
      const confirmPassword =
        resetPasswordForm.querySelector(
          '.reset__pass__form #password-confirm',
        ).value;
      await resetPassword(token, {
        password,
        confirmPassword,
      });
      resetPasswordForm.querySelector(
        '#password',
      ).value = '';
      resetPasswordForm.querySelector(
        '#password-confirm',
      ).value = '';
      resetPasswordForm.querySelector(
        '.btn--green',
      ).textContent = 'Reset password';
    },
  );
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
