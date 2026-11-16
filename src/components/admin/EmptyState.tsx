import { Inbox } from "lucide-react";

/** Keadaan kosong (tabel tanpa data, fitur belum tersedia). */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-admin-field bg-white px-6 py-12 text-center">
      <span
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-full bg-admin-ok-bg text-primary"
      >
        <Inbox size={22} />
      </span>
      <p className="text-base font-extrabold text-admin-ink">{title}</p>
      {description ? (
        <p className="max-w-md text-sm text-admin-text">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
