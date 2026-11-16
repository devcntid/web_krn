import Image from "next/image";

import { floatingContact } from "@/config/site";
import { mediaUrl } from "@/lib/media";

/** Widget bulat kanan-bawah "Tanya Saffa" → WhatsApp (tampil di semua halaman). */
export function FloatingContact() {
  return (
    <a
      href={floatingContact.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${floatingContact.label} via WhatsApp`}
      className="floating-contact fixed right-5 bottom-5 z-40 block size-[100px] overflow-hidden rounded-full transition-transform hover:scale-105 max-sm:size-[70px]"
    >
      <Image src={mediaUrl(floatingContact.image)} alt="" width={100} height={100} className="size-full object-cover" />
    </a>
  );
}
