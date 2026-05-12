// AI Estimation engine — calls Lovable AI Gateway with structured tool-calling
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are NPAV Tech's senior project estimation engine. You produce realistic, defensible cost & timeline estimations for software, hardware, and academic projects.

Pricing context (USD baseline, global market):
- Thesis/research: $150–$2,500 depending on field, length, novelty
- Arduino: $80–$1,200 (parts + dev labor)
- Raspberry Pi: $150–$3,500
- Web development: $500–$60,000+
- Mobile apps: $2,000–$120,000+
- Invitation websites (birthday/wedding/christening): $40–$600

Always reason about: scope breadth, integrations, data complexity, design polish, hardware count, deadlines, team availability. Be honest about risk. Tech stack must match the project type.`;

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
            cost_min: { type: "number", description: "Minimum realistic cost in USD" },
            cost_max: { type: "number", description: "Maximum realistic cost in USD" },
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
            explanation: { type: "string", description: "Why this estimate? 3-5 sentences." },
          },
          required: [
            "cost_min", "cost_max", "timeline_weeks_min", "timeline_weeks_max",
            "complexity_score", "risk_level", "tech_stack", "breakdown", "explanation",
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
