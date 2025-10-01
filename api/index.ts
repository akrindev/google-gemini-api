import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { handle } from "hono/vercel";

export const config = {
  runtime: "edge",
  regions: ["sin1"],
};

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GOOGLE_GEMINI_API_KEY is required");
}

const app = new Hono()
  .basePath("/api")
  .use(logger())
  .use(prettyJSON())
  .use("/*", cors());

app.get("/", (c) => {
  return c.json({ message: "Hello Hono!" });
});

app.post("/ai", async (c) => {
  const { message } = await c.req.json();

  if (!message) {
    return c.json({ message: "Message is required" }, 400);
  }

  const result = await streamText({
    model: google("gemini-2.5-flash"),
    messages: [
      { role: "user", content: message }
    ],
  });

  return result.toTextStreamResponse();
});

export default handle(app);
