// One-off: merge the two MCP-saved exercise SQL results into a fixture array.
// The saved files wrap the result as: ...[{"payload":"<stringified-json-array>"}]...
const fs = require("fs");

const dir = "/root/.claude/projects/-home-user-PerformLabs/3191634f-f7c8-4121-bb57-554bafa6f9bf/tool-results/";
const files = [
  "mcp-18bc2a6e-2182-4681-a568-d5bb4f10b99e-execute_sql-1780243204677.txt",
  "mcp-18bc2a6e-2182-4681-a568-d5bb4f10b99e-execute_sql-1780243207100.txt",
];

function extractPayload(raw) {
  // The file is a JSON object {"result":"<text with escaped JSON inside>"}.
  // 1) parse outer → plain `result` text.
  const result = JSON.parse(raw).result;
  // 2) inside `result`, the SQL rows are a JSON array [{"payload":"..."}] sitting
  //    between the untrusted-data boundaries. Grab from the first "[{" to the last "}]".
  const start = result.indexOf("[{");
  const end = result.lastIndexOf("}]");
  if (start === -1 || end === -1) return null;
  const arr = JSON.parse(result.slice(start, end + 2));
  return arr[0] && typeof arr[0].payload === "string" ? arr[0].payload : null;
}

const all = [];
for (const f of files) {
  const raw = fs.readFileSync(dir + f, "utf8");
  const payloadStr = extractPayload(raw);
  if (!payloadStr) {
    console.error("no payload in", f);
    continue;
  }
  const rows = JSON.parse(payloadStr);
  all.push(...rows);
}

const seen = new Set();
const out = [];
for (const r of all) {
  if (seen.has(r.id)) continue;
  seen.add(r.id);
  out.push({
    id: r.id,
    name: r.name,
    muscle_groups: r.muscle_groups || [],
    equipment: r.equipment || [],
    locations: r.locations || [],
    mechanic: r.mechanic ?? null,
  });
}

fs.writeFileSync(__dirname + "/exercise-fixture.json", JSON.stringify(out));
const locs = { gym: 0, home: 0 };
for (const r of out) for (const l of r.locations) if (locs[l] !== undefined) locs[l]++;
console.log("merged:", all.length, "unique:", out.length, "locations:", JSON.stringify(locs));
