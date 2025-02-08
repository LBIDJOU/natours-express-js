/* eslint-disable */
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { showAlert } from './alerts';

const initializeStripe = async () => {
  return await loadStripe(
    'pk_test_51QoBK7IZM56ILxGhaVBoJ7DI2YmhiNSxsDp2G9M4JDGOEghePTXlA4LuuCafSIzxUTRTSajqaoYJ3COugcZ8TFUA0052CfvxIW',
  );
};

const stripe = await initializeStripe();
// const stripe = Stripe(
//   'pk_test_51QoBK7IZM56ILxGhaVBoJ7DI2YmhiNSxsDp2G9M4JDGOEghePTXlA4LuuCafSIzxUTRTSajqaoYJ3COugcZ8TFUA0052CfvxIW',
// );

export const bookTour = async (tourId) => {
  try {
    // 1-> Get the checkout session from the server
    const session = await axios.get(
      `/api/v1/bookings/checkout-session/${tourId}`,
    );
    // console.log(session);
    // 2-> Use stripe object to create checkout form & charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (error) {
    showAlert('error', error);
    // console.log(error);
  }
};
