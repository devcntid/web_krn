import type { Metadata } from "next";

import { subPrograms } from "@/content/programs";
import { PillarPage, pillarMetadata } from "@/components/templates/PillarPage";

const program = subPrograms.kebencanaan;

export function generateMetadata(): Metadata {
  return pillarMetadata(program);
}

export default function Page() {
  return <PillarPage pillar={program} />;
}
