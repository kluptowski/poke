import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./build/pokemon-server.js"; // adjust path if needed

const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  const server = createServer(); // or however the server is exported
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.get("/", (req, res) => res.send("Pokemon MCP server running"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));