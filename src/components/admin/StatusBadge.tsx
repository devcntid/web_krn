export type ContentStatus =
  "draft" | "review" | "scheduled" | "published" | "trashed";

const STYLE: Record<ContentStatus, { label: string; className: string }> = {
  published: {
    label: "Terbit",
    className: "bg-admin-ok-bg text-admin-primary-dark",
  },
  review: {
    label: "Review",
    className: "bg-admin-warn-bg text-admin-warn-text",
  },
  scheduled: {
    label: "Terjadwal",
    className: "bg-admin-info-bg text-admin-info-text",
  },
  draft: {
    label: "Draf",
    className: "bg-admin-neutral-bg text-admin-neutral-text",
  },
  trashed: {
    label: "Sampah",
    className: "bg-admin-danger-bg text-admin-danger",
  },
};

/** Lencana status konten (warna mengikuti artboard A2). `label` dapat menimpa teks bawaan. */
export function StatusBadge({
  status,
  label,
}: {
  status: ContentStatus;
  label?: string;
}) {
  const s = STYLE[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${s.className}`}
    >
      {label ?? s.label}
    </span>
  );
}
