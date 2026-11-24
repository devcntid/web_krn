import type { ReactNode } from "react";

/** Bendera kecil untuk membedakan bahasa di admin. Nama bahasa tetap ada bagi pembaca layar. */
export function LangFlag({ lang }: { lang: "id" | "en" }) {
  const name = lang === "en" ? "English" : "Indonesia";
  return (
    <span className="inline-flex items-center" title={name}>
      <span className="inline-block h-3 w-[18px] overflow-hidden rounded-[2px] align-[-1px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.18)]" aria-hidden>
        {lang === "id" ? (
          <svg viewBox="0 0 18 12" className="block h-full w-full">
            <path fill="#CE1126" d="M0 0h18v6H0z" />
            <path fill="#fff" d="M0 6h18v6H0z" />
          </svg>
        ) : (
          <svg viewBox="0 0 60 30" className="block h-full w-full">
            <path fill="#012169" d="M0 0h60v30H0z" />
            <path stroke="#fff" strokeWidth="6" d="M0 0l60 30M60 0L0 30" />
            <path stroke="#C8102E" strokeWidth="4" d="M0 0l60 30M60 0L0 30" />
            <path stroke="#fff" strokeWidth="10" d="M30 0v30M0 15h60" />
            <path stroke="#C8102E" strokeWidth="6" d="M30 0v30M0 15h60" />
          </svg>
        )}
      </span>
      <span className="sr-only">{name}</span>
    </span>
  );
}

const TOKEN = /(\(English, opsional\)|\(Indonesia\)|\(English\)|\bEnglish\b|\bIndonesia\b|\bInggris\b)/g;

/** Mengganti kata bahasa pada label dengan benderanya. */
export function LangText({ text }: { text: string }): ReactNode {
  const parts = text.split(TOKEN);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    if (part === "(English)" || part === "English" || part === "Inggris") return <LangFlag key={i} lang="en" />;
    if (part === "(Indonesia)" || part === "Indonesia") return <LangFlag key={i} lang="id" />;
    if (part === "(English, opsional)") {
      return (
        <span key={i}>
          <LangFlag lang="en" /> (opsional)
        </span>
      );
    }
    return part;
  });
}
