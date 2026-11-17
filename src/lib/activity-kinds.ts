/**
 * Jenis aktivitas untuk /admin/log (artboard A12): baris `activity_log` dikelompokkan menjadi
 * TERBIT / EDIT / HAPUS / LOGIN / SETUP dari kolom `action` + `entity`.
 * Aturan yang sama dipakai di SQL (activityKindSql di src/server/activity-log.ts) dan di sini.
 */

export const ACTIVITY_KINDS = ["TERBIT", "EDIT", "HAPUS", "LOGIN", "SETUP"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export const KIND_ACTIONS = {
  LOGIN: ["login", "logout"],
  TERBIT: ["publish", "schedule"],
  HAPUS: ["delete", "trash", "revoke", "discard"],
  /** Aksi yang selalu SETUP apa pun entitasnya. */
  SETUP: ["invite", "setup_2fa", "reset_2fa", "sync"],
} as const;

/** Entitas konfigurasi: perubahan di sini dihitung SETUP (kecuali terbit/hapus/login). Beranda tetap EDIT. */
export const SETUP_ENTITIES = ["redirect", "user", "not_found", "settings"] as const;
export const HOME_SETTING_IDS = ["home", "home.draft"] as const;

export function activityKind(action: string, entity: string, entityId: string | null): ActivityKind {
  const has = (list: readonly string[]) => list.includes(action);
  if (has(KIND_ACTIONS.LOGIN)) return "LOGIN";
  if (has(KIND_ACTIONS.TERBIT)) return "TERBIT";
  if (has(KIND_ACTIONS.HAPUS)) return "HAPUS";
  if (has(KIND_ACTIONS.SETUP)) return "SETUP";
  if ((SETUP_ENTITIES as readonly string[]).includes(entity) && !(entity === "settings" && (HOME_SETTING_IDS as readonly string[]).includes(entityId ?? ""))) return "SETUP";
  return "EDIT";
}

export const KIND_LABEL: Record<ActivityKind, string> = { TERBIT: "Terbit", EDIT: "Edit", HAPUS: "Hapus", LOGIN: "Login", SETUP: "Setup" };

/** Warna lencana mengikuti artboard A12 (token admin di globals.css). */
export const KIND_CLASS: Record<ActivityKind, string> = {
  TERBIT: "bg-admin-ok-bg text-admin-primary-dark",
  EDIT: "bg-admin-info-bg text-admin-info-text",
  HAPUS: "bg-admin-danger-bg text-admin-danger",
  LOGIN: "bg-admin-neutral-bg text-admin-neutral-text",
  SETUP: "bg-admin-warn-bg text-admin-warn-text",
};

export const ACTIVITY_RANGES = { "1": "Hari ini", "7": "7 hari terakhir", "30": "30 hari terakhir", "90": "90 hari terakhir", all: "Semua waktu" } as const;
export type ActivityRange = keyof typeof ACTIVITY_RANGES;
