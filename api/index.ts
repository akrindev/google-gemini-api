import { Hono } from "hono";
import { handle } from "hono/vercel";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { cors } from "hono/cors";
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";
import { GoogleGenerativeAIStream, StreamingTextResponse } from "ai";

export const config = {
  runtime: "edge",
};

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GOOGLE_GEMINI_API_KEY is required");
}

const app = new Hono().basePath("/api").use(logger(), prettyJSON(), cors());

const genAI = new GoogleGenerativeAI(apiKey);

app.get("/", (c) => {
  return c.json({ message: "Hello Hono!" });
});

app.post("/ai", async (c) => {
  const { message } = await c.req.json();

  if (!message) {
    return c.json({ message: "Message is required" }, 400);
  }

  const model = await genAI
    .getGenerativeModel({
      model: "gemini-pro",
    })
    .generateContentStream({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: message,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.5,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

  const stream = GoogleGenerativeAIStream(model);

  return new StreamingTextResponse(stream);
});

export default handle(app);
