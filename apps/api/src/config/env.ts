import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "sylla_voyage_dev_secret_key_change_in_production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  naboopayApiKey: process.env.NABOOPAY_API_KEY || "",
  naboopayWebhookSecret: process.env.NABOOPAY_WEBHOOK_SECRET || "sylla_naboopay_webhook_secret_dev",
  naboopayBaseUrl: process.env.NABOOPAY_BASE_URL || "https://api.naboopay.com",
  bictorysApiKey: process.env.BICTORYS_API_KEY || "",
  bictorysWebhookSecret: process.env.BICTORYS_WEBHOOK_SECRET || "sylla_bictorys_webhook_secret_dev",
  bictorysBaseUrl: process.env.BICTORYS_BASE_URL || "https://api.bictorys.com",
};

