import "dotenv/config";
import http from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { fetchFarmerData, askQuestion } from "./client.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

function htmlPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sanjivani Sugarcane AI & MCP Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #16a05d;
      --primary-dark: #087443;
      --primary-light: #e2f7ea;
      --bg: #f4f8f5;
      --card-bg: #ffffff;
      --text-main: #173228;
      --text-muted: #6c8176;
      --border: #e2ebe5;
      --accent: #f59e0b;
      --danger: #d94b4b;
      --danger-bg: #fff0f0;
      --success: #168b52;
      --success-bg: #e6f7ed;
      --shadow: 0 14px 35px rgba(28, 76, 48, .08);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text-main);
      padding: 28px;
      line-height: 1.55;
      min-height: 100vh;
      background-image: radial-gradient(circle at 90% 0%, rgba(40, 167, 93, .1), transparent 26rem);
    }
    .container { max-width: 1440px; margin: 0 auto; }
    header {
      background: linear-gradient(120deg, #0b5e39 0%, #128150 55%, #1fa669 100%);
      color: white;
      padding: 34px 40px;
      border-radius: 24px;
      margin-bottom: 24px;
      box-shadow: 0 18px 40px rgba(16, 110, 65, .22);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      position: relative;
      overflow: hidden;
    }
    header:after { content: ''; position: absolute; width: 280px; height: 280px; border: 1px solid rgba(255,255,255,.14); border-radius: 50%; right: 6%; top: -155px; box-shadow: 0 0 0 28px rgba(255,255,255,.04), 0 0 0 58px rgba(255,255,255,.03); }
    .brand { position: relative; z-index: 1; }
    .eyebrow { text-transform: uppercase; letter-spacing: .13em; font-size: 11px; font-weight: 700; opacity: .72; margin-bottom: 8px; }
    .brand h1 { font-family: 'Space Grotesk', sans-serif; font-size: clamp(25px, 3vw, 36px); line-height: 1.1; font-weight: 700; display: flex; align-items: center; gap: 12px; }
    .brand p { font-size: 14px; opacity: .82; margin-top: 10px; }
    .header-meta { position: relative; z-index: 1; display: grid; gap: 9px; justify-items: end; }
    .badge-status {
      background: rgba(255, 255, 255, .14);
      border: 1px solid rgba(255, 255, 255, .24);
      padding: 8px 14px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 500;
      backdrop-filter: blur(10px);
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .badge-dot { width: 8px; height: 8px; background: #9af2b6; border-radius: 50%; box-shadow: 0 0 8px #9af2b6; }
    .last-updated { font-size: 11px; opacity: .7; }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 14px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 19px 20px;
      box-shadow: var(--shadow);
      transition: transform .2s, box-shadow .2s;
      min-width: 0;
    }
    .kpi-card:hover { transform: translateY(-3px); box-shadow: 0 18px 38px rgba(28, 76, 48, .12); }
    .kpi-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .kpi-icon { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 10px; background: var(--primary-light); font-size: 17px; }
    .kpi-title { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--text-muted); font-weight: 700; }
    .kpi-val { font-family: 'Space Grotesk', sans-serif; font-size: clamp(20px, 2vw, 26px); font-weight: 700; color: var(--text-main); margin-top: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .kpi-sub { color: var(--text-muted); font-size: 11px; margin-top: 4px; }
    .kpi-val.highlight-green { color: var(--success); }
    .kpi-val.highlight-red { color: var(--danger); }

    .content-grid {
      display: grid;
      grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr);
      gap: 20px;
    }
    .panel {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 24px;
      box-shadow: var(--shadow);
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
      gap: 12px;
    }
    .panel-title { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 700; color: var(--text-main); }
    .panel-kicker { font-size: 11px; color: var(--text-muted); margin-top: 3px; }
    .model-badge { font-size: 11px; color: var(--primary-dark); background: var(--primary-light); border-radius: 999px; padding: 6px 9px; white-space: nowrap; }

    .quick-queries {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      margin-bottom: 18px;
    }
    .quick-btn {
      background: var(--primary-light);
      color: var(--primary-dark);
      border: 1px solid #c8ecd4;
      padding: 8px 11px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all .2s;
    }
    .quick-btn:hover { background: #c9efd5; border-color: #9eddb2; transform: translateY(-1px); }
    
    .ask-box {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
    }
    .ask-input {
      flex: 1;
      min-width: 0;
      padding: 13px 15px;
      border: 1px solid var(--border);
      border-radius: 10px;
      font-size: 14px;
      outline: none;
      transition: border-color .2s, box-shadow .2s;
      font-family: inherit;
      background: #fbfdfb;
    }
    .ask-input:focus, .search-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(22, 160, 93, .12); }
    .ask-btn {
      background: var(--primary);
      color: white;
      border: none;
      padding: 12px 18px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background .2s, transform .2s;
    }
    .ask-btn:hover { background: var(--primary-dark); transform: translateY(-1px); }
    .ask-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .ai-response-box {
      flex: 1;
      background: linear-gradient(145deg, #f3faf5, #f8fbf9);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      font-size: 14px;
      line-height: 1.6;
      white-space: pre-wrap;
      overflow-y: auto;
      min-height: 260px;
      max-height: 430px;
    }
    .ai-response-box.empty {
      color: var(--text-muted);
      font-style: italic;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .search-box {
      margin-bottom: 13px;
      display: flex;
      gap: 8px;
    }
    .search-input {
      width: 100%;
      padding: 11px 14px;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 13px;
      outline: none;
      background: #fbfdfb;
    }
    .table-container {
      overflow-x: auto;
      max-height: 456px;
      border: 1px solid var(--border);
      border-radius: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      text-align: left;
    }
    th {
      background: #f5faf6;
      padding: 12px 13px;
      font-weight: 600;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 2;
      white-space: nowrap;
    }
    td {
      padding: 13px;
      border-bottom: 1px solid var(--border);
      color: var(--text-main);
      white-space: nowrap;
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #f7fcf8; }
    
    .pill {
      padding: 4px 8px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 600;
      display: inline-block;
    }
    .pill-paid { background: var(--success-bg); color: var(--success); }
    .pill-pending { background: var(--danger-bg); color: var(--danger); }
    .farmer-name { font-weight: 700; }
    .farmer-id { color: var(--text-muted); font-variant-numeric: tabular-nums; }
    .empty-state { text-align: center; padding: 36px 20px !important; color: var(--text-muted); }
    .empty-state strong { display: block; color: var(--text-main); margin-bottom: 4px; }
    .loading-dots { animation: pulse 1.2s ease-in-out infinite; }
    @keyframes pulse { 50% { opacity: .45; } }
    @media (max-width: 1100px) { .kpi-grid { grid-template-columns: repeat(3, 1fr); } .content-grid { grid-template-columns: 1fr; } }
    @media (max-width: 640px) {
      body { padding: 14px; }
      header { padding: 26px 22px; border-radius: 18px; }
      .header-meta { justify-items: start; }
      .kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
      .kpi-card { padding: 15px; }
      .panel { padding: 18px; border-radius: 16px; }
      .ask-box { flex-direction: column; }
      .ask-btn { justify-content: center; }
      .panel-header { align-items: flex-start; }
      .model-badge { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="eyebrow">Procurement intelligence platform</div>
        <h1>🌾 Sanjivani Sugarcane</h1>
        <p>One clear view of farmer supply, payments, and AI-powered insights.</p>
      </div>
      <div class="header-meta">
        <span class="badge-status">
          <span class="badge-dot"></span> MCP Server Active
        </span>
        <span class="last-updated" id="lastUpdated">Syncing records...</span>
      </div>
    </header>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-top"><div class="kpi-title">Total Farmers</div><span class="kpi-icon">👨‍🌾</span></div>
        <div class="kpi-val" id="kpiFarmers">--</div>
        <div class="kpi-sub">Registered growers</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-top"><div class="kpi-title">Cane Supplied</div><span class="kpi-icon">🌾</span></div>
        <div class="kpi-val" id="kpiSupply">-- Tonnes</div>
        <div class="kpi-sub">Across all villages</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-top"><div class="kpi-title">Total Billing</div><span class="kpi-icon">🧾</span></div>
        <div class="kpi-val" id="kpiTotal">₹--</div>
        <div class="kpi-sub">Procurement value</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-top"><div class="kpi-title">Total Paid</div><span class="kpi-icon">✓</span></div>
        <div class="kpi-val highlight-green" id="kpiPaid">₹--</div>
        <div class="kpi-sub" id="paidSub">Cleared payments</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-top"><div class="kpi-title">Pending Balance</div><span class="kpi-icon">◷</span></div>
        <div class="kpi-val highlight-red" id="kpiPending">₹--</div>
        <div class="kpi-sub">Needs attention</div>
      </div>
    </div>

    <div class="content-grid">
      <div class="panel">
        <div class="panel-header">
          <div><h2 class="panel-title">🤖 AI Assistant</h2><div class="panel-kicker">Ask questions about your live farmer records</div></div>
          <span class="model-badge">MCP · gpt-4o-mini</span>
        </div>

        <div class="quick-queries">
          <button class="quick-btn" onclick="askQuick('List all farmers with pending payments and the total pending amount.')">⚠️ Pending Payments</button>
          <button class="quick-btn" onclick="askQuick('Which village has the highest sugarcane supply in tonnes?')">📍 Highest Supply Village</button>
          <button class="quick-btn" onclick="askQuick('Show me all farmers from Kopargaon and their amounts.')">🏡 Kopargaon Farmers</button>
          <button class="quick-btn" onclick="askQuick('Provide an executive summary of sugarcane procurement, payment clearances, and unpaid balances.')">📊 Executive Summary</button>
        </div>

        <div class="ask-box">
          <input type="text" id="userQuestion" class="ask-input" placeholder="Ask any question about sugarcane records..." onkeydown="if(event.key==='Enter') sendQuestion()">
          <button id="sendBtn" class="ask-btn" onclick="sendQuestion()">Ask AI</button>
        </div>

        <div id="aiResponse" class="ai-response-box empty">
          <div><strong>Ready when you are</strong><br>Ask a question or choose a suggested insight above.</div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div><h2 class="panel-title">📋 Farmer Ledger</h2><div class="panel-kicker">Supply and payment status by farmer</div></div>
          <span class="model-badge" id="recordCount">Loading...</span>
        </div>

        <div class="search-box">
          <input type="search" id="searchInput" class="search-input" placeholder="Search by farmer or village..." oninput="filterTable()">
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Farmer Name</th>
                <th>Village</th>
                <th>Supply (T)</th>
                <th>Total (₹)</th>
                <th>Paid (₹)</th>
                <th>Pending (₹)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="farmerTableBody">
              <tr><td colspan="8" class="empty-state"><span class="loading-dots">Loading database records...</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <script>
    let allFarmers = [];

    async function loadFarmers() {
      try {
        const res = await fetch('/api/farmers');
        if (!res.ok) throw new Error('Unable to load farmer records');
        allFarmers = await res.json();
        renderKPIs(allFarmers);
        renderTable(allFarmers);
        document.getElementById('lastUpdated').textContent = 'Updated just now';
      } catch (err) {
        document.getElementById('farmerTableBody').innerHTML = '<tr><td colspan="8" class="empty-state"><strong>Could not load records</strong>Check that the MCP server is available and try again.</td></tr>';
        document.getElementById('lastUpdated').textContent = 'Sync failed';
      }
    }

    function money(value) {
      return '₹' + Number(value || 0).toLocaleString('en-IN');
    }

    function escapeHTML(value) {
      return String(value ?? '').replace(/[&<>"']/g, function (char) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char];
      });
    }

    function renderKPIs(data) {
      const count = data.length;
      const supply = data.reduce((sum, f) => sum + (f.supply_tonnes || 0), 0);
      const total = data.reduce((sum, f) => sum + (f.total_amount || 0), 0);
      const paid = data.reduce((sum, f) => sum + (f.amount_paid || 0), 0);
      const pending = data.reduce((sum, f) => sum + (f.pending_amount || 0), 0);
      const paidRate = total ? Math.round((paid / total) * 100) : 0;

      document.getElementById('kpiFarmers').textContent = count;
      document.getElementById('kpiSupply').textContent = supply.toLocaleString() + ' T';
      document.getElementById('kpiTotal').textContent = money(total);
      document.getElementById('kpiPaid').textContent = money(paid);
      document.getElementById('kpiPending').textContent = money(pending);
      document.getElementById('paidSub').textContent = paidRate + '% of billing cleared';
      document.getElementById('recordCount').textContent = count + ' records';
    }

    function renderTable(data) {
      const tbody = document.getElementById('farmerTableBody');
      if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><strong>No matching records</strong>Try a different farmer name or village.</td></tr>';
        return;
      }

      tbody.innerHTML = data.map(f => {
        const isPaid = (f.pending_amount || 0) === 0;
        const statusPill = isPaid 
          ? '<span class="pill pill-paid">PAID</span>'
          : '<span class="pill pill-pending">DUE ' + money(f.pending_amount) + '</span>';

        return '<tr>' +
          '<td class="farmer-id">#' + escapeHTML(f.farmer_id) + '</td>' +
          '<td class="farmer-name">' + escapeHTML(f.farmer_name) + '</td>' +
          '<td>' + escapeHTML(f.village) + '</td>' +
          '<td>' + escapeHTML(f.supply_tonnes) + '</td>' +
          '<td>' + money(f.total_amount) + '</td>' +
          '<td>' + money(f.amount_paid) + '</td>' +
          '<td>' + money(f.pending_amount) + '</td>' +
          '<td>' + statusPill + '</td>' +
        '</tr>';
      }).join('');
    }

    function filterTable() {
      const q = document.getElementById('searchInput').value.toLowerCase().trim();
      if (!q) {
        renderTable(allFarmers);
        return;
      }
      const filtered = allFarmers.filter(f => 
        (f.farmer_name && f.farmer_name.toLowerCase().includes(q)) ||
        (f.village && f.village.toLowerCase().includes(q))
      );
      renderTable(filtered);
    }

    function askQuick(prompt) {
      document.getElementById('userQuestion').value = prompt;
      sendQuestion();
    }

    async function sendQuestion() {
      const input = document.getElementById('userQuestion');
      const btn = document.getElementById('sendBtn');
      const resBox = document.getElementById('aiResponse');
      const question = input.value.trim();

      if (!question) return;

      btn.disabled = true;
      btn.textContent = 'Thinking...';
      resBox.className = 'ai-response-box';
      resBox.textContent = '⏳ Querying MCP server and analyzing sugarcane database with AI...';

      try {
        const resp = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question })
        });
        const result = await resp.json();
        if (result.error) {
          resBox.textContent = '⚠️ Error: ' + result.error;
        } else {
          resBox.textContent = result.answer;
        }
      } catch (err) {
        resBox.textContent = '⚠️ Connection error: ' + (err.message || 'Please try again.');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Ask AI';
      }
    }

    loadFarmers();
  </script>
</body>
</html>`;
}

const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET / -> Web UI
  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(htmlPage());
    return;
  }

  // GET /api/farmers -> JSON
  if (req.method === "GET" && url.pathname === "/api/farmers") {
    try {
      const data = await fetchFarmerData();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message || "Failed to fetch farmers" }));
    }
    return;
  }

  // POST /api/ask -> Answer query with AI
  if (req.method === "POST" && url.pathname === "/api/ask") {
    let body = "";
    req.on("data", (chunk: Buffer) => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        const parsed = JSON.parse(body || "{}");
        const question = parsed.question || "List all farmers with pending payments";
        const answer = await askQuestion(question);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ question, answer }));
      } catch (err: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message || "Failed to process query" }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("\n=======================================================");
  console.log(`🌾 Sanjivani AI Web Server running!`);
  console.log(`🌐 Local URL:  http://localhost:${PORT}`);
  console.log(`🔌 MCP Server: Active`);
  console.log("=======================================================\n");
});
