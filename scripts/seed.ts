// ============================================================
// scripts/seed.ts
// Seeds the Supabase reports table with the mock report.
// Run: npx ts-node --project tsconfig.json scripts/seed.ts
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { MOCK_REPORT_DATA } from "../src/lib/mock-data";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!supabaseUrl || !serviceKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const SEED_REPORTS = [
  {
    niche: "Handmade Soy Candles",
    location: "Tampa, FL",
    target_customer: "Millennial women 25-38, home décor and wellness focused",
    product_type: "E-commerce / Etsy / Shopify store",
    price_range: "$26-$48 per candle",
    competitors_input: "Yankee Candle, Bath & Body Works, local boutiques",
    report_data: MOCK_REPORT_DATA,
    is_mock: true,
  },
];

export async function seed() {
  console.log("🌱 Seeding Supabase with sample report data…");

  const { data, error } = await supabase
    .from("reports")
    .insert(SEED_REPORTS)
    .select();

  if (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  }

  console.log(`✅ Seeded ${data?.length ?? 0} report(s) successfully.`);
  console.log("   Report IDs:", data?.map((r: { id: string }) => r.id).join(", "));
}

// Run directly
seed().catch(console.error);
