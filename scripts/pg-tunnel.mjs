/**
 * pg-tunnel — local TCP forwarder for networks that intercept raw TCP.
 *
 * Some networks (corporate WiFi, a few ISPs) run a transparent HTTP proxy that
 * accepts every outbound connection but only forwards HTTP. Postgres speaks a
 * binary protocol, so those connections hang forever instead of failing — the
 * symptom is `drizzle-kit migrate` spinning at "applying migrations".
 *
 * Such proxies almost always honour HTTP CONNECT. This script opens a local
 * port, and for every connection asks the proxy to tunnel it to the real
 * database, then pipes bytes both ways. Point DATABASE_URL/DIRECT_URL at the
 * local port and everything downstream (drizzle-kit, the seed, db:studio)
 * works unmodified.
 *
 *   node scripts/pg-tunnel.mjs                 # uses DIRECT_URL from .env
 *   node scripts/pg-tunnel.mjs --port 55432
 *
 * It prints the rewritten connection URL to use. Not needed on an unfiltered
 * network — delete this file if you never hit the problem.
 */
import net from "node:net";
import { pathToFileURL } from "node:url";

export function startTunnel({
  localPort,
  targetHost,
  targetPort,
  proxyHost = targetHost,
  proxyPort = 80,
}) {
  const server = net.createServer((client) => {
    const upstream = net.connect({ host: proxyHost, port: proxyPort });
    let header = "";
    let established = false;

    const fail = () => {
      client.destroy();
      upstream.destroy();
    };

    upstream.on("connect", () => {
      upstream.write(
        `CONNECT ${targetHost}:${targetPort} HTTP/1.1\r\n` +
          `Host: ${targetHost}:${targetPort}\r\n\r\n`
      );
    });

    upstream.on("data", (chunk) => {
      if (established) return;
      header += chunk.toString("latin1");
      const end = header.indexOf("\r\n\r\n");
      if (end === -1) return;

      if (!/^HTTP\/1\.[01] 200/.test(header)) {
        fail();
        return;
      }

      established = true;
      upstream.removeAllListeners("data");

      // Anything the proxy sent after the headers is already database bytes.
      const leftover = Buffer.from(header.slice(end + 4), "latin1");
      if (leftover.length) client.write(leftover);

      upstream.pipe(client);
      client.pipe(upstream);
    });

    upstream.on("error", fail);
    client.on("error", fail);
  });

  return new Promise((resolve) => {
    server.listen(localPort, "127.0.0.1", () => resolve(server));
  });
}

function rewrite(url, localPort) {
  const u = new URL(url);
  const host = u.hostname;
  const port = Number(u.port || 5432);
  u.hostname = "127.0.0.1";
  u.port = String(localPort);
  // The far end is still a managed database that requires TLS, so say so
  // explicitly — the host no longer reveals it (see db/ssl.ts).
  u.searchParams.set("sslmode", "require");
  return { targetHost: host, targetPort: port, localUrl: u.toString() };
}

// Run directly: start a tunnel for DIRECT_URL and keep it open.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const { config } = await import("dotenv");
  config({ path: ".env" });

  const portArg = process.argv.indexOf("--port");
  const localPort = portArg > -1 ? Number(process.argv[portArg + 1]) : 55432;
  const source = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!source) throw new Error("Set DIRECT_URL or DATABASE_URL in .env first.");

  const { targetHost, targetPort, localUrl } = rewrite(source, localPort);
  await startTunnel({ localPort, targetHost, targetPort });

  console.log(`tunnelling 127.0.0.1:${localPort} -> ${targetHost}:${targetPort}`);
  console.log(`use: ${localUrl}`);
  console.log("Ctrl-C to stop.");
}
