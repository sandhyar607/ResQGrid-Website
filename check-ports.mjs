import net from "node:net";

const host = "127.0.0.1";
const services = [
  [5173, "Main ResQGrid Website"],
  [5174, "Operations Dashboard"],
  [5175, "City Monitoring Dashboard"],
  [5176, "Admin Dashboard"],
  [5177, "Chatbot API"],
];

async function portIsAvailable(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once("error", () => resolve(false));
    probe.listen({ host, port, exclusive: true }, () => probe.close(() => resolve(true)));
  });
}

const occupied = [];
for (const [port, name] of services) {
  if (!(await portIsAvailable(port))) occupied.push({ port, name });
}

if (occupied.length) {
  console.error("ResQGrid startup stopped before launching services; required port(s) are already in use:");
  for (const { port, name } of occupied) console.error(`  ${name}: ${port}`);
  console.error("Stop the previous ResQGrid run, then retry npm run dev.");
  console.error(
    process.platform === "win32"
      ? "Find the owning process with: Get-NetTCPConnection -State Listen -LocalPort 5173,5174,5175,5176,5177 | Select-Object LocalPort,OwningProcess"
      : "Find the owning process with: lsof -nP -iTCP:5173-5177 -sTCP:LISTEN",
  );
  process.exitCode = 1;
}
