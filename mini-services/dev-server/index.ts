import { createServer } from "http";
import { spawn } from "child_process";
import { execSync } from "child_process";

const PORT = 3000;
const PROJECT_DIR = "/home/z/my-project";

const server = createServer(async (req, res) => {
  // Simple proxy to Next.js
  const url = new URL(req.url || "/", `http://localhost:${PORT + 1}`);
  url.protocol = "http:";
  url.hostname = "127.0.0.1";
  url.port = String(PORT + 1);
  
  try {
    const response = await fetch(url.toString(), {
      method: req.method || "GET",
      headers: {
        ...Object.fromEntries(
          Object.entries(req.headers).filter(
            ([k]) => !["host", "connection", "accept-encoding"].includes(k)
          )
        ),
        host: `localhost:${PORT + 1}`,
      },
    });
    
    const body = await response.text();
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    res.end(body);
  } catch (err: any) {
    res.writeHead(502, { "Content-Type": "text/html" });
    res.end(`<h1>502 Bad Gateway</h1><p>${err.message}</p>`);
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Proxy listening on http://127.0.0.1:${PORT}`);
});
