// test-torbox-v2.js
const axios = require('axios');

// CONFIGURATION
const TORBOX_API_KEY = "YOUR_ACTUAL_API_KEY_HERE"; // <-- CHANGE THIS
const TORBOX_BASE_URL = "https://api.torbox.app/v1/api/torrents";

// Test magnet link (valid example)
const TEST_MAGNET = "magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Big+Buck+Bunny&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce";

async function testTorBoxAPI() {
    console.log('🚀 Starting TorBox API Test...');
    console.log('📡 Base URL:', TORBOX_BASE_URL);
    console.log('🔑 API Key:', TORBOX_API_KEY ? `${TORBOX_API_KEY.substring(0, 10)}...` : 'NOT SET');
    
    if (!TORBOX_API_KEY || TORBOX_API_KEY === 'YOUR_ACTUAL_API_KEY_HERE') {
        console.log('\n❌ ERROR: Please set your actual TORBOX_API_KEY in the script!');
        console.log('📝 Get your API key from: https://torbox.app/settings');
        return;
    }

    try {
        // Test 1: Check if API key is valid
        console.log('\n📌 Test 1: Validating API Key...');
        const validateResponse = await axios.get(
            `${TORBOX_BASE_URL}/mylist`,
            {
                headers: {
                    'Authorization': `Bearer ${TORBOX_API_KEY}`
                },
                params: {
                    bypass_cache: "true",
                    limit: 1
                }
            }
        );
        console.log('✅ API Key is valid!');
        console.log('📊 Response:', JSON.stringify(validateResponse.data, null, 2));

        // Test 2: Add torrent with proper JSON format
        console.log('\n📌 Test 2: Adding torrent with magnet link...');
        const addResponse = await axios.post(
            `${TORBOX_BASE_URL}/createtorrent`,
            {
                magnet: TEST_MAGNET,
                seed: 3,
                allow_zip: "true"
            },
            {
                headers: {
                    'Authorization': `Bearer ${TORBOX_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 second timeout
            }
        );
        
        console.log('✅ Torrent added successfully!');
        console.log('📊 Response:', JSON.stringify(addResponse.data, null, 2));

        if (addResponse.data.success && addResponse.data.data) {
            const torrentId = addResponse.data.data.torrent_id || addResponse.data.data;
            console.log(`\n📌 Torrent ID: ${torrentId}`);
            
            // Test 3: Check torrent status
            console.log('\n📌 Test 3: Checking torrent status...');
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
            
            const statusResponse = await axios.get(
                `${TORBOX_BASE_URL}/mylist`,
                {
                    headers: {
                        'Authorization': `Bearer ${TORBOX_API_KEY}`
                    },
                    params: {
                        bypass_cache: "true",
                        id: torrentId
                    }
                }
            );
            
            console.log('✅ Status received!');
            console.log('📊 Status:', JSON.stringify(statusResponse.data, null, 2));
        }

    } catch (error) {
        console.log('\n❌ Error occurred:');
        
        if (error.response) {
            // The request was made and the server responded with a status code
            console.log('📌 Status:', error.response.status);
            console.log('📌 Headers:', error.response.headers);
            console.log('📌 Data:', JSON.stringify(error.response.data, null, 2));
            
            if (error.response.status === 401) {
                console.log('\n⚠️ Unauthorized! Please check your API key.');
                console.log('💡 Get a new API key from: https://torbox.app/settings');
            } else if (error.response.status === 400) {
                console.log('\n⚠️ Bad Request! Check the request format.');
                console.log('💡 Make sure you\'re sending the magnet link correctly.');
            }
        } else if (error.request) {
            // The request was made but no response was received
            console.log('📌 No response received from server');
            console.log('💡 Check your internet connection and TorBox server status.');
        } else {
            // Something happened in setting up the request
            console.log('📌 Error message:', error.message);
        }
    }
}

// Run the test
testTorBoxAPI();

// Export for use in other files
module.exports = { testTorBoxAPI };