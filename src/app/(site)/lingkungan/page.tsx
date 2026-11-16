import type { Metadata } from "next";

import { pillars } from "@/content/pillars";
import { PillarPage, pillarMetadata } from "@/components/templates/PillarPage";

const pillar = pillars["lingkungan"];

export async function generateMetadata(): Promise<Metadata> {
  return await pillarMetadata(pillar);
}

export default function Page() {
  return <PillarPage pillar={pillar} />;
}
