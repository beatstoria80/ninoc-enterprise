const http = require('http');

const data = JSON.stringify({
  items: [
    {
      id: "some_product_id", // We need a real product ID from DB, or we can just see if it fails at the DB fetch
      name: "Test",
      price: 10000,
      quantity: 1
    }
  ],
  customerDetails: {
    first_name: "Test",
    last_name: "User",
    phone: "081234567890",
    email: "test@example.com",
    address: "Jl Test",
    city: "Jakarta",
    postal_code: "12345",
  },
  shippingDetails: {
    method: "jne",
    cost: 15000
  },
  promo: null,
  fees: { tax: 0, platformFee: 2500 },
  totalPrice: 27500
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/checkout',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`BODY: ${body}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
