require('dotenv').config({path: '.env.local'});
const { GoogleAdsApi } = require('google-ads-api');

const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/[^0-9]/g, '');
const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/[^0-9]/g, '');

const client = new GoogleAdsApi({
  client_id: clientId,
  client_secret: clientSecret,
  developer_token: developerToken,
});

const customer = client.Customer({
  customer_id: customerId,
  login_customer_id: loginCustomerId,
  refresh_token: refreshToken,
});

console.log('Using customer ID:', customerId);
console.log('Using login customer ID:', loginCustomerId);

customer.query('SELECT campaign.id FROM campaign LIMIT 1')
  .then(res => console.log('SUCCESS:', res))
  .catch(err => console.error('ERROR:', err.message || err));
