"use strict";

const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT = __dirname;
const CONTENT_FILE = path.join(ROOT, ".private", "admin-content.json");
const DEFAULT_PACKAGES = [
  { id: 1, name: "Basic Package", badge: "Budget Friendly", description: "Perfect for intimate family gatherings, small puja ceremonies, and casual celebrations.", price: 450, items: [["Welcome Drink","01"],["Veg Starter","01"],["Chaat","01"],["Assorted Indian Breads","02"],["Curry","02"],["Rice","01"],["Raita","01"],["Sweet","01"],["Papad","Included"],["Salad","Included"],["Water","Included"]] },
  { id: 2, name: "Standard Package", badge: "Most Value", description: "Great for birthday parties, housewarming ceremonies, and medium-sized social events.", price: 500, items: [["Welcome Drink","01"],["Veg Starter","02"],["Chaat","01"],["Veg Noodles","01"],["Assorted Indian Breads","02"],["Curry","02"],["Rice","01"],["Dal","01"],["Raita","01"],["Sweet","01"],["Papad","Included"],["Salad","Included"],["Water Bottles","Included"]] },
  { id: 3, name: "Premium Package", badge: "Customer Choice", description: "Our most popular package for engagements, corporate luncheons, and grand festivities.", price: 550, featured: true, items: [["Welcome Drink","01"],["Veg Starter","02"],["Chaat","01"],["Veg Noodles","01"],["Manchurian","01"],["Assorted Indian Breads","02"],["Curry","02"],["Rice","01"],["Dal","01"],["Raita","01"],["Sweet","01"],["Ice-Cream","01"],["Papad","Included"],["Salad","Included"],["Water Bottles","Included"]] },
  { id: 4, name: "Delight Package", badge: "Royal Experience", description: "A lavish feast tailored for weddings, grand receptions, and high-profile corporate galas.", price: 650, items: [["Welcome Drink","02"],["Soup","01"],["Veg Starter","02"],["Chaat","02"],["Veg Noodles","01"],["Manchurian","01"],["Pinky Pasta","01"],["Assorted Breads","03"],["Curry","03"],["Rice Varieties","02"],["Dal","01"],["Raita","01"],["Sweet Varieties","02"],["Ice-Cream","01"],["Papad, Salad & Water","Included"]] }
];

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.statusCode = status;
  res.setHeader("Content-Type", type);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("X-Robots-Tag", "noindex");
  res.end(body);
}

async function getPackages() {
  try {
    const parsed = JSON.parse(await fs.readFile(CONTENT_FILE, "utf8"));
    if (Array.isArray(parsed.packages)) return parsed.packages;
  } catch (error) {
    if (error.code !== "ENOENT") console.error("Unable to read saved packages:", error.message);
  }
  return DEFAULT_PACKAGES;
}

async function handle(req, res) {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname); }
  catch { return send(res, 400, "Bad request."); }

  // Explicitly deny any former administration route, including nested paths.
  if (pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/admin.html" || pathname.startsWith("/api/admin")) {
    return send(res, 404, "Not found.");
  }

  if (pathname === "/api/public/packages" && req.method === "GET") {
    return send(res, 200, JSON.stringify(await getPackages()), "application/json; charset=utf-8");
  }

  const publicFiles = new Map([
    ["/", ["index.html", "text/html; charset=utf-8"]],
    ["/index.html", ["index.html", "text/html; charset=utf-8"]],
    ["/prem caterers logo.jpg", ["prem caterers logo.jpg", "image/jpeg"]]
  ]);
  const file = publicFiles.get(pathname);
  if (file && req.method === "GET") {
    try { return send(res, 200, await fs.readFile(path.join(ROOT, file[0])), file[1]); }
    catch { return send(res, 404, "Not found."); }
  }
  return send(res, 404, "Not found.");
}

const server = http.createServer((req, res) => {
  handle(req, res).catch(error => {
    console.error("Request error:", error.message);
    if (!res.headersSent) send(res, 500, "An unexpected server error occurred.");
    else res.destroy();
  });
});
const port = Number(process.env.PORT) || 3000;
server.listen(port, process.env.HOST || "0.0.0.0", () => console.log(`Prem Caterers site listening on port ${port}`));
process.on("SIGINT", () => server.close(() => process.exit(0)));
process.on("SIGTERM", () => server.close(() => process.exit(0)));
