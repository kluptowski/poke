import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const app = express();
app.use(express.json());

const POKEMON_API_BASE_URL = "https://pokeapi.co/api/v2";

function createServer() {
  const server = new McpServer({
    name: "pokemon-api",
    version: "1.0.0",
    capabilities: { tools: {} }
  });

  server.tool("get-pokemon", { nameOrId: z.string() }, async ({ nameOrId }) => {
    const response = await fetch(`${POKEMON_API_BASE_URL}/pokemon/${nameOrId.toLowerCase()}`);
    if (!response.ok) return { content: [{ type: "text", text: `Pokémon '${nameOrId}' not found.` }], isError: true };
    const pokemon = await response.json();
    return { content: [{ type: "text", text: JSON.stringify({ id: pokemon.id, name: pokemon.name, types: pokemon.types.map((t) => t.type.name), stats: pokemon.stats.map((s) => ({ name: s.stat.name, base: s.base_stat })) }, null, 2) }] };
  });

  server.tool("get-type", { type: z.string() }, async ({ type }) => {
    const response = await fetch(`${POKEMON_API_BASE_URL}/type/${type.toLowerCase()}`);
    if (!response.ok) return { content: [{ type: "text", text: `Type '${type}' not found.` }], isError: true };
    const data = await response.json();
    return { content: [{ type: "text", text: JSON.stringify(data.damage_relations, null, 2) }] };
  });

  server.tool("search-pokemon", { limit: z.number().default(10), offset: z.number().default(0) }, async ({ limit, offset }) => {
    const response = await fetch(`${POKEMON_API_BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
    const data = await response.json();
    return { content: [{ type: "text", text: JSON.stringify(data.results, null, 2) }] };
  });

  server.tool("get-move", { nameOrId: z.string() }, async ({ nameOrId }) => {
    const response = await fetch(`${POKEMON_API_BASE_URL}/move/${nameOrId.toLowerCase()}`);
    if (!response.ok) return { content: [{ type: "text", text: `Move '${nameOrId}' not found.` }], isError: true };
    const move = await response.json();
    return { content: [{ type: "text", text: JSON.stringify({ name: move.name, power: move.power, type: move.type.name }, null, 2) }] };
  });

  server.tool("get-ability", { nameOrId: z.string() }, async ({ nameOrId }) => {
    const response = await fetch(`${POKEMON_API_BASE_URL}/ability/${nameOrId.toLowerCase()}`);
    if (!response.ok) return { content: [{ type: "text", text: `Ability '${nameOrId}' not found.` }], isError: true };
    const ability = await response.json();
    return { content: [{ type: "text", text: JSON.stringify({ name: ability.name, effect: ability.effect_entries.find((e) => e.language.name === "en")?.short_effect }, null, 2) }] };
  });

  return server;
}

app.post("/mcp", async (req, res) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.get("/", (req, res) => res.send("Pokemon MCP server running"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));