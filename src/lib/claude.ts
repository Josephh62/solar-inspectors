import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROMPT = `You are analyzing solar installation inspection photos to generate a professional report.

FOCUS: Describe only solar panels and electrical components connected to the solar system. Ignore satellite dishes, trees, neighboring homes, plumbing pipes/vents, and unrelated background objects. For handwritten blueprints, circled '+' and '-' symbols indicate home run and jumper connections — call them "positive and negative heads".

STRICT RULE: Only report what is EXPLICITLY visible in the photos. Do not guess, infer, or assume.
- No electrical readings unless you can read exact numbers from a display screen.
- No system specs unless readable from labels, nameplates, blueprints, or permit documents.
- For anything not visible use exactly: "Not visible in provided photos"
- Never use "likely", "appears to be", "approximately", "probably", or "typical".

Return ONLY a valid JSON object — no markdown fences, no explanation:

{
  "project_name": "Name if visible on signage or documents — else null",
  "project_address": "Full address if visible — else null",
  "inspection_date": "Date if readable from a display or document — else null",
  "visual_inspection": {
    "modules": {
      "damage": "NONE if no damage visible. Otherwise describe exactly.",
      "discoloration": "NONE if none. Otherwise describe.",
      "delamination": "NONE if none. Otherwise describe.",
      "soiling": "NONE if panels appear clean. Otherwise describe.",
      "results": "One-sentence factual summary of panel condition."
    },
    "mounting_system": {
      "damage": "NONE if no damage. Otherwise describe.",
      "corrosion": "NONE if none. Otherwise describe.",
      "results": "One-sentence factual summary of mounting condition."
    },
    "inverters": {
      "loose_connections": "NONE if none visible. Otherwise describe.",
      "faults": "NONE if no fault lights or error codes. Otherwise list exact codes.",
      "results": "One-sentence factual summary of inverter condition."
    },
    "shading": {
      "tree_growth": "NONE if no trees causing shading. Otherwise describe.",
      "new_construction": "NONE if no obstructing construction. Otherwise describe.",
      "results": "One-sentence factual summary of shading conditions."
    },
    "follow_up_items": ["Only list items where a specific issue was observed."]
  },
  "electrical_analysis": {
    "inverter_numbers": "IDs/numbers if readable from labels. Else: 'Not visible in provided photos'",
    "amps": "Exact reading(s) if readable from display screen(s). Else: 'Not visible in provided photos'",
    "volts": "Exact reading(s) if readable from display screen(s). Else: 'Not visible in provided photos'",
    "fuses": "Fuse condition if visible. Else: 'Not visible in provided photos'",
    "inverter_result": "Factual one-sentence summary.",
    "string_result": "String-level findings if visible. Else: 'Not visible in provided photos'"
  },
  "system_specs": {
    "module_count": "Exact count if readable — else null",
    "module_watts": "Exact wattage if readable — else null",
    "module_brand": "Brand name if readable — else null",
    "inverter_count": "Exact count if visible — else null",
    "inverter_kw": "Exact KW if readable — else null",
    "inverter_brand": "Brand name if readable — else null",
    "inverter_voltage": "Voltage rating if readable — else null"
  },
  "photos": [
    {
      "index": 0,
      "description": "Brief factual description of solar/electrical components only. For blueprints refer to circled +/- as 'positive and negative heads'.",
      "category": "panels|inverter|mounting|aerial|site_plan|blueprint|general"
    }
  ],
  "confidence": "all_visible | partial | none"
}`;

export interface PhotoInput {
  buffer: Buffer;
  originalName: string;
}

export interface Analysis {
  project_name: string | null;
  project_address: string | null;
  inspection_date: string | null;
  visual_inspection: {
    modules: { damage: string; discoloration: string; delamination: string; soiling: string; results: string };
    mounting_system: { damage: string; corrosion: string; results: string };
    inverters: { loose_connections: string; faults: string; results: string };
    shading: { tree_growth: string; new_construction: string; results: string };
    follow_up_items: string[];
  };
  electrical_analysis: {
    inverter_numbers: string; amps: string; volts: string;
    fuses: string; inverter_result: string; string_result: string;
  };
  system_specs: {
    module_count: string | null; module_watts: string | null; module_brand: string | null;
    inverter_count: string | null; inverter_kw: string | null;
    inverter_brand: string | null; inverter_voltage: string | null;
  };
  photos: Array<{ index: number; description: string; category: string }>;
  confidence: string;
}

export async function analyzePhotos(photos: PhotoInput[]): Promise<Analysis> {
  const content: Anthropic.MessageParam["content"] = [];

  for (let i = 0; i < photos.length; i++) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: photos[i].buffer.toString("base64") },
    });
    content.push({ type: "text", text: `[Photo ${i + 1} of ${photos.length}: ${photos[i].originalName}]` });
  }
  content.push({ type: "text", text: PROMPT });

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content }],
  });

  const raw = (response.content[0] as { type: "text"; text: string }).text.trim()
    .replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();

  try { return JSON.parse(raw) as Analysis; } catch {
    const m = raw.match(/\{[\s\S]+\}/);
    if (m) return JSON.parse(m[0]) as Analysis;
    throw new Error("Claude returned invalid JSON");
  }
}
