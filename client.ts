import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import OpenAI from "openai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverFile = path.resolve(__dirname, "server.ts");

export async function fetchFarmerData(): Promise<any[]> {
  const mcp = new Client({
    name: "sanjivani-farmer-client",
    version: "1.0.0",
  });

  const transport = new StdioClientTransport({
    command: process.platform === "win32" ? "npx.cmd" : "npx",
    args: ["tsx", serverFile],
    cwd: __dirname,
    env: {
      ...process.env,
      MONGODB_URI: process.env.MONGODB_URI ?? "",
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
      OPENAI_MODEL: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    },
    stderr: "inherit",
  });

  try {
    await mcp.connect(transport);
    const result = await mcp.callTool({
      name: "get_farmer_data",
      arguments: {},
    });

    if (result.isError) {
      throw new Error(JSON.stringify(result.content));
    }

    const textContent = result.content
      .map((item) => (item.type === "text" ? item.text : ""))
      .join("\n");

    return JSON.parse(textContent);
  } finally {
    try {
      await mcp.close();
    } catch {
      // ignore close errors
    }
  }
}

export async function askQuestion(question: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing. Check your .env file.");
  }

  const farmers = await fetchFarmerData();
  const data = JSON.stringify(farmers, null, 2);

  const ai = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  try {
    const completion = await ai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are Sanjivani Sugarcane Management AI. Answer the user's question using ONLY the supplied database records. " +
            "Format currency in Indian Rupees (₹), show clear calculations, and format lists cleanly in markdown tables or bullet points. " +
            "Do not invent information.",
        },
        {
          role: "user",
          content: `Question: ${question}\n\nDatabase records:\n${data}`,
        },
      ],
    });

    return completion.choices[0]?.message?.content ?? "No response generated.";
  } catch (err: any) {
    // Fallback to responses.create if available
    if (ai.responses && typeof ai.responses.create === "function") {
      const resp = await ai.responses.create({
        model,
        input:
          "Answer the question using only the supplied records. Show amounts in INR.\n\n" +
          `Question: ${question}\n\nDatabase records:\n${data}`,
      });
      return (resp as any).output_text ?? JSON.stringify(resp);
    }
    throw err;
  }
}

function getQuestionFromArgs() {
  const text = process.argv.slice(2).join(" ").trim();
  return (
    text ||
    "List all farmers with pending payments, show each farmer's name, village and pending amount, and calculate the total pending payment. Use only the supplied database records."
  );
}

async function main() {
  try {
    const question = getQuestionFromArgs();
    console.log("\n=======================================================");
    console.log("SANJIVANI SUGARCANE MANAGEMENT - MCP QUERY");
    console.log("=======================================================");
    console.log("\nQUESTION:\n" + question);
    console.log("\nFetching records via MCP Server & querying AI...");

    const answer = await askQuestion(question);
    console.log("\nAI ANSWER:\n" + answer);
    console.log("\n=======================================================\n");
  } catch (error) {
    console.error("Error:", error);
    process.exitCode = 1;
  }
}

// Run CLI directly if invoked as main file
if (process.argv[1] && (process.argv[1].endsWith("client.ts") || process.argv[1].endsWith("client.js"))) {
  await main();
}

