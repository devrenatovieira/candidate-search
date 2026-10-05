// Pre-loads the slow, cached aggregations so the first visitor doesn't wait for them.
// Usage: npm run warmup  (BASE_URL defaults to http://localhost:3000)
const base = process.env.BASE_URL ?? "http://localhost:3000";
const paths = ["/", "/ranking", "/ranking?tipo=crescimento", "/api/top-suppliers?year=all", "/emendas"];

for (const path of paths) {
  const t = performance.now();
  try {
    const res = await fetch(base + path);
    console.log(`${res.status} ${((performance.now() - t) / 1000).toFixed(1)}s ${path}`);
  } catch (e) {
    console.error(`falhou ${path}: ${e instanceof Error ? e.message : e}`);
    process.exitCode = 1;
  }
}
