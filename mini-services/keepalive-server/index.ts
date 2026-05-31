import { createServer } from "http";
import { spawn, ChildProcess } from "child_process";

const PORT = 3000;
const NEXT_PORT = 3001;

let nextProcess: ChildProcess | null = null;

function startNext() {
  console.log(`[${new Date().toISOString()}] Starting Next.js on port ${NEXT_PORT}...`);
  
  nextProcess = spawn("npx", [
    "next", "dev",
    "-p", String(NEXT_PORT),
    "-H", "0.0.0.0",
    "--turbopack"
  ], {
    cwd: "/home/z/my-project",
    env: { ...process.env, PORT: String(NEXT_PORT), NODE_ENV: "development" },
    stdio: ["pipe", "pipe", "pipe"]
  });

  nextProcess.stdout?.on("data", (data: Buffer) => {
    const str = data.toString().trim();
    if (str) console.log(`[NEXT] ${str}`);
  });

  nextProcess.stderr?.on("data", (data: Buffer) => {
    const str = data.toString().trim();
    if (str) console.error(`[NEXT:ERR] ${str}`);
  });

  nextProcess.on("exit", (code, signal) => {
    console.log(`[${new Date().toISOString()}] Next.js exited (code=${code}, signal=${signal}). Restarting in 3s...`);
    setTimeout(startNext, 3000);
  });

  nextProcess.on("error", (err) => {
    console.error(`[${new Date().toISOString()}] Next.js error:`, err.message);
    setTimeout(startNext, 3000);
  });
}

// HTTP proxy server
const server = createServer(async (req, res) => {
  const targetUrl = new URL(req.url || "/", `http://127.0.0.1:${NEXT_PORT}`);
  
  // Wait for Next.js to be ready
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === "string" && !["host", "connection", "transfer-encoding"].includes(key)) {
          headers[key] = value;
        } else if (Array.isArray(value)) {
          headers[key] = value.join(", ");
        }
      }
      headers["host"] = `localhost:${NEXT_PORT}`;
      headers["x-forwarded-for"] = req.socket.remoteAddress || "";
      headers["x-forwarded-proto"] = "http";

      const response = await fetch(targetUrl.toString(), {
        method: req.method,
        headers,
        // @ts-expect-error - Node 20+ ReadableStream
        body: req.method !== "GET" && req.method !== "HEAD" ? req : undefined,
      });

      const body = await response.text();
      
      res.writeHead(response.status, {
        "Content-Type": response.headers.get("content-type") || "text/html",
        "Content-Length": Buffer.byteLength(body),
        "Cache-Control": "no-cache",
      });
      res.end(body);
      return;
    } catch (err: any) {
      if (attempt === maxRetries - 1) {
        res.writeHead(502, { "Content-Type": "text/html" });
        res.end(`<!DOCTYPE html><html><body style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;color:#666"><div style="text-align:center"><p style="font-size:1.5rem">⏳ Next.js is starting...</p><p style="margin-top:0.5rem">Please wait a moment</p><script>setTimeout(()=>location.reload(),3000)</script></div></body></html>`);
        return;
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[${new Date().toISOString()}] Keep-alive proxy listening on http://0.0.0.0:${PORT}`);
  startNext();
});

// Keep-alive ping
setInterval(() => {
  if (nextProcess && !nextProcess.killed) {
    try {
      nextProcess.stdin?.write("\n");
    } catch {}
  }
}, 30000);
