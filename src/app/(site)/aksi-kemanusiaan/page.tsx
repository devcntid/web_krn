import type { Metadata } from "next";

import { pillars } from "@/content/pillars";
import { PillarPage, pillarMetadata } from "@/components/templates/PillarPage";

const pillar = pillars["aksi-kemanusiaan"];

export function generateMetadata(): Metadata {
  return pillarMetadata(pillar);
}

export default function Page() {
  return <PillarPage pillar={pillar} />;
}
