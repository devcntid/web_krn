/** Judul halaman admin (satu-satunya <h1> di halaman) + deskripsi dan slot aksi. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold text-admin-ink sm:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-admin-text">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2.5">{actions}</div> : null}
    </div>
  );
}
