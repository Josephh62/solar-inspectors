export interface ClaudeAnalysis {
  project_name: string | null;
  project_address: string | null;
  inspection_date: string | null;
  visual_inspection: {
    modules: {
      damage: string;
      discoloration: string;
      delamination: string;
      soiling: string;
      results: string;
    };
    mounting_system: {
      damage: string;
      corrosion: string;
      results: string;
    };
    inverters: {
      loose_connections: string;
      faults: string;
      results: string;
    };
    shading: {
      tree_growth: string;
      new_construction: string;
      results: string;
    };
    follow_up_items: string[];
  };
  electrical_analysis: {
    inverter_numbers: string;
    amps: string;
    volts: string;
    fuses: string;
    inverter_result: string;
    string_result: string;
  };
  system_specs: {
    module_count: string | number | null;
    module_watts: string | number | null;
    module_brand: string | null;
    inverter_count: string | number | null;
    inverter_kw: string | number | null;
    inverter_brand: string | null;
    inverter_voltage: string | null;
  };
  photos: Array<{
    index: number;
    description: string;
    category: string;
  }>;
  confidence: "all_visible" | "partial" | "none";
}

export const NOT_VISIBLE = "Not visible in provided photos";
