import { EmptyState } from "@/components/admin/EmptyState";

/** /admin/halaman tanpa halaman terpilih. */
export default function HalamanIndex() {
  return (
    <div className="min-w-0 flex-[999_1_520px]">
      <EmptyState title="Pilih halaman" description="Pilih halaman di daftar untuk menyusun section-nya, atau buat halaman baru." />
    </div>
  );
}
