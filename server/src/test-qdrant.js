import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const URL = process.env.QDRANT_URL;
const KEY = process.env.QDRANT_API_KEY;

async function testRawFetch() {
  console.log('Testing raw fetch to Qdrant Cloud...');

  // Test 1: Create collection
  const collName = 'test_raw_' + Date.now();
  console.log(`\n1. Creating collection: ${collName}`);

  try {
    const createRes = await fetch(`${URL}/collections/${collName}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'api-key': KEY,
      },
      body: JSON.stringify({
        vectors: { size: 384, distance: 'Cosine' },
      }),
    });
    const createData = await createRes.json();
    console.log('Status:', createRes.status);
    console.log('Response:', JSON.stringify(createData));
  } catch (err) {
    console.log('Fetch error:', err.message);
  }

  // Test 2: Upsert to existing collection
  console.log(`\n2. Upserting to rtq_collection`);
  try {
    const upsertRes = await fetch(`${URL}/collections/rtq_collection/points`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'api-key': KEY,
      },
      body: JSON.stringify({
        wait: true,
        points: [{
          id: 'test-123',
          vector: new Array(384).fill(0.1),
          payload: { test: 'hello' },
        }],
      }),
    });
    const upsertData = await upsertRes.json();
    console.log('Status:', upsertRes.status);
    console.log('Response:', JSON.stringify(upsertData));
  } catch (err) {
    console.log('Fetch error:', err.message);
  }

  // Test 3: Check if collection exists
  console.log(`\n3. Checking rtq_collection`);
  try {
    const checkRes = await fetch(`${URL}/collections/rtq_collection`, {
      method: 'GET',
      headers: { 'api-key': KEY },
    });
    const checkData = await checkRes.json();
    console.log('Status:', checkRes.status);
    console.log('Response:', JSON.stringify(checkData));
  } catch (err) {
    console.log('Fetch error:', err.message);
  }
}

testRawFetch().catch(console.error);
