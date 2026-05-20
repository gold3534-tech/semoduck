import { spawn, spawnSync } from "node:child_process";

const port = process.env.SMOKE_PORT ?? "3200";
const baseUrl = `http://localhost:${port}`;
const timeoutMs = 90_000;

const staticPages = [
  { path: "/", name: "Home" },
  { path: "/onboarding", name: "Onboarding" },
  { path: "/galleries", name: "Galleries" },
  { path: "/posts/new", name: "New post" },
  { path: "/goods", name: "Goods list" },
  { path: "/market", name: "Market" },
  { path: "/suggestions", name: "Suggestions" },
  { path: "/mypage", name: "My page" },
  { path: "/admin", name: "Admin" }
];

const dynamicChecks = [
  { source: "/galleries", pattern: /href="(\/galleries\/(?!\?)[^"#?]+)"/, name: "Gallery detail" },
  { source: "/", pattern: /href="(\/posts\/(?!new(?:[/"#?]|$))[^"#?]+)"/, name: "Post detail" },
  { source: "/goods", pattern: /href="(\/goods\/(?!\?)[^"#?]+)"/, name: "Goods detail" },
  { source: "/market", pattern: /href="(\/market\/(?!\?)[^"#?]+)"/, name: "Market detail" }
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(baseUrl, { redirect: "manual" });
      if (response.status < 500) return;
    } catch {
      // Next is still booting.
    }
    await wait(1_000);
  }

  throw new Error(`Server did not become ready within ${timeoutMs / 1000}s.`);
}

async function checkPage(page) {
  const response = await fetch(`${baseUrl}${page.path}`, { redirect: "manual" });
  const body = await response.text();
  const ok = response.status >= 200 && response.status < 400;
  const hasServerError = body.includes("Missing Supabase") || body.includes("Application error") || body.includes("Internal Server Error");

  if (!ok || hasServerError) {
    throw new Error(`${page.name} ${page.path} failed with HTTP ${response.status}.`);
  }

  console.log(`OK ${page.name} ${page.path} (${response.status})`);
  return body;
}

function stopServer(server) {
  if (!server.pid) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore" });
    return;
  }
  server.kill();
}

async function discoverDynamicPages() {
  const discovered = [];

  for (const check of dynamicChecks) {
    const response = await fetch(`${baseUrl}${check.source}`);
    const body = await response.text();
    const match = body.match(check.pattern);

    if (!match) {
      console.warn(`SKIP ${check.name}: no link found on ${check.source}`);
      continue;
    }

    discovered.push({ path: match[1].replaceAll("&amp;", "&"), name: check.name });
  }

  return discovered;
}

async function main() {
  const command = process.platform === "win32" ? "cmd.exe" : "npm";
  const args =
    process.platform === "win32"
      ? ["/d", "/s", "/c", `npm.cmd run dev -- --hostname localhost --port ${port}`]
      : ["run", "dev", "--", "--hostname", "localhost", "--port", port];
  const server = spawn(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, PORT: port },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let logs = "";
  server.stdout.on("data", (chunk) => {
    logs += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    logs += chunk.toString();
  });

  try {
    await waitForServer();
    for (const page of staticPages) {
      await checkPage(page);
    }

    const dynamicPages = await discoverDynamicPages();
    for (const page of dynamicPages) {
      await checkPage(page);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    console.error(logs.slice(-4_000));
    process.exitCode = 1;
  } finally {
    stopServer(server);
    server.stdout.destroy();
    server.stderr.destroy();
    process.exit(process.exitCode ?? 0);
  }
}

main();
