import { createServer } from "http";
import { spawn } from "child_process";

const PORT = 3000;
const NEXT_PORT = 3001;
const PROJECT_DIR = "/home/z/my-project";

let nextProc: ReturnType<typeof spawn> | null = null;
let nextReady = false;
let pendingRequests: Array<{
  req: import("http").IncomingMessage;
  res: import("http").ServerResponse;
  attempt: number;
}> = [];

function log(msg: string) {
  const time = new Date().toISOString().split("T")[1].slice(0, 8);
  console.log(`[${time}] ${msg}`);
}

function startNext() {
  log(`Starting Next.js on port ${NEXT_PORT}...`);
  nextReady = false;

  nextProc = spawn("npx", [
    "next", "dev",
    "-p", String(NEXT_PORT),
    "-H", "0.0.0.0",
    "--turbopack"
  ], {
    cwd: PROJECT_DIR,
    env: { ...process.env, NODE_ENV: "development" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  nextProc.stdout?.on("data", (d: Buffer) => {
    const lines = d.toString().split("\n").filter(Boolean);
    for (const line of lines) {
      log(`NEXT: ${line}`);
      if (line.includes("Ready")) {
        nextReady = true;
        flushPending();
      }
    }
  });

  nextProc.stderr?.on("data", (d: Buffer) => {
    const lines = d.toString().split("\n").filter(Boolean);
    for (const line of lines) {
      if (line.includes("Error") || line.includes("error")) {
        log(`NEXT ERR: ${line}`);
      }
    }
  });

  nextProc.on("exit", (code) => {
    log(`Next.js exited (code=${code}). Restarting in 2s...`);
    nextReady = false;
    setTimeout(startNext, 2000);
  });

  nextProc.on("error", (err) => {
    log(`Next.js error: ${err.message}. Restarting...`);
    nextReady = false;
    setTimeout(startNext, 2000);
  });
}

function flushPending() {
  for (const { req, res } of pendingRequests) {
    proxyRequest(req, res);
  }
  pendingRequests = [];
}

function sendWaitingPage(res: import("http").ServerResponse) {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#333}
.spinner{width:40px;height:40px;border:3px solid #e5e7eb;border-top-color:#D4AF37;border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.wrap{text-align:center;display:flex;flex-direction:column;align-items:center;gap:1rem}
p{font-size:.95rem;color:#6b7280}
</style></head><body><div class="wrap"><div class="spinner"></div><p>Chargement en cours...</p></div><script>setTimeout(()=>location.reload(),3000)</script></body></html>`);
}

async function proxyRequest(req: import("http").IncomingMessage, res: import("http").ServerResponse) {
  if (!nextReady) {
    sendWaitingPage(res);
    return;
  }

  const target = new URL(req.url || "/", `http://127.0.0.1:${NEXT_PORT}`);
  try {
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (typeof v === "string" && !["host", "connection", "transfer-encoding"].includes(k)) {
        headers[k] = v;
      }
    }
    headers["host"] = `127.0.0.1:${NEXT_PORT}`;
    headers["x-forwarded-for"] = req.socket.remoteAddress || "";
    headers["x-forwarded-proto"] = "http";

    const resp = await fetch(target.toString(), {
      method: req.method,
      headers,
    });

    const body = await resp.text();
    const ct = resp.headers.get("content-type") || "text/html";
    
    res.writeHead(resp.status, {
      "Content-Type": ct,
      "Content-Length": Buffer.byteLength(body),
    });
    res.end(body);
  } catch {
    sendWaitingPage(res);
  }
}

const server = createServer((req, res) => {
  if (nextReady) {
    proxyRequest(req, res);
  } else {
    // Queue request and show waiting page
    sendWaitingPage(res);
  }
});

// Prevent process from exiting
setInterval(() => {
  if (nextProc && nextProc.exitCode === null && !nextProc.killed) {
    // Next.js is running, all good
  } else if (!nextProc) {
    startNext();
  }
}, 10000);

server.listen(PORT, "0.0.0.0", () => {
  log(`Keep-alive proxy on http://0.0.0.0:${PORT}`);
  startNext();
});
