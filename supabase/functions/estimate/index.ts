// AI Estimation engine — calls Lovable AI Gateway with structured tool-calling
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are NPAV Tech's senior project estimation engine. You produce REALISTIC, MID-RANGE professional cost & timeline estimations — not budget/cheapest, not enterprise/premium. Default currency is Philippine Pesos (PHP, ₱). Components must be sourced from globally reliable suppliers so the estimate works for users anywhere in the world.

PRICING PHILOSOPHY: Mid-range = fair professional rates a freelancer or small studio in PH would honestly charge in 2026. NOT cheap student rates, NOT agency premium. Quality parts, name-brand modules (no shady clones), professional labor at PHP ₱350–₱700/hr.

Pricing context (PHP, mid-range professional market — keep estimates within these ranges):
- Thesis/research project: ₱6,000 – ₱25,000
- Arduino IoT project: ₱4,000 – ₱18,000
- Raspberry Pi project: ₱8,000 – ₱35,000
- Web development (landing/marketing): ₱15,000 – ₱90,000
- Web app (with backend/auth): ₱40,000 – ₱220,000
- Mobile apps: ₱45,000 – ₱280,000
- Invitation / event microsite: ₱2,500 – ₱8,000

COMPONENT SOURCING RULES (world-market reliability):
- Recommend ONLY widely available, globally trusted parts/services. Prefer products available from multiple international suppliers: DigiKey, Mouser, Adafruit, SparkFun, Seeed Studio, Arduino.cc, Raspberry Pi Foundation, AliExpress, Lazada/Shopee (PH), Amazon, official cloud providers (Vercel, Supabase, Cloudflare, AWS, GCP, Apple, Google Play).
- Use the EXACT manufacturer part name/model (e.g. "Arduino Uno R3 (ATmega328P)", "Raspberry Pi 4 Model B 4GB", "DHT22 / AM2302", "ESP32-WROOM-32", "HC-SR04 Ultrasonic", "MFRC522 RFID", "SSD1306 0.96\" OLED"). Avoid generic clones with no model number.
- For each item, briefly note a globally-reliable source in the "notes" field (e.g. "DigiKey / Adafruit / Lazada PH").
- unit_price reflects mid-range professional retail in PHP from reputable sellers (with shipping/import factored in) — not the cheapest knockoff and not premium markup.

Examples (PHP, mid-range professional reference prices):
- Hardware: "Arduino Uno R3 (ATmega328P, original)" ₱950, "ESP32-WROOM-32 DevKit" ₱550, "Raspberry Pi 4 Model B 4GB" ₱4,800, "Raspberry Pi 5 4GB" ₱5,500, "DHT22 / AM2302" ₱350, "HC-SR04 Ultrasonic" ₱180, "SG90 Servo" ₱220, "MFRC522 RFID Kit" ₱320, "SSD1306 0.96\" OLED I2C" ₱280, "16x2 LCD with I2C" ₱320, "Quality breadboard + jumper kit" ₱450, "5V 3A power adapter" ₱350, "Project enclosure" ₱400
- Software/web: "Domain (.com /yr, Namecheap/Cloudflare)" ₱750, "Managed hosting (1 yr, Hostinger/SiteGround)" ₱3,500, "Vercel Pro / Supabase Pro (mo)" ₱1,500, "Cloudflare Pro (mo)" ₱1,200
- Labor: "UI/UX design (per screen)" ₱1,800, "Frontend development (per day)" ₱4,500, "Backend development (per day)" ₱5,500, "QA & testing (per day)" ₱3,500
- Thesis: "Printing & ring binding" ₱800, "Hardbound copy" ₱1,200, "Documentation editing" ₱2,000
- Mobile: "Google Play developer (one-time)" ₱1,400, "Apple Developer Program (per yr)" ₱5,500

Always populate 4–12 components. Phase costs in the breakdown must use PHP and roughly sum within cost_min/cost_max. Tech stack and components must match the project type. Never quote in USD. Default to mid-range pricing — do NOT lowball.`;

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
