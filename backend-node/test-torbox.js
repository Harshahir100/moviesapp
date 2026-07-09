const fetch = require("node-fetch");

const TORBOX_API_KEY = "b25780bb-4b70-488a-a931-6e7d48daf96c";
const MAGNET_LINK ='magnet:?xt=urn:btih:C9BDA0A39398777B146D92C8421C48BA2ED9AEF5&dn=Deadpool.2.2018.Super.Duper.Cut.UNRATED.1080p.WEBRip.x264-MP4&tr=http%3A%2F%2Fp4p.arenabg.com%3A1337%2Fannounce&tr=udp%3A%2F%2F47.ip-51-68-199.eu%3A6969%2Fannounce&tr=udp%3A%2F%2F9.rarbg.me%3A2780%2Fannounce&tr=udp%3A%2F%2F9.rarbg.to%3A2710%2Fannounce&tr=udp%3A%2F%2F9.rarbg.to%3A2730%2Fannounce&tr=udp%3A%2F%2F9.rarbg.to%3A2920%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Fopentracker.i2p.rocks%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.cyberia.is%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.dler.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Ftracker.pirateparty.gr%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.tiny-vps.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce'
async function testTorbox() {
  console.log("🧪 TorBox Test (Node.js)\n");
  console.log("1️⃣ Adding torrent...");

  const url = "https://api.torbox.app/v1/api/torrents/createtorrent";

  // ✅ Sirf Authorization — Content-Type mat daalo
  const headers = {
    Authorization: `Bearer ${TORBOX_API_KEY}`,
  };

  // ✅ URLSearchParams = form data (json nahi)
  const formData = new URLSearchParams();
  formData.append("magnet", MAGNET_LINK); // ✅ "magnet" — "magnet_link" NAHI
  formData.append("seed", "1");
  formData.append("allow_zip", "false");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: formData, // ✅ form data bhejo
    });

    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Raw:", text.slice(0, 300));

    const data = JSON.parse(text);
    console.log("Response:", data);

    if (!data.success) {
      console.log("❌ Error:", data.detail || data.error);
    } else {
      console.log("✅ Torrent added successfully!");
      console.log("Torrent ID:", typeof data.data === "object" ? data.data.torrent_id : data.data);
    }
  } catch (e) {
    console.log("❌ Exception:", e.message);
  }
}

testTorbox();