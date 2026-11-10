import {clean} from './http.js';

const socialHosts = ['instagram.com', 'youtube.com', 'youtu.be'];
const interests = ['Create content', 'Promote the drop', 'Sell the collection'];

function socialUrl(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && socialHosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch { return false; }
}

export function creatorApplication(input = {}) {
  const name = clean(input.name, 80);
  const email = clean(input.email, 120).toLowerCase();
  const interest = clean(input.interest, 40);
  const social_link = clean(input.socialLink, 500);
  const second_link = clean(input.secondLink, 500);
  const message = clean(input.message, 600);
  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || !interests.includes(interest) || !socialUrl(social_link) || (second_link && !socialUrl(second_link))) {
    throw new Error('Enter a valid name, email, interest, and Instagram or YouTube link.');
  }
  return {name, email, interest, social_link, second_link, message};
}

export function checkoutDetails(input = {}) {
  const customer = input.customer || {};
  const quantity = Number(input.quantity);
  const name = clean(customer.name, 100);
  const email = clean(customer.email, 180).toLowerCase();
  const phone = clean(customer.phone, 15);
  const address = clean(customer.address, 300);
  const city = clean(customer.city, 80);
  const state = clean(customer.state, 80);
  const pincode = clean(customer.pincode, 6);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10 || name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || !/^\d{10}$/.test(phone) || address.length < 5 || city.length < 2 || state.length < 2 || !/^\d{6}$/.test(pincode)) {
    throw new Error('Please provide valid contact and delivery details.');
  }
  return {quantity, name, email, phone, address, city, state, pincode};
}
