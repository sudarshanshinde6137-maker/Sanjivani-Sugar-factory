import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import { MongoClient } from "mongodb";

type FarmerRecord = {
  farmer_id: number;
  farmer_name: string;
  village: string;
  supply_tonnes: number;
  total_amount: number;
  amount_paid: number;
  pending_amount: number;
};

export const sampleFarmers: FarmerRecord[] = [
  { farmer_id: 1, farmer_name: "Rahul Patil", village: "Kopargaon", supply_tonnes: 120.5, total_amount: 180750, amount_paid: 150000, pending_amount: 30750 },
  { farmer_id: 2, farmer_name: "Amit Shinde", village: "Yeola", supply_tonnes: 95, total_amount: 142500, amount_paid: 100000, pending_amount: 42500 },
  { farmer_id: 3, farmer_name: "Suresh Jadhav", village: "Rahata", supply_tonnes: 150, total_amount: 225000, amount_paid: 225000, pending_amount: 0 },
  { farmer_id: 4, farmer_name: "Vijay More", village: "Shirdi", supply_tonnes: 80.5, total_amount: 120750, amount_paid: 80000, pending_amount: 40750 },
  { farmer_id: 5, farmer_name: "Ganesh Pawar", village: "Sangamner", supply_tonnes: 110, total_amount: 165000, amount_paid: 120000, pending_amount: 45000 },
  { farmer_id: 6, farmer_name: "Prakash Wagh", village: "Kopargaon", supply_tonnes: 75, total_amount: 112500, amount_paid: 112500, pending_amount: 0 },
  { farmer_id: 7, farmer_name: "Nitin Gaikwad", village: "Niphad", supply_tonnes: 135.5, total_amount: 203250, amount_paid: 150000, pending_amount: 53250 },
  { farmer_id: 8, farmer_name: "Sunil Bhosale", village: "Rahata", supply_tonnes: 90, total_amount: 135000, amount_paid: 90000, pending_amount: 45000 },
  { farmer_id: 9, farmer_name: "Dinesh Kadam", village: "Yeola", supply_tonnes: 105, total_amount: 157500, amount_paid: 157500, pending_amount: 0 },
  { farmer_id: 10, farmer_name: "Sachin Thorat", village: "Shirdi", supply_tonnes: 65, total_amount: 97500, amount_paid: 50000, pending_amount: 47500 },
];

const mongoUri = process.env.MONGODB_URI;
let mongoClient: MongoClient | null = null;
let isMongoConnected = false;

if (mongoUri && !mongoUri.includes("REPLACE_WITH_MONGODB_PASSWORD")) {
  try {
    mongoClient = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 2500 });
    await mongoClient.connect();
    const database = mongoClient.db("sanjivani_sugarcane");
    const farmers = database.collection<FarmerRecord>("farmers");
    if ((await farmers.countDocuments()) === 0) {
      await farmers.insertMany(sampleFarmers);
    }
    isMongoConnected = true;
    console.error("[MCP Server] Connected to MongoDB Atlas.");
  } catch (err) {
    console.error("[MCP Server] MongoDB connection failed (" + (err instanceof Error ? err.message : String(err)) + "), using in-memory data.");
    isMongoConnected = false;
  }
} else {
  console.error("[MCP Server] MongoDB password placeholder or missing URI, using in-memory dataset.");
}

const server = new McpServer({
  name: "sanjivani-farmer-server",
  version: "1.0.0",
});

server.registerTool(
  "get_farmer_data",
  {
    description: "Fetch sugarcane farmer payment records",
    inputSchema: z.object({}),
  },
  async () => {
    try {
      let records = sampleFarmers;
      if (isMongoConnected && mongoClient) {
        const database = mongoClient.db("sanjivani_sugarcane");
        const farmers = database.collection<FarmerRecord>("farmers");
        records = await farmers
          .find(
            {},
            {
              projection: {
                _id: 0,
                farmer_id: 1,
                farmer_name: 1,
                village: 1,
                supply_tonnes: 1,
                total_amount: 1,
                amount_paid: 1,
                pending_amount: 1,
              },
            },
          )
          .sort({ farmer_id: 1 })
          .toArray();
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(records),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        isError: true,
        content: [{ type: "text", text: message }],
      };
    }
  },
);

await serveStdio(() => server);
