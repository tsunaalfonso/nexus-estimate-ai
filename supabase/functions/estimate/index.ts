// AI Estimation engine — calls Lovable AI Gateway with structured tool-calling
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are NPAV Tech's senior project estimation engine. You produce realistic, AFFORDABLE, student- and SMB-friendly cost & timeline estimations. Default currency is Philippine Pesos (PHP, ₱), but components must be sourced from globally reliable suppliers so the estimate works for users anywhere in the world.

IMPORTANT: Do NOT overprice. Use fair freelance/student rates. Be conservative.

Pricing context (PHP, typical local market — keep estimates within these ranges):
- Thesis/research: ₱1,500 – ₱15,000
- Arduino projects: ₱1,000 – ₱8,000
- Raspberry Pi projects: ₱2,000 – ₱15,000
- Web development: ₱3,000 – ₱60,000
- Mobile apps: ₱8,000 – ₱120,000
- Invitation websites: ₱500 – ₱3,000

COMPONENT SOURCING RULES (world-market reliability):
- Recommend ONLY widely available, globally trusted parts/services. Prefer products available from multiple international suppliers: DigiKey, Mouser, Adafruit, SparkFun, Seeed Studio, Arduino.cc, Raspberry Pi Foundation, AliExpress, Lazada/Shopee (PH), Amazon, official cloud providers (Vercel, Supabase, Cloudflare, AWS, GCP, Apple, Google Play).
- Use the EXACT manufacturer part name/model (e.g. "Arduino Uno R3 (ATmega328P)", "Raspberry Pi 4 Model B 4GB", "DHT22 / AM2302", "ESP32-WROOM-32", "HC-SR04 Ultrasonic", "MFRC522 RFID", "SSD1306 0.96\" OLED"). Avoid generic clones with no model number.
- For each item, briefly note a globally-reliable source in the "notes" field (e.g. "DigiKey / Adafruit / Lazada PH").
- unit_price is the TYPICAL street price in PHP (reflecting global market rates converted to PHP, including normal import/shipping). Be realistic, not the cheapest knockoff.

Examples (PHP, world-market reference prices):
- Hardware: "Arduino Uno R3 (ATmega328P)" ₱500, "ESP32-WROOM-32 DevKit" ₱350, "Raspberry Pi 4 Model B 4GB" ₱3,500, "DHT22 / AM2302" ₱200, "HC-SR04 Ultrasonic" ₱90, "SG90 Servo" ₱120, "MFRC522 RFID Kit" ₱180, "SSD1306 0.96\" OLED I2C" ₱180, "16x2 LCD with I2C" ₱180, "MB-102 Breadboard" ₱90, "Jumper wires (40pcs M-M)" ₱60, "5V 2A power adapter" ₱180
- Software/web: "Domain (.com /yr, Namecheap/Cloudflare)" ₱650, "Shared hosting (1 yr)" ₱1,200, "Vercel Hobby / Supabase Free" ₱0, "Cloudflare Free" ₱0
- Thesis: "Printing & ring binding" ₱500, "Hardbound copy" ₱800, "Documentation editing" ₱800
- Mobile: "Google Play developer (one-time)" ₱1,400, "Apple Developer Program (per yr)" ₱5,500

Always populate 4–12 components. Phase costs in the breakdown must use PHP and roughly sum within cost_min/cost_max. Tech stack and components must match the project type. Never quote in USD.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { projectType, title, description, scope } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const userPrompt = `Estimate this project.
Type: ${projectType}
Title: ${title}
Description: ${description}
Structured scope: ${JSON.stringify(scope, null, 2)}

Return a complete, transparent estimation. Be specific.`;

    const tool = {
      type: "function",
      function: {
        name: "submit_estimation",
        description: "Submit the structured project estimation",
        parameters: {
          type: "object",
          properties: {
            cost_min: { type: "number", description: "Minimum realistic cost in PHP (Philippine Pesos)" },
            cost_max: { type: "number", description: "Maximum realistic cost in PHP (Philippine Pesos)" },
            timeline_weeks_min: { type: "integer" },
            timeline_weeks_max: { type: "integer" },
            complexity_score: { type: "integer", minimum: 1, maximum: 10 },
            risk_level: { type: "string", enum: ["Low", "Medium", "High", "Critical"] },
            tech_stack: {
              type: "array",
              items: { type: "string" },
              description: "Recommended tools, frameworks, components",
            },
            breakdown: {
              type: "object",
              properties: {
                phases: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      cost: { type: "number" },
                      weeks: { type: "number" },
                      notes: { type: "string" },
                    },
                    required: ["name", "cost", "weeks", "notes"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["phases"],
              additionalProperties: false,
            },
            components: {
              type: "array",
              description: "Specific parts/modules/services needed with PHP unit price and quantity. Always include 4-12 items.",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Component or item name" },
                  category: { type: "string", description: "e.g. Hardware, Sensor, Software, Service, Material" },
                  qty: { type: "number" },
                  unit_price: { type: "number", description: "Local price in PHP" },
                  notes: { type: "string", description: "Short reason or where to get it" },
                },
                required: ["name", "category", "qty", "unit_price", "notes"],
                additionalProperties: false,
              },
            },
            explanation: { type: "string", description: "Why this estimate? 3-5 sentences." },
          },
          required: [
            "cost_min", "cost_max", "timeline_weeks_min", "timeline_weeks_max",
            "complexity_score", "risk_level", "tech_stack", "breakdown", "components", "explanation",
          ],
          additionalProperties: false,
        },
      },
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "submit_estimation" } },
      }),
    });

    if (res.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit reached. Please retry in a moment." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Workspace settings." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!res.ok) {
      const t = await res.text();
      console.error("AI gateway error", res.status, t);
      throw new Error("AI gateway error");
    }

    const data = await res.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) throw new Error("No tool call returned");
    const result = JSON.parse(call.function.arguments);

    return new Response(JSON.stringify({ ...result, model: "google/gemini-2.5-flash" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("estimate error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
