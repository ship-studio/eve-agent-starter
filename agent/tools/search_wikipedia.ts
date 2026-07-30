import { defineTool } from "eve/tools";
import { z } from "zod";

// A second tool, to show the pattern: one file per tool under agent/tools/.
export default defineTool({
  description:
    "Search Wikipedia for articles matching a query. Returns titles, descriptions, and URLs. Use this to look up facts, people, places, or events.",
  inputSchema: z.object({
    query: z.string().min(1).describe("What to search for"),
    limit: z.number().int().min(1).max(10).default(3).describe("How many results to return"),
  }),
  async execute({ query, limit }, ctx) {
    const res = await fetch(
      `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(query)}&limit=${limit}`,
      { signal: ctx.abortSignal, headers: { "User-Agent": "eve-agent-starter" } },
    );

    if (!res.ok) throw new Error(`Wikipedia search failed: ${res.status}`);

    const { pages } = (await res.json()) as {
      pages: { key: string; title: string; description: string | null }[];
    };

    return pages.map((page) => ({
      title: page.title,
      description: page.description ?? "",
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.key)}`,
    }));
  },
});
