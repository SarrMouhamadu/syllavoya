import "temporal-polyfill/full/global";
import "dotenv/config";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "../prisma/schema.d";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const contractJson = require("../prisma/schema.json");

export const db = postgres<Contract>({
  contractJson,
  url: process.env["DATABASE_URL"]!,
});


