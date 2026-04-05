import Anthropic from "@anthropic-ai/sdk";
import type { ClaudeAnalysis } from "@/types/analysis";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Ported directly from generate_report.py — battle-tested no-hallucination prompt
const ANALYSIS_PROMPT = `You are analyzing solar installation inspection photos to generate a professional report.

FOCUS: Describe only solar panels and electrical components that are part of or connected to the solar system. Do NOT mention satellite dishes, trees, neighboring homes, plumbing pipes/vents, or unrelated background objects. For handwritten blueprints, circled '+' and '-' symbols indicate home run and jumper connections — refer to them as "positive and negative heads", not "positive and negative symbols".

STRICT RULE: You MUST ONLY report information that is EXPLICITLY AND DIRECTLY VISIBLE in
the provided photos. This is non-negotiable.
- Do NOT guess, infer, or assume ANYTHING not clearly shown in a photo.
- Do NOT fill in values based on typical/common solar installations.
- Do NOT estimate panel counts unless every panel is clearly visible and countable.
- Only provide electrical readings (voltage, amps) if you can read exact numbers from
  display screens in the photos.
- Only provide system specs (panel count, wattage, inverter count/KW) if readable from
  visible labels, nameplates, blueprints, or permit documents in the photos.
- For anything not visible, use EXACTLY the string: "Not visible in provided photos"
- NEVER use phrases like "likely", "appears to be", "approximately", "probably", or
  "typical for this type". Only state facts you can directly observe.

Analyze all provided photos and return ONLY a valid JSON object — no markdown fences,
no explanation text, just the raw JSON.

{
  "project_name": "Name if visible on signage, documents, or blueprints — else null",
  "project_address": "Full address if visible on signage, permit labels, or documents — else null",
  "inspection_date": "Date if readable from a display, permit, or document in photos — else null",
  "visual_inspection": {
    "modules": {
      "damage": "NONE if no damage visible. Otherwise describe exactly what damage is seen.",
      "discoloration": "NONE if none visible. Otherwise describe what discoloration is seen.",
      "delamination": "NONE if none visible. Otherwise describe what delamination is seen.",
      "soiling": "NONE if panels appear clean. Otherwise describe the soiling/dirt level seen.",
      "results": "One-sentence factual summary of panel condition based only on what is visible."
    },
    "mounting_system": {
      "damage": "NONE if no damage visible. Otherwise describe exactly what is seen.",
      "corrosion": "NONE if no corrosion visible. Otherwise describe exactly what is seen.",
      "results": "One-sentence factual summary of mounting condition based only on what is visible."
    },
    "inverters": {
      "loose_connections": "NONE if no loose connections visible. Otherwise describe what is seen.",
      "faults": "NONE if no fault lights or error codes visible. Otherwise describe exact codes seen.",
      "results": "One-sentence factual summary of inverter condition based only on what is visible."
    },
    "shading": {
      "tree_growth": "NONE if no trees causing/threatening shading. Otherwise describe what is seen.",
      "new_construction": "NONE if no obstructing construction visible. Otherwise describe what is seen.",
      "results": "One-sentence factual summary of shading conditions based only on what is visible."
    },
    "follow_up_items": ["Only list items for which a specific issue was observed in the photos."]
  },
  "electrical_analysis": {
    "inverter_numbers": "Inverter IDs/numbers if readable from labels (e.g. '1-5'). Else: 'Not visible in provided photos'",
    "amps": "Exact amperage reading(s) if readable from display screen(s). Else: 'Not visible in provided photos'",
    "volts": "Exact voltage reading(s) if readable from display screen(s). Else: 'Not visible in provided photos'",
    "fuses": "Fuse condition/status if visible. Else: 'Not visible in provided photos'",
    "inverter_result": "Factual one-sentence summary based only on what is visible.",
    "string_result": "String-level findings if visible. Else: 'Not visible in provided photos'"
  },
  "system_specs": {
    "module_count": "Exact count if readable from blueprint/label — else null",
    "module_watts": "Exact wattage if readable from panel label/nameplate/blueprint — else null",
    "module_brand": "Brand name if readable from panels or documents — else null",
    "inverter_count": "Exact count if visible and clearly countable — else null",
    "inverter_kw": "Exact KW rating if readable from labels/nameplates — else null",
    "inverter_brand": "Brand name if readable from equipment or documents — else null",
    "inverter_voltage": "Voltage rating if readable (e.g. '480v') — else null"
  },
  "photos": [
    {
      "index": 0,
      "description": "Brief factual description focused on solar panels and electrical components connected to the system. Ignore satellite dishes, trees, neighboring structures, plumbing pipes, and unrelated background elements. For blueprints/handwritten diagrams, refer to circled '+' and '-' symbols as 'positive and negative heads' (these indicate home runs and jumpers, not polarity symbols).",
      "category": "panels|inverter|mounting|aerial|site_plan|blueprint|general"
    }
  ],
  "confidence": "all_visible if you found data in all sections | partial if some sections have nulls | none if photos are too unclear"
}`;

export interface PhotoInput {
  buffer: Buffer;
  originalName: string;
}

export async function analyzePhotos(photos: PhotoInput[]): Promise<ClaudeAnalysis> {
  const content: Anthropic.MessageParam["content"] = [];

  // Interleave image + label for each photo (same pattern as Python prototype)
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const base64 = photo.buffer.toString("base64");

    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/jpeg",
        data: base64,
      },
    });
    content.push({
      type: "text",
      text: `[Photo ${i + 1} of ${photos.length}: ${photo.originalName}]`,
    });
  }

  content.push({ type: "text", text: ANALYSIS_PROMPT });

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content }],
  });

  const rawText = (response.content[0] as { type: "text"; text: string }).text.trim();

  // Strip markdown fences if present (ported from prototype)
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();

  try {
    return JSON.parse(cleaned) as ClaudeAnalysis;
  } catch {
    const match = cleaned.match(/\{[\s\S]+\}/);
    if (match) return JSON.parse(match[0]) as ClaudeAnalysis;
    throw new Error(`Claude response was not valid JSON: ${cleaned.slice(0, 500)}`);
  }
}
