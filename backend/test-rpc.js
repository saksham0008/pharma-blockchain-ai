const https = require("https");

const urls = [
  "https://80002.rpc.thirdweb.com",
  "https://polygon-amoy.blockpi.network/v1/rpc/public",
  "https://rpc.ankr.com/polygon_amoy"
];

const body = JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 });

function testUrl(url) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
      timeout: 8000
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.result) {
            resolve({ url, ok: true, blockNumber: json.result });
          } else {
            resolve({ url, ok: false, error: JSON.stringify(json) });
          }
        } catch (e) {
          resolve({ url, ok: false, error: "Invalid JSON: " + data.slice(0, 100) });
        }
      });
    });
    req.on("error", (e) => resolve({ url, ok: false, error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ url, ok: false, error: "Timeout" }); });
    req.write(body);
    req.end();
  });
}

(async () => {
  for (const url of urls) {
    const result = await testUrl(url);
    if (result.ok) {
      console.log("WORKS: " + result.url + " (block: " + result.blockNumber + ")");
    } else {
      console.log("FAILED: " + result.url + " => " + result.error);
    }
  }
})();
