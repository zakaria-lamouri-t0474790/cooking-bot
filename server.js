const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;
const KNOWLEDGE_FILE = path.join(__dirname, "knowledge.txt");

const knowledge = fs.readFileSync(KNOWLEDGE_FILE, "utf8");

const SYSTEM_PROMPT = `You are a friendly cooking assistant for the website "Cooking with Zakaria".
You help visitors find recipes, learn cooking tips, and navigate the website.
Always be warm, encouraging, and concise — keep answers under 3 sentences unless listing items.
Respond in the same language the visitor uses (English, French, or Arabic).
Only answer based on the information below. If something is not covered, direct the visitor to the Contact page.

WEBSITE KNOWLEDGE:
${knowledge}`;

function handleRequest(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/chat") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { message, history } = JSON.parse(body);

        const messages = [
          ...(history || []),
          { role: "user", content: message },
        ];

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 500,
            system: SYSTEM_PROMPT,
            messages,
          }),
        });

        const data = await response.json();
        const reply = data.content?.[0]?.text || "Sorry, I could not get a response. Please try again.";

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ reply }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ reply: "Something went wrong. Please try again." }));
      }
    });
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
}

const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  console.log(`Cooking bot server running on port ${PORT}`);
});
