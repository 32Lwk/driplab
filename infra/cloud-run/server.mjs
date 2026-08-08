import http from "node:http";

const port = Number(process.env.PORT || 8080);

const server = http.createServer((req, res) => {
  const path = req.url?.split("?")[0] ?? "/";

  if (path === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "driplab" }));
    return;
  }

  if (path === "/api/recommend") {
    res.writeHead(501, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "recommender not implemented yet" }));
    return;
  }

  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>DripLab</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #f5ebe0; color: #3e2723; margin: 0; min-height: 100vh; display: grid; place-items: center; }
    main { text-align: center; padding: 2rem; }
    h1 { margin-bottom: 0.5rem; }
    p { margin: 0.25rem 0; }
  </style>
</head>
<body>
  <main>
    <h1>DripLab</h1>
    <p>気分で選ぶ、今日の一杯</p>
    <p>デモ環境を準備中です</p>
  </main>
</body>
</html>`);
});

server.listen(port, () => {
  console.log(`driplab listening on ${port}`);
});
