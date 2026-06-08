const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function testBiteshipMaps() {
  const apiKey = process.env.BITESHIP_API_KEY;

  const response = await fetch('https://api.biteship.com/v1/maps/areas?countries=ID&input=Jakarta Selatan Kebayoran Lama', {
    method: 'GET',
    headers: {
      'Authorization': apiKey,
    }
  });

  const data = await response.json();
  console.log(data.areas && data.areas.length > 0 ? data.areas[0].id : 'Not found');
}

testBiteshipMaps();
