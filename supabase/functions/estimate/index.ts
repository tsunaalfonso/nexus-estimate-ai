// AI Estimation engine — calls Lovable AI Gateway with structured tool-calling
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are NPAV Tech's senior project estimation engine. You produce realistic, AFFORDABLE, student- and SMB-friendly cost & timeline estimations for the Philippine market. All prices are in Philippine Pesos (PHP, ₱).

IMPORTANT: Do NOT overprice. Use local Philippine freelance/student rates, not US agency rates. Be conservative and fair.

Pricing context (PHP, Philippine local market — keep estimates within these typical ranges):
- Thesis/research: ₱1,500 – ₱15,000
- Arduino projects: ₱1,000 – ₱8,000
- Raspberry Pi projects: ₱2,000 – ₱15,000
- Web development: ₱3,000 – ₱60,000
- Mobile apps: ₱8,000 – ₱120,000
- Invitation websites: ₱500 – ₱3,000

ALWAYS populate the "components" list with the SPECIFIC parts, modules, libraries, services, or materials the project needs, each with a realistic local PHP unit price and quantity. Examples:
- Hardware: "Arduino Uno R3" ₱450, "DHT22 sensor" ₱180, "LCD 16x2" ₱120, "Jumper wires (40pcs)" ₱60, "Breadboard" ₱90, "Raspberry Pi 4 4GB" ₱3,200
- Software/web: "Domain (.com /yr)" ₱650, "Hosting (1 yr shared)" ₱1,200, "Vercel/Supabase free tier" ₱0, "Figma Pro (optional)" ₱0
- Thesis: "Printing & binding" ₱500, "Documentation editing" ₱800, "Statistical analysis tool" ₱0
- Mobile: "Google Play developer account (one-time)" ₱1,400, "Apple Developer (per yr)" ₱5,500

Phase costs in the breakdown must use PHP and roughly sum to within cost_min/cost_max. Tech stack and components must match the project type. Never quote in USD.`;

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
