/**
 * Cek kesesuaian deskripsi field form admin (src/lib/section-fields.ts) dengan skema Zod
 * (src/server/sections.ts): setiap tipe section punya definisi form, dan nama field-nya
 * (termasuk di dalam daftar) sama persis dengan kunci skema.
 *
 *   NODE_OPTIONS=--conditions=react-server npx tsx scripts/check-sections.ts
 */
import type { z } from "zod";

import { type Field, SECTION_DEFS, sectionDef } from "@/lib/section-fields";
import { SECTION_TYPES, sectionDataSchema } from "@/server/sections";

type AnySchema = z.ZodType & { def: { type: string; innerType?: AnySchema; element?: AnySchema; shape?: Record<string, AnySchema> } };

/** Buka pembungkus default/nullable/optional sampai ke skema intinya. */
function core(schema: AnySchema): AnySchema {
  let s = schema;
  while (s.def.innerType) s = s.def.innerType;
  return s;
}

const errors: string[] = [];

function compare(where: string, schema: AnySchema, fields: readonly Field[]) {
  const shape = core(schema).def.shape;
  if (!shape) {
    errors.push(`${where}: skema bukan objek`);
    return;
  }
  const schemaKeys = Object.keys(shape).sort();
  const fieldKeys = fields.map((f) => f.name).sort();
  for (const k of schemaKeys) if (!fieldKeys.includes(k)) errors.push(`${where}: kunci skema "${k}" tidak punya field form`);
  for (const k of fieldKeys) if (!schemaKeys.includes(k)) errors.push(`${where}: field form "${k}" tidak ada di skema`);

  for (const field of fields) {
    const sub = shape[field.name];
    if (!sub) continue;
    const inner = core(sub);
    const kind = inner.def.type;
    const expect: Record<Field["kind"], string[]> = {
      text: ["string"],
      textarea: ["string"],
      url: ["string"],
      html: ["string"],
      number: ["number"],
      select: ["enum"],
      boolean: ["boolean"],
      image: ["object"],
      strings: ["array"],
      categories: ["array"],
      list: ["array"],
    };
    if (!expect[field.kind].includes(kind)) errors.push(`${where}.${field.name}: field "${field.kind}" tetapi skema "${kind}"`);
    if (field.kind === "list" && inner.def.element) compare(`${where}.${field.name}[]`, inner.def.element, field.fields);
  }
}

for (const type of SECTION_TYPES) {
  const def = sectionDef(type);
  if (!def) {
    errors.push(`${type}: tidak ada definisi form`);
    continue;
  }
  compare(type, sectionDataSchema(type) as AnySchema, def.fields);
}
for (const def of SECTION_DEFS) if (!SECTION_TYPES.includes(def.type)) errors.push(`${def.type}: definisi form tanpa skema`);

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`OK — ${SECTION_TYPES.length} tipe section, field form sesuai skema.`);
