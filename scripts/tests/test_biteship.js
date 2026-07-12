require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.BITESHIP_API_KEY;

async function testBiteship() {
  console.log('🔍 Testing Biteship Live API connection...');
  if (!API_KEY) {
    console.error('❌ BITESHIP_API_KEY not found in .env.local');
    return;
  }
  console.log(`Key Prefix: ${API_KEY.substring(0, 15)}...`);

  try {
    // 1. Test Couriers list
    console.log('\n--- 1. Testing GET /v1/couriers ---');
    const resCouriers = await fetch('https://api.biteship.com/v1/couriers', {
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json',
      },
    });
    const dataCouriers = await resCouriers.json();
    console.log(`Status: ${resCouriers.status}`);
    if (resCouriers.ok) {
      console.log('✅ Couriers fetched successfully! Total couriers:', dataCouriers.couriers?.length);
    } else {
      console.log('❌ Couriers fetch error:', JSON.stringify(dataCouriers, null, 2));
    }

    // 2. Test Rates
    console.log('\n--- 2. Testing POST /v1/rates/couriers ---');
    const resRates = await fetch('https://api.biteship.com/v1/rates/couriers', {
      method: 'POST',
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin_latitude: -6.917464,
        origin_longitude: 107.619123,
        destination_latitude: -6.208763,
        destination_longitude: 106.845599,
        couriers: 'jne,jnt,sicepat',
        items: [{
          name: 'Test Item',
          description: 'Test Description',
          value: 100000,
          weight: 500,
          quantity: 1
        }]
      })
    });
    const dataRates = await resRates.json();
    console.log(`Status: ${resRates.status}`);
    if (resRates.ok) {
      console.log('✅ Rates fetched successfully! Total pricing rates:', dataRates.pricing?.length);
    } else {
      console.log('❌ Rates fetch error:', JSON.stringify(dataRates, null, 2));
    }

  } catch (err) {
    console.error('Error testing Biteship:', err.message);
  }
}

testBiteship();
