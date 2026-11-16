import { SiteShell } from "@/components/layout/SiteShell";

/** Layout situs publik. Route di luar group ini (mis. /admin) tidak mendapat header/footer situs. */
export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <SiteShell>{children}</SiteShell>;
}
