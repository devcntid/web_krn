import Image from "next/image";

import { SAFFA_IMAGE } from "@/config/site";
import { mediaUrl } from "@/lib/media";

/** Widget bulat kanan-bawah "Tanya Saffa" → WhatsApp. Tampil/sembunyi diatur di /admin/pengaturan. */
export function FloatingContact({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Tanya Saffa via WhatsApp"
      className="floating-contact fixed right-5 bottom-5 z-40 block size-[100px] overflow-hidden rounded-full transition-transform hover:scale-105 max-sm:size-[70px]"
    >
      <Image src={mediaUrl(SAFFA_IMAGE)} alt="" width={100} height={100} className="size-full object-cover" />
    </a>
  );
}
