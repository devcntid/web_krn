/** Kartu putih admin. `title` opsional dirender sebagai <h2>. */
export function Card({
  title,
  actions,
  children,
  className = "",
  padded = true,
}: {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={`rounded-xl border border-admin-line bg-white ${padded ? "p-5 sm:p-6" : ""} ${className}`}
    >
      {title || actions ? (
        <div
          className={`flex flex-wrap items-center justify-between gap-3 ${padded ? "mb-4" : "px-5 pt-5 pb-4 sm:px-6"}`}
        >
          {title ? (
            <h2 className="text-base font-extrabold text-admin-ink">{title}</h2>
          ) : null}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}
