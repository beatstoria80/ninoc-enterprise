const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function testBiteship() {
  const apiKey = process.env.BITESHIP_API_KEY;
  console.log('API Key:', apiKey.substring(0, 20) + '...');

  const response = await fetch('https://api.biteship.com/v1/rates/couriers', {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      origin_postal_code: 41254, // Pamanukan
      destination_postal_code: 12240, // Jakarta Selatan
      couriers: "jne,jnt,sicepat,anteraja,ninja",
      items: [
        {
          name: "Test item",
          value: 100000,
          weight: 200,
          quantity: 1
        }
      ]
    }),
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

testBiteship();
