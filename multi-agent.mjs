import { existsSync, readFileSync, writeFileSync } from "node:fs";

// Deterministic specialist agents. Their structured messages are persisted as an audit trail.
export function createCrisisAgents({ file, snapshots, appendAction }) {
  const read = () => existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { requests: [], negotiations: [], notifications: [] };
  const save = (data) => writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
  const emit = (from, to, type, payload) => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, from, to, type, payload, at: new Date().toISOString() });
  const normalize = (s) => String(s || "").toLowerCase();
  function analyze(text, user) {
    const q = normalize(text);
    const location = ["Visakhapatnam", "Vijayawada", "Andhra Pradesh", "India"].find((x) => q.includes(x.toLowerCase())) || user?.district || user?.state || "Unspecified";
    const resource = /electric|power|electricity|mw|unit/.test(q) ? "electricity" : /water/.test(q) ? "water" : /oxygen/.test(q) ? "oxygen" : /food|meal/.test(q) ? "food" : null;
    const qtyMatch = q.match(/\b(\d+(?:\.\d+)?)\s*(?:units?|mw|lit(?:er|re)s?|kg)?\b/);
    const quantity = qtyMatch ? Number(qtyMatch[1]) : null;
    const service = /hospital|clinic|medical/.test(q) ? "hospital" : /pump|water supply|water station/.test(q) ? "water" : /fire|ambulance|rescue|emergency/.test(q) ? "emergency" : /telecom|通信/.test(q) ? "telecom" : "community";
    const urgency = /urgent|immediate|critical|life.?threat|emergency|icu|life support/.test(q) ? "critical" : /soon|shortage|without|need/.test(q) ? "high" : "normal";
    return { location, resource, quantity, service, urgency, description: String(text).slice(0, 2000), missing: [!resource && "resource type", quantity == null && "quantity", location === "Unspecified" && "location"].filter(Boolean) };
  }
  function score(r) {
    const service = { hospital: 42, emergency: 38, water: 32, telecom: 22, community: 12 }[r.service] || 12;
    const urgency = { critical: 35, high: 24, normal: 10 }[r.urgency] || 10;
    const score = Math.min(100, service + urgency + (r.quantity != null ? 8 : 0));
    return { score, level: score >= 75 ? "Critical" : score >= 55 ? "High" : "Normal", reasons: [`service impact: ${r.service}`, `reported urgency: ${r.urgency}`, r.quantity == null ? "quantity not provided" : `requested quantity: ${r.quantity} ${r.resource || "units"}`] };
  }
  function createRequest(text, user) {
    const data = read(); const request = { id: `RQ-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`, ownerId: user.id, ownerName: user.fullName, ...analyze(text, user), status: "submitted", createdAt: new Date().toISOString(), assessment: null };
    request.assessment = score(request); data.requests.push(request);
    data.notifications.push({ type: "new_public_request", requestId: request.id, createdAt: request.createdAt, recipients: ["government"] });
    data.messages = [...(data.messages || []), emit("request-analysis", "priority", "request_assessment", { requestId: request.id, ...request })]; save(data); return request;
  }
  function negotiate({ location, resource = "electricity", requests }) {
    const matching = requests.filter((r) => normalize(r.location).includes(normalize(location)) && (!r.resource || r.resource === resource) && r.status !== "allocated");
    const published = resource === "electricity" ? snapshots.get("operations") : null;
    const resourceAgent = published?.operations || published;
    const capacity = resourceAgent ? Math.max(0, Number(resourceAgent.capacity || 0) - (resourceAgent.departments || []).reduce((sum, d) => sum + Number(d.allocated || 0), 0)) : 0;
    const ranked = matching.map((r) => ({ ...r, priority: r.assessment || score(r) })).sort((a, b) => b.priority.score - a.priority.score || a.createdAt.localeCompare(b.createdAt));
    const requested = ranked.reduce((n, r) => n + Math.max(0, Number(r.quantity || 0)), 0);
    let remaining = capacity;
    const departmentRemaining = new Map((resourceAgent?.departments || []).map((d) => [d.id, Math.max(0, Number(d.demand || 0) - Number(d.allocated || 0))]));
    const allocations = ranked.map((r) => { const serviceCap = resource === "electricity" ? Number(departmentRemaining.get(r.service) || 0) : Number.MAX_SAFE_INTEGER; const amount = Math.min(Math.max(0, Number(r.quantity || 0)), remaining, serviceCap); remaining = Math.max(0, remaining - amount); if (resource === "electricity" && departmentRemaining.has(r.service)) departmentRemaining.set(r.service, Math.max(0, serviceCap - amount)); return { requestId: r.id, service: r.service, amount, requested: Number(r.quantity || 0), priority: r.priority, status: amount >= Number(r.quantity || 0) ? "fully proposed" : amount > 0 ? "partially proposed" : "unfunded" }; });
    const id = `NG-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const dialogue = [emit("request-analysis", "priority", "rank_requests", { count: ranked.length, location, resource }), ...ranked.map((r) => emit("priority", "negotiation", "priority_result", { requestId: r.id, score: r.priority.score, level: r.priority.level, reasons: r.priority.reasons })), emit("resource-management", "negotiation", "capacity_offer", { resource, available: capacity, requested }), ...allocations.map((a) => emit("negotiation", "execution-monitoring", "allocation_proposal", a))];
    const record = { id, location, resource, capacity, requested, allocations, dialogue, status: "proposed", createdAt: new Date().toISOString() };
    const data = read(); data.negotiations.push(record); data.messages = [...(data.messages || []), ...dialogue]; save(data);
    return record;
  }
  function approveNegotiation(id) {
    const data = read(); const n = data.negotiations.find((x) => x.id === id);
    if (!n || n.status !== "proposed") return { error: "Negotiation proposal not found or already resolved." };
    if (n.allocations.reduce((s, a) => s + a.amount, 0) > n.capacity + 1e-6) return { error: "Allocation exceeds available resource capacity." };
    const executedActions = [];
    if (n.resource === "electricity" && n.allocations.length) {
      const published = snapshots.get("operations"); const ops = published?.operations || published;
      if (!ops) return { error: "Operations resource snapshot is unavailable; proposal was not executed." };
      const departments = Array.isArray(ops.departments) ? ops.departments.map((d) => ({ ...d })) : [];
      const changes = new Map();
      for (const a of n.allocations) {
        const dept = departments.find((d) => d.id === a.service);
        if (dept) changes.set(dept.id, (changes.get(dept.id) || 0) + a.amount);
      }
      for (const [id, amount] of changes) { const dept = departments.find((d) => d.id === id); dept.allocated = Math.min(Number(dept.demand || 0), Number(dept.allocated || 0) + amount); executedActions.push({ type: "set_allocation", departmentId: id, amount: dept.allocated, location: n.location }); }
      if (departments.reduce((s, d) => s + Number(d.allocated || 0), 0) > Number(ops.capacity || 0) + 1e-6) return { error: "Current dashboard allocation changed and would exceed capacity; refresh and renegotiate." };
      snapshots.set("operations", published?.operations ? { ...published, operations: { ...ops, departments } } : { ...ops, departments });
    }
    n.status = "approved"; n.approvedAt = new Date().toISOString();
    for (const a of n.allocations) { const r = data.requests.find((x) => x.id === a.requestId); if (r && a.amount > 0) { r.status = a.amount >= Number(r.quantity || 0) ? "allocated" : "partially allocated"; r.allocated = a.amount; r.updatedAt = n.approvedAt; data.notifications.push({ type: "request_status", requestId: r.id, ownerId: r.ownerId, status: r.status, allocated: a.amount, createdAt: n.approvedAt }); } }
    data.messages = [...(data.messages || []), emit("execution-monitoring", "public-notifications", "allocation_executed", { negotiationId: n.id, status: n.status })]; save(data);
    appendAction?.({ source: "government-negotiation", submittedAt: n.approvedAt, actions: executedActions });
    return { negotiation: n };
  }
  return { read, analyze, score, createRequest, negotiate, approveNegotiation };
}
