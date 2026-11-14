import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { createCrisisAgents } from "./multi-agent.mjs";

const envPath = new URL("./.env", import.meta.url);
if (existsSync(envPath)) for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (match && !(match[1] in process.env)) process.env[match[1]] = match[2].replace(/^("|')(.*)\1$/, "$2");
}

const port = 5177;
const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const emergency = /\b(112|emergency|trapped|fire|injur|rescue|danger|evacuat)\b/i;
const history = [];
const snapshots = new Map();
const DEPARTMENTS = new Set(["hospital", "water", "emergency", "telecom"]);
const PRIORITIES = new Set(["Critical", "High", "Medium", "Low"]);
const SEVERITIES = new Set(["Severe", "Moderate", "Low", "None"]);
const scrypt = promisify(scryptCallback);
const authDirectory = new URL("./data/", import.meta.url);
const authUsersFile = new URL("./data/auth-users.json", import.meta.url);
const sessions = new Map();
mkdirSync(authDirectory, { recursive: true });
let authUsers = existsSync(authUsersFile) ? JSON.parse(readFileSync(authUsersFile, "utf8")) : [];
const crisisFile = new URL("./data/crisis-workflow.json", import.meta.url);
const agents = createCrisisAgents({ file: crisisFile, snapshots, appendAction: (record) => { history.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...record }); } });

function safeUser(user) {
  return { id: user.id, userId: user.userId, fullName: user.fullName, email: user.email, mobile: user.mobile, role: user.role, state: user.state, district: user.district };
}
function tokenFromRequest(req) {
  const match = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
  return match?.[1] || "";
}
function sessionUser(req) {
  const token = tokenFromRequest(req);
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) { sessions.delete(token); return null; }
  return authUsers.find((user) => user.id === session.userId) || null;
}
function isGovernment(user) { return Boolean(user && String(user.role || "").startsWith("Government Officer")); }
function requireUser(req, res) { const user = sessionUser(req); if (!user) { json(res, 401, { error: "Sign in to use this chatbot feature." }); return null; } return user; }
function requireGovernment(req, res) { const user = requireUser(req, res); if (user && !isGovernment(user)) { json(res, 403, { error: "Government authorization is required for this operation." }); return null; } return user; }
function saveAuthUsers() { writeFileSync(authUsersFile, JSON.stringify(authUsers, null, 2), "utf8"); }
async function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  return { salt, hash: (await scrypt(password, salt, 64)).toString("hex") };
}
async function verifyPassword(password, user) {
  const expected = Buffer.from(user.passwordHash, "hex");
  const actual = Buffer.from((await scrypt(password, user.passwordSalt, 64)).toString("hex"), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function validateActions(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 12).flatMap((a) => {
    if (!a || typeof a !== "object") return [];
    if (a.type === "set_allocation" && DEPARTMENTS.has(a.departmentId) && Number.isFinite(a.amount) && a.amount >= 0 && a.amount <= 10000)
      return [{ type: a.type, departmentId: a.departmentId, amount: Math.round(a.amount * 10) / 10, location: String(a.location || "Operations · India") }];
    if (a.type === "set_priority" && DEPARTMENTS.has(a.departmentId) && PRIORITIES.has(a.priority))
      return [{ type: a.type, departmentId: a.departmentId, priority: a.priority, location: String(a.location || "Operations · India") }];
    if (a.type === "set_capacity" && Number.isFinite(a.amount) && a.amount >= 0 && a.amount <= 100000)
      return [{ type: a.type, amount: Math.round(a.amount * 10) / 10, location: String(a.location || "Operations · India") }];
    if (a.type === "run_negotiation") return [{ type: a.type, location: String(a.location || "Operations Dashboard") }];
    if (a.type === "set_disaster" && ["Cyclone landfall", "Urban flooding", "Heatwave grid stress", "Earthquake aftermath", "No active disaster"].includes(a.scenario) && SEVERITIES.has(a.severity) && Number.isInteger(a.affectedZones) && a.affectedZones >= 0 && a.affectedZones <= 10000)
      return [{ type: a.type, scenario: a.scenario, severity: a.severity, affectedZones: a.affectedZones, location: String(a.location || "India") }];
    if (a.type === "admin_setting" && ["supply", "reserve", "guarantee", "severity", "type"].includes(a.field) && (typeof a.value === "string" || Number.isFinite(a.value)))
      return [{ type: a.type, field: a.field, value: a.value, location: String(a.location || "Admin configuration") }];
    if (a.type === "response_plan" && typeof a.title === "string" && typeof a.details === "string")
      return [{ type: a.type, title: a.title.slice(0, 180), details: a.details.slice(0, 1800), location: String(a.location || "India"), priority: String(a.priority || "High") }];
    return [];
  });
}

function publicFallback(question, context, historyItems = []) {
  const q = question.toLowerCase();
  const portal = context.publicPortal || {};
  const areas = Array.isArray(portal.areas) ? portal.areas : [];
  const announcements = Array.isArray(portal.announcements) ? portal.announcements : [];
  const matchedArea = areas.find((area) => q.includes(String(area.name || '').toLowerCase()));
  const facts = [];
  if (/agent|negotiat|priorit|criticalit|scarce power|limited electricity|how.*allocat/.test(q)) facts.push('ResQGrid’s multi-agent allocation simulation has department agents declare their electricity demand and current shortfall. The coordinator compares total requests with available MW, secures essential floors for higher-criticality services, then negotiates remaining supply by each agent’s unmet-demand urgency. Allocations stay within total capacity and each department’s demand. These are simulated decisions for authorized officer review, not live utility dispatch.');
  if (matchedArea) facts.push(`${matchedArea.name}${matchedArea.district ? `, ${matchedArea.district}` : ''}: ${matchedArea.status || 'status unavailable'}${Number.isFinite(Number(matchedArea.availability_pct)) ? ` (${matchedArea.availability_pct}% availability)` : ''}. These are demonstration figures, not live utility data.${matchedArea.notes ? ` Note: ${matchedArea.notes}` : ''}`);
  else if (/area|locality|power|electric|outage|status|restor/.test(q)) facts.push(areas.length ? `The portal currently shows ${areas.length} area records. Tell me the locality name and I can look up its demonstration status. These figures are not live.` : 'Area-wise live electricity data is not connected to this demonstration portal. Check your utility provider for current service information.');
  if (/alert|announcement|notice|warning|cyclone|flood/.test(q)) facts.push(announcements.length ? `Public notices currently shown on this demonstration portal: ${announcements.slice(0, 5).map((a) => `${a.category || 'Notice'}: ${a.title}${a.affected_locations ? ` (affected: ${a.affected_locations})` : ''}`).join('; ')}. Follow local authority advisories.` : 'No verified public notices are connected right now. Follow your local authorities for current advisories.');
  if (/complaint|report|fallen wire|exposed wire/.test(q)) facts.push('You can use Register Complaint on the public portal to report an outage or electrical hazard and track it with the reference number. For immediate danger or a fallen live wire, keep away and call local emergency services at 112.');
  if (/safe|safety|flood|emergency|danger|injur|trapped|fire|evacuat/.test(q)) facts.push('Follow instructions from local authorities. Stay away from flooded electrical equipment and fallen wires. If anyone is in immediate danger, call 112.');
  if (/^(why|how so|tell me more|what about|and then|can you explain|which one|them|that|it)\b/.test(q) && historyItems.length) facts.push('I can continue from our recent chat. The portal’s area and notice figures are demonstration data, not live.');
  if (!facts.length) facts.push('I can help with public electricity information, emergency notices, safety guidance, complaints, and ResQGrid portal help. For questions about current outages or emergencies, use official utility and local authority sources.');
  return { reply: facts.join("\n\n"), actions: [] };
}
function fallback(question, context, historyItems = []) {
  const q = question.toLowerCase();
  const ops = context.operations?.operations || context.operations;
  const city = context.city?.city || context.city;
  const admin = context.admin;
  const facts = [];
  if (ops && /situation|disaster|status|affected/.test(q)) facts.push(`Operations dashboard is simulated: ${ops.disaster?.scenario || "scenario not set"}, severity ${ops.disaster?.severity || "unavailable"}, ${ops.disaster?.affectedZones ?? "unknown"} affected zones.`);
      if (ops && /allocat|electric|power|hospital|shortage|priority|resource|urgency|criticality|negotiat/.test(q)) {
    const departments = Array.isArray(ops.departments) ? ops.departments : [];
    const requested = departments.reduce((sum, d) => sum + Number(d.demand || 0), 0);
    const allocated = departments.reduce((sum, d) => sum + Number(d.allocated || 0), 0);
    facts.push(`Current simulated Operations snapshot: ${departments.map((d) => `${d.name} ${d.allocated}/${d.demand} MW allocated/requested, ${d.priority} criticality`).join("; ") || "no department data available"}; ${Number(ops.capacity ?? 0)} MW available against ${requested} MW requested (${Math.max(0, requested - allocated)} MW currently unmet). The negotiation uses priority essential floors first, then current unmet-demand share as urgency within each tier.`);
  }
  if (city && /area|city|india|state|district|hospital|shortage|power|electric|affected|resource/.test(q)) facts.push(`City Monitoring currently has simulated area telemetry for Visakhapatnam only (${(city.areas || []).length} areas). Nationwide live disaster and power feeds are not connected; no India-wide live situation is available.`);
  if (city && /shortage|power|electric|affected|area/.test(q)) {
    const areas = [...(city.areas || [])].sort((a, b) => Number(a.pct ?? 100) - Number(b.pct ?? 100)).slice(0, 5);
    if (areas.length) facts.push(`Lowest simulated area supply: ${areas.map((a) => `${a.name}: ${a.pct ?? "?"}% (${a.available ?? "?"}/${a.demand ?? "?"} MW), ${a.status || "status unavailable"}`).join("; ")}.`);
  }
  if (city && /hospital|critical service|emergency power|facility/.test(q)) {
    const hospitals = (city.facilities || []).filter((f) => f.category === "hospital").sort((a, b) => Number(a.supplied || 0) / Math.max(Number(a.required || 0.1), 0.1) - Number(b.supplied || 0) / Math.max(Number(b.required || 0.1), 0.1)).slice(0, 6);
    if (hospitals.length) facts.push(`Hospital supply estimates (simulated): ${hospitals.map((f) => `${f.name}, ${f.areaName}: ${f.supplied ?? "?"}/${f.required ?? "?"} MW, ${f.priority || "priority unavailable"}`).join("; ")}.`);
  }
  if (admin && /admin|configuration|supply|priority|report|severity/.test(q)) facts.push(`Admin configuration is simulated: ${admin.config?.supply ?? "unknown"} MW supply, scenario ${admin.config?.type ?? "unknown"}, severity ${admin.config?.severity ?? "unknown"}/5.`);
  if (/^(why|how so|tell me more|what about|and then|can you explain|which one|them|that|it)\b/.test(q) && historyItems.length) facts.push("I can use the recent conversation, but dashboard metrics remain simulated.");
  if (/^show|^find|^identify|^prioriti|^allocate|^generate|^prepare|^create/.test(q) && !facts.length) facts.push("I can prepare a draft from the data connected to this dashboard. Nationwide live conditions are unavailable, so I will not infer live events or figures.");
  if (!facts.length) facts.push("I can explain the connected simulated dashboard data, help prioritize services, or prepare an action draft. No live nationwide disaster feed is connected.");
  if (emergency.test(question)) facts.push("If anyone is in immediate danger, contact local emergency services at 112. This assistant cannot dispatch responders.");
  const actions = [];
  if (ops && Array.isArray(ops.departments)) {
    if (/\b(set|change|update)\b.*\bpriorit/i.test(q)) for (const d of ops.departments) {
      const priority = ["hospital", "emergency"].includes(d.id) ? "Critical" : d.id === "water" ? "High" : d.priority;
      if (priority && priority !== d.priority) actions.push({ type: "set_priority", departmentId: d.id, priority, location: "Operations · simulated departments" });
    }
    if (/\b(run|start|simulate|apply|negotiate|allocate|distribute)\b/.test(q) && /negotiat|allocat|distribut|resource|power/i.test(q)) actions.push({ type: "run_negotiation", location: "Operations · simulated multi-agent resource negotiation" });
    if (/response plan|emergency plan|prepare a plan|generate.*plan/i.test(q)) actions.push({ type: "response_plan", title: "Draft emergency response plan", location: "Operations · simulated dashboard data", priority: "Critical", details: `Review the current ${ops.disaster?.scenario || "scenario"} report, confirm verified local conditions, prioritize hospitals and emergency services, run the approved multi-agent resource negotiation against ${ops.capacity ?? "current"} MW capacity, and coordinate with official local responders. All supplied dashboard figures are simulated.` });
  }
  return { reply: facts.join("\n\n"), actions };
}

const actionSchema = {
  type: "ARRAY", items: { type: "OBJECT", properties: {
    type: { type: "STRING", enum: ["set_allocation", "set_priority", "set_capacity", "set_disaster", "admin_setting", "response_plan", "run_negotiation"] },
    departmentId: { type: "STRING" }, amount: { type: "NUMBER" }, priority: { type: "STRING" },
    scenario: { type: "STRING" }, severity: { type: "STRING" }, affectedZones: { type: "INTEGER" },
    field: { type: "STRING" }, value: { type: "STRING" }, title: { type: "STRING" }, details: { type: "STRING" }, location: { type: "STRING" },
  }, required: ["type"] },
};

async function respond(question, body, platform) {
  const context = { ...platform, ...(body.context || {}) };
  if (!apiKey) return body.context?.app === "public" ? publicFallback(question, context, body.history) : fallback(question, context, body.history);
  const contents = [...(Array.isArray(body.history) ? body.history.slice(-8) : []).map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: String(m.text || "").slice(0, 3000) }] })),
    { role: "user", parts: [{ text: `Current connected ResQGrid dashboard data (values tagged simulated are NOT live): ${JSON.stringify(context).slice(0, 20000)}\n\nUser request: ${question}` }] }];
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: body.context?.app === "public"
      ? `You are the ResQGrid Public Assistant. Answer clearly and conversationally, like a helpful search assistant, and follow the requested language (${String(body.context?.language || "English").slice(0, 40)}). Explain that ResQGrid demonstrates department agents declaring electricity demand, securing essential supply by criticality, and negotiating scarce remaining MW by unmet-demand urgency. Answer ordinary general questions using general knowledge. For ResQGrid outage, alert, location, or restoration claims, rely only on supplied portal data; label demonstration data as simulated and never claim it is live. Do not invent current events or official notices. Do not propose or perform government actions or claim to dispatch responders. Give concise safety guidance and direct immediate emergencies to local emergency services at 112. If portal data does not answer a current question, say so and point to official local sources.`
      : "You are ResQGrid’s multi-agent electricity resource coordinator. Use the supplied Operations snapshot. Department agents declare demand and current allocation; criticality determines essential floors, current unmet-demand share is urgency within each tier, and a coordinator negotiates remaining MW without exceeding total available capacity or any department’s demand. Explain the agent dialogue and tradeoffs using the actual snapshot. Never invent urgency or facts not present in data. Clearly label prototype data and recommendations as simulated. For information requests, explain the process and current snapshot. For explicit requests to run a negotiation, prioritize departments, change configuration, or create a response plan, return concise reasoning plus structured proposed actions only. NEVER execute actions; every action must await the officer's SUBMIT approval. When asked to run a negotiation, prefer the run_negotiation action so the dashboard uses its shared simulation algorithm rather than guessing individual allocations. Do not claim to contact authorities or dispatch responders. Include immediate safety advice to contact 112 when relevant." }] }, contents, generationConfig: { temperature: 0.2, maxOutputTokens: 1000, responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { reply: { type: "STRING" }, actions: actionSchema }, required: ["reply", "actions"] } } }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || "Gemini API request failed");
  const raw = payload.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
  if (!raw) throw new Error("Gemini returned an empty response");
  const result = JSON.parse(raw);
  const actions = body.context?.app === "public" ? [] : validateActions(result.actions).filter((action) => {
    if (action.type === "admin_setting") return body.context?.app === "admin" && context.admin?.canConfigure === true;
    if (action.type === "run_negotiation") return body.context?.app !== "admin" || context.admin?.canRun === true;
    return true;
  });
  return { reply: String(result.reply || "").slice(0, 5000), actions };
}

function json(res, status, data) { res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }).end(JSON.stringify(data)); }
async function readBody(req) {
  let raw = "";
  for await (const chunk of req) { raw += chunk; if (raw.length > 100_000) throw new Error("Request too large"); }
  return JSON.parse(raw || "{}");
}
const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.CHAT_ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.writeHead(204).end();
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (req.method === "GET" && url.pathname === "/api/health") return json(res, 200, { ok: true, geminiConfigured: Boolean(apiKey), model: apiKey ? model : null });
    if (req.method === "POST" && url.pathname === "/api/auth/signup") {
      const body = await readBody(req);
      const fullName = String(body.fullName || "").trim();
      const email = String(body.email || "").trim().toLowerCase();
      const mobile = String(body.mobile || "").replace(/\D/g, "");
      const password = String(body.password || "");
      const role = String(body.role || "public").slice(0, 40);
      if (!['public', 'government'].includes(body.portal)) return json(res, 400, { error: "Choose Public or Government registration." });
      const isGovernmentRegistration = body.portal === "government";
      if (isGovernmentRegistration !== role.startsWith("Government Officer")) return json(res, 400, { error: "The selected registration type does not match this portal." });
      if (isGovernmentRegistration) return json(res, 403, { error: "Government accounts must be provisioned by an authorized administrator." });
      if (!isGovernmentRegistration && body.acceptedTerms !== true) return json(res, 400, { error: "Accept the public portal terms before creating an account." });
      if (isGovernmentRegistration && body.acceptedTerms !== true) return json(res, 400, { error: "Confirm your officer registration details before continuing." });
      if (fullName.length < 3 || fullName.length > 100) return json(res, 400, { error: "Enter a name between 3 and 100 characters." });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json(res, 400, { error: "Enter a valid email address." });
      if (mobile && !/^\d{10,15}$/.test(mobile)) return json(res, 400, { error: "Enter a valid phone number." });
      if (password.length < 8 || password.length > 128) return json(res, 400, { error: "Use a password between 8 and 128 characters." });
      if (authUsers.some((user) => user.email === email || (mobile && user.mobile === mobile))) return json(res, 409, { error: "An account with that email or phone number already exists." });
      const credentials = await hashPassword(password);
      const user = { id: randomBytes(16).toString("hex"), userId: `RG-${randomBytes(4).toString("hex").toUpperCase()}`, fullName, email, mobile, role, state: String(body.state || "").slice(0, 80), district: String(body.district || "").slice(0, 80), passwordSalt: credentials.salt, passwordHash: credentials.hash, createdAt: new Date().toISOString() };
      authUsers.push(user);
      saveAuthUsers();
      return json(res, 201, { ok: true, user: safeUser(user) });
    }
    if (req.method === "POST" && url.pathname === "/api/auth/signin") {
      const body = await readBody(req);
      if (!['public', 'government'].includes(body.portal)) return json(res, 400, { error: "Choose the Public or Government Sign In page." });
      const identifier = String(body.identifier || "").trim().toLowerCase();
      const user = authUsers.find((item) => item.email === identifier || item.userId.toLowerCase() === identifier || (item.mobile && item.mobile === identifier.replace(/\D/g, "")));
      if (!user || !(await verifyPassword(String(body.password || ""), user))) return json(res, 401, { error: "Email, user ID, or password is incorrect." });
      const isGovernmentUser = String(user.role || "").startsWith("Government Officer");
      if (body.portal === "government" && !isGovernmentUser) return json(res, 403, { error: "This account is not registered for the Government Portal." });
      if (body.portal === "public" && isGovernmentUser) return json(res, 403, { error: "Government accounts must use the Officer Login page." });
      const token = randomBytes(32).toString("hex");
      sessions.set(token, { userId: user.id, expiresAt: Date.now() + 12 * 60 * 60 * 1000 });
      return json(res, 200, { ok: true, token, user: safeUser(user) });
    }
    if (req.method === "GET" && url.pathname === "/api/auth/session") {
      const user = sessionUser(req);
      if (!user) return json(res, 401, { error: "Your session is no longer valid. Please sign in again." });
      return json(res, 200, { ok: true, user: safeUser(user) });
    }
    if (req.method === "POST" && url.pathname === "/api/auth/signout") {
      const token = tokenFromRequest(req);
      if (token) sessions.delete(token);
      return json(res, 200, { ok: true });
    }
    if (req.method === "POST" && url.pathname === "/api/chat") {
      const body = await readBody(req); const question = String(body.message || "").trim();
      if (!question || question.length > 4000) return json(res, 400, { error: "Enter a message up to 4,000 characters." });
      const user = sessionUser(req);
      if (user && isGovernment(user)) {
        const q = question.toLowerCase();
        const location = ["Visakhapatnam", "Vijayawada", "Andhra Pradesh", "India"].find((x) => q.includes(x.toLowerCase())) || user.district || user.state || "India";
        if (/\b(show|find|list|report|which|how many|status|monitor)\b/.test(q) && /\b(request|requests|hospital|affected|priority|critical|assistance|report)\b/.test(q) && !/\b(allocate|allocation|negotiate|negotiation)\b/.test(q)) {
          const all = agents.read().requests;
          const matching = all.filter((r) => (location === "India" || r.location.toLowerCase().includes(location.toLowerCase()) || r.location.toLowerCase().includes("andhra pradesh") && location === "Visakhapatnam") && (!/hospital/.test(q) || r.service === "hospital") && (!/critical/.test(q) || r.assessment?.level === "Critical"));
          return json(res, 200, { reply: matching.length ? `${matching.length} authorized request(s)${location !== "India" ? ` in ${location}` : ""}: ${matching.map((r) => `${r.id} — ${r.service}, ${r.location}, ${r.quantity ?? "quantity unknown"} ${r.resource || "units"}, ${r.assessment?.level || "pending"} (${r.assessment?.score ?? "?"}/100), status ${r.status}`).join("; ")}` : `No matching requests are currently recorded${location !== "India" ? ` for ${location}` : ""}.`, actions: [] });
        }
        if (/\b(allocate|allocation|negotiate|negotiation)\b/.test(q) && /\b(request|requests|resource|resources|critical|hospital|assist|support|allocate|allocation|negotiate|negotiation)\b/.test(q)) {
          const data = agents.read(); const matching = data.requests.filter((r) => r.status !== "allocated" && r.status !== "partially allocated" && (location === "India" || r.location.toLowerCase().includes(location.toLowerCase()) || r.location.toLowerCase().includes("andhra pradesh") && location === "Visakhapatnam"));
          if (!matching.length) return json(res, 200, { reply: `I found no pending public requests for ${location} in the request database.`, actions: [] });
          const negotiation = agents.negotiate({ location, resource: /water/.test(q) ? "water" : "electricity", requests: matching });
          const summary = negotiation.allocations.map((a) => `${a.requestId}: ${a.amount}/${a.requested} ${negotiation.resource} (${a.priority.level}, score ${a.priority.score})`).join("; ");
          return json(res, 200, { reply: `The request-analysis, priority, resource-management, and negotiation agents reviewed ${matching.length} request(s) in ${location}. Available snapshot capacity: ${negotiation.capacity}; requested: ${negotiation.requested}. Proposal: ${summary}. This is a prototype allocation based on connected simulated capacity. Review and submit to execute.`, actions: [{ type: "run_negotiation", negotiationId: negotiation.id, location: `${location} · ${negotiation.resource} proposal` }] });
        }
      }
      if (user && !isGovernment(user) && /\b(report|requests?|requesting|requested|needs?|requiring|require|urgent|emergency)\b/.test(question.toLowerCase()) && /\b(hospital|water|electric|power|oxygen|supply|rescue|disaster|assistance|units?|mw)\b/.test(question.toLowerCase())) {
        const request = agents.createRequest(question, user);
        return json(res, 201, { reply: `Your emergency request was saved as ${request.id} and is now available to government priority assessment. Initial priority: ${request.assessment.level} (${request.assessment.score}/100; ${request.assessment.reasons.join(", ")}).${request.missing.length ? ` Please provide the missing ${request.missing.join(", ")} in your next message.` : ""}`, actions: [] });
      }
      if (user && !isGovernment(user)) {
        const ref = question.match(/\bRQ-[\w-]+\b/i)?.[0];
        if (ref) { const own = agents.read().requests.find((r) => r.id.toLowerCase() === ref.toLowerCase() && r.ownerId === user.id); return json(res, 200, { reply: own ? `Request ${own.id}: ${own.status}. Priority ${own.assessment?.level || "pending"}.${own.allocated != null ? ` Allocated ${own.allocated} units.` : ""}` : "I could not find that request in your account." , actions: [] }); }
      }
      const app = user ? (isGovernment(user) ? "government" : "public") : "public";
      const trustedContext = app === "public"
        ? { app, publicPortal: body.context?.publicPortal }
        : { ...Object.fromEntries(snapshots), app, ...(user && isGovernment(user) ? { crisisRequests: agents.read().requests } : {}) };
      body.context = trustedContext;
      let result;
      try { result = await respond(question, body, app === "government" ? Object.fromEntries(snapshots) : {}); }
      catch (err) { console.error("Gemini chat error:", err.message); result = app === "public" ? publicFallback(question, trustedContext, body.history) : fallback(question, trustedContext, body.history); result.reply += "\n\nAI is temporarily unavailable. This answer uses connected data only."; }
      if (app === "public") result.actions = [];
      return json(res, 200, result);
    }
    if (req.method === "POST" && url.pathname === "/api/platform/snapshot") {
      if (!requireGovernment(req, res)) return;
      const body = await readBody(req); const app = String(body.app || "");
      if (!["operations", "city", "admin", "main"].includes(app)) return json(res, 400, { error: "Unknown ResQGrid service." });
      snapshots.set(app, { ...body.data, simulated: true, observedAt: new Date().toISOString() });
      return json(res, 202, { ok: true });
    }
    if (req.method === "GET" && url.pathname === "/api/platform/snapshot") { if (!requireGovernment(req, res)) return; return json(res, 200, Object.fromEntries(snapshots)); }
    if (req.method === "GET" && url.pathname === "/api/requests") {
      const user = requireUser(req, res); if (!user) return;
      const rows = agents.read().requests;
      return json(res, 200, { requests: isGovernment(user) ? rows : rows.filter((r) => r.ownerId === user.id) });
    }
    if (req.method === "POST" && url.pathname === "/api/negotiations/approve") {
      if (!requireGovernment(req, res)) return;
      const body = await readBody(req); const result = agents.approveNegotiation(String(body.id || ""));
      if (result.error) return json(res, 409, { error: result.error });
      return json(res, 200, { ok: true, ...result });
    }
    if (req.method === "POST" && url.pathname === "/api/actions") {
      const actor = requireGovernment(req, res); if (!actor) return;
      const body = await readBody(req); const actions = validateActions(body.actions);
      if (!Array.isArray(body.actions) || actions.length !== body.actions.length) return json(res, 400, { error: "One or more proposed actions are invalid or unsupported. Review the proposal and try again." });
      if (!actions.length) return json(res, 400, { error: "No valid actions to submit." });
      const negotiation = body.actions.find((a) => a?.type === "run_negotiation" && a.negotiationId);
      if (negotiation) { const result = agents.approveNegotiation(String(negotiation.negotiationId)); if (result.error) return json(res, 409, { error: result.error }); const published = snapshots.get("operations"); const ops = published?.operations || published; const ids = new Set(result.negotiation.allocations.map((a) => a.service)); const executed = (ops?.departments || []).filter((d) => ids.has(d.id)).map((d) => ({ type: "set_allocation", departmentId: d.id, amount: Number(d.allocated || 0), location: result.negotiation.location })); return json(res, 201, { id: result.negotiation.id, source: "government-negotiation", submittedAt: result.negotiation.approvedAt, actions: executed, negotiation: result.negotiation }); }
      const ops = snapshots.get("operations");
      if (ops) {
        const departments = Array.isArray(ops.departments) ? ops.departments.map((d) => ({ ...d })) : [];
        let capacity = Number(ops.capacity);
        for (const action of actions) {
          if (action.type === "set_allocation") {
            const dept = departments.find((d) => d.id === action.departmentId);
            if (!dept || action.amount > Number(dept.demand) + 0.001) return json(res, 400, { error: `The proposed allocation for ${dept?.name || action.departmentId} exceeds its current demand or has stale dashboard data. Refresh the proposal and review it again.` });
            const others = departments.filter((d) => d.id !== action.departmentId).reduce((sum, d) => sum + Number(d.allocated), 0);
            if (action.amount + others > capacity + 0.001) return json(res, 400, { error: `The proposed allocation exceeds available Operations capacity (${capacity} MW). Refresh the proposal and review it again.` });
            dept.allocated = action.amount;
          }
          if (action.type === "set_capacity") {
            const current = departments.reduce((sum, d) => sum + Number(d.allocated), 0);
            if (action.amount + 0.001 < current) return json(res, 400, { error: `Capacity cannot be reduced below current allocations (${current} MW) in this proposal. Submit reviewed allocation reductions first.` });
            capacity = action.amount;
          }
        }
      }
      const record = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, source: String(body.source || "dashboard"), submittedAt: new Date().toISOString(), actions };
      history.push(record); if (history.length > 100) history.shift();
      return json(res, 201, record);
    }
    if (req.method === "GET" && url.pathname === "/api/actions") {
      if (!requireGovernment(req, res)) return;
      const after = Number(url.searchParams.get("after") || 0);
      return json(res, 200, { actions: history.filter((r) => Number(r.id.split("-")[0]) > after) });
    }
    return json(res, 404, { error: "Not found" });
  } catch (error) { return json(res, 400, { error: error.message === "Request too large" ? error.message : "Could not process request." }); }
});
server.on("error", (error) => {
  console.error(error.code === "EADDRINUSE" ? `ResQGrid Chatbot API cannot start: 127.0.0.1:${port} is already in use.` : `ResQGrid Chatbot API failed to start: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => console.log(`ResQGrid chat API listening on http://127.0.0.1:${port}${apiKey ? ` (Gemini ${model})` : " (Gemini key not configured; safe fallback enabled)"}`));
