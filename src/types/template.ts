export type FieldType = "text" | "number" | "date" | "multiline";

export interface FieldDef {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
}

export interface TemplateSection {
  id: string;
  title: string;
  order: number;
  visible: boolean;
  fields: FieldDef[];
}

export const DEFAULT_TEMPLATE_SECTIONS: TemplateSection[] = [
  {
    id: "cover",
    title: "Cover Page",
    order: 0,
    visible: true,
    fields: [
      { id: "address", label: "Property Address", type: "text", required: true },
      { id: "client_name", label: "Client Name", type: "text", required: false },
      { id: "inspector_name", label: "Inspector Name", type: "text", required: false },
      { id: "inspection_date", label: "Inspection Date", type: "date", required: false },
    ],
  },
  {
    id: "visual_inspection",
    title: "Visual Inspection",
    order: 1,
    visible: true,
    fields: [
      { id: "modules_damage", label: "Module Damage", type: "multiline", required: false },
      { id: "modules_discoloration", label: "Discoloration", type: "multiline", required: false },
      { id: "modules_delamination", label: "Delamination", type: "multiline", required: false },
      { id: "modules_soiling", label: "Soiling", type: "multiline", required: false },
      { id: "mounting_damage", label: "Mounting Damage", type: "multiline", required: false },
      { id: "mounting_corrosion", label: "Mounting Corrosion", type: "multiline", required: false },
      { id: "inverters_connections", label: "Loose Connections", type: "multiline", required: false },
      { id: "inverters_faults", label: "Inverter Faults", type: "multiline", required: false },
      { id: "shading_trees", label: "Tree Shading", type: "multiline", required: false },
      { id: "shading_construction", label: "Construction Shading", type: "multiline", required: false },
    ],
  },
  {
    id: "electrical_analysis",
    title: "Electrical Analysis",
    order: 2,
    visible: true,
    fields: [
      { id: "inverter_numbers", label: "Inverter Numbers", type: "text", required: false },
      { id: "amps", label: "Amperage Readings", type: "text", required: false },
      { id: "volts", label: "Voltage Readings", type: "text", required: false },
      { id: "fuses", label: "Fuse Condition", type: "text", required: false },
      { id: "inverter_result", label: "Inverter Result", type: "multiline", required: false },
      { id: "string_result", label: "String Result", type: "multiline", required: false },
    ],
  },
  {
    id: "system_specs",
    title: "System Specifications",
    order: 3,
    visible: true,
    fields: [
      { id: "module_count", label: "Module Count", type: "number", required: false },
      { id: "module_watts", label: "Module Watts", type: "number", required: false },
      { id: "module_brand", label: "Module Brand", type: "text", required: false },
      { id: "inverter_count", label: "Inverter Count", type: "number", required: false },
      { id: "inverter_kw", label: "Inverter kW", type: "number", required: false },
      { id: "inverter_brand", label: "Inverter Brand", type: "text", required: false },
    ],
  },
  {
    id: "photo_gallery",
    title: "Photo Gallery",
    order: 4,
    visible: true,
    fields: [],
  },
];
