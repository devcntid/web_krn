"use client";

import { ArrowRight, Check, Heart, MapPin, Star, Users } from "lucide-react";
import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";

import { mediaUrl } from "@/lib/media";
import { type Device, type IconName, type VisualNode, resolvedCss, visualCss } from "@/lib/visual-page";
import { youtubeId } from "@/lib/youtube";

const ICONS = { heart: Heart, star: Star, check: Check, arrow: ArrowRight, pin: MapPin, users: Users } as const;

function LiveText({
  as: Tag,
  html,
  plain,
  onText,
  ...props
}: {
  html?: string;
  plain?: string;
  onText: (value: string) => void;
  as: "div" | "h1" | "h2" | "h3" | "h4";
} & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || document.activeElement === el) return;
    if (plain !== undefined) {
      if (el.textContent !== plain) el.textContent = plain;
    } else if (html !== undefined && el.innerHTML !== html) {
      el.innerHTML = html;
    }
  }, [html, plain]);
  return (
    <Tag
      {...props}
      ref={ref as never}
      contentEditable
      suppressContentEditableWarning
      onBlur={(event) => onText(plain !== undefined ? event.currentTarget.textContent ?? "" : event.currentTarget.innerHTML)}
    />
  );
}

function EditableText({
  html,
  plain,
  onText,
  as = "div",
  ...props
}: {
  html?: string;
  plain?: string;
  onText?: (value: string) => void;
  as?: "div" | "h1" | "h2" | "h3" | "h4";
} & React.HTMLAttributes<HTMLElement>) {
  if (!onText) {
    const Tag = as;
    if (plain !== undefined) return <Tag {...props}>{plain}</Tag>;
    return <Tag {...props} dangerouslySetInnerHTML={{ __html: html ?? "" }} />;
  }
  return <LiveText as={as} html={html} plain={plain} onText={onText} {...props} />;
}

function embedCss(css: string): string {
  return css.replace(/<\/style/gi, "<\\/style");
}

function embedJs(javascript: string): string {
  return javascript.replace(/<\/script/gi, "<\\/script");
}

/** CSS dan JavaScript halaman. Skrip tidak dipasang di kanvas editor. */
function PageCode({ id, css, javascript }: { id: string; css: string; javascript: string }) {
  useEffect(() => {
    const source = embedJs(javascript).trim();
    if (!source) return;
    const script = document.createElement("script");
    script.dataset.vnCode = id;
    script.text = source;
    document.body.appendChild(script);
    return () => script.remove();
  }, [id, javascript]);
  const source = embedCss(css).trim();
  if (!source) return null;
  return <style data-vn={id} dangerouslySetInnerHTML={{ __html: source }} />;
}

function safeClass(name: string | undefined): string | undefined {
  if (!name) return undefined;
  return /^[a-zA-Z0-9_-](?:[a-zA-Z0-9_ -]{0,78}[a-zA-Z0-9_-])?$/.test(name) ? name : undefined;
}

/** Satu elemen. `device="public"` memakai CSS responsif; perangkat lain memakai gaya terselesaikan. */
export function VisualNodeView({
  node,
  device,
  children,
  editable = false,
  showPlaceholder = false,
  onText,
}: {
  node: VisualNode;
  device: Device | "public";
  children?: ReactNode;
  editable?: boolean;
  showPlaceholder?: boolean;
  onText?: (value: string) => void;
}) {
  const css = (device === "public" ? undefined : resolvedCss(node, device)) as CSSProperties | undefined;
  const className = safeClass(node.style.className);

  if (node.type === "container") {
    return (
      <div data-vn={node.id} className={className} style={css}>
        {children}
      </div>
    );
  }
  if (node.type === "heading") {
    return (
      <EditableText
        as={node.content.level}
        data-vn={node.id}
        className={className}
        style={{ margin: 0, ...css }}
        plain={node.content.text}
        onText={editable ? onText : undefined}
      />
    );
  }
  if (node.type === "text" || node.type === "html") {
    if (editable && node.type === "text") {
      return <EditableText data-vn={node.id} className={className} style={css} html={node.content.html} onText={onText} />;
    }
    return <div data-vn={node.id} className={className} style={css} dangerouslySetInnerHTML={{ __html: node.content.html }} />;
  }
  if (node.type === "image") {
    if (!node.content.src) {
      return showPlaceholder ? (
        <div data-vn={node.id} className={`grid min-h-24 place-items-center bg-neutral-100 text-sm text-neutral-500 ${className ?? ""}`} style={css}>
          Gambar
        </div>
      ) : null;
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element -- ukuran gambar builder bebas, bukan kandidat tetap next/image
      <img data-vn={node.id} src={mediaUrl(node.content.src)} alt={node.content.alt} className={className} style={{ height: "auto", ...css }} />
    );
  }
  if (node.type === "button") {
    const href = /^(https?:\/\/|\/|#|mailto:|tel:)/.test(node.content.href) ? node.content.href : "/";
    return (
      <a data-vn={node.id} href={href} className={className} style={css}>
        {node.content.label || "Tombol"}
      </a>
    );
  }
  if (node.type === "video") {
    const id = youtubeId(node.content.url);
    if (!id) {
      return showPlaceholder ? (
        <div data-vn={node.id} className="grid aspect-video place-items-center bg-neutral-100 text-sm text-neutral-500" style={css}>
          Video YouTube
        </div>
      ) : null;
    }
    return (
      <div data-vn={node.id} className={className} style={{ ...css, position: "relative", width: css?.width ?? "100%", aspectRatio: "16 / 9" }}>
        <iframe
          title="Video"
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  if (node.type === "gallery") {
    const gap = typeof css?.gap === "number" ? css.gap : 12;
    return (
      <div data-vn={node.id} className={className} style={{ ...css, display: "grid", gridTemplateColumns: `repeat(${node.content.columns}, minmax(0, 1fr))`, gap }}>
        {node.content.images.map((image) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={image.src} src={mediaUrl(image.src)} alt={image.alt} style={{ width: "100%", height: "auto" }} />
        ))}
        {showPlaceholder && node.content.images.length === 0 ? <div className="col-span-full grid min-h-24 place-items-center bg-neutral-100 text-sm text-neutral-500">Galeri kosong</div> : null}
      </div>
    );
  }
  if (node.type === "code") {
    if (device !== "public") {
      const hasCss = node.content.css.trim().length > 0;
      const hasJs = node.content.javascript.trim().length > 0;
      return (
        <div data-vn={node.id} className={`rounded border border-dashed border-neutral-300 bg-neutral-50 px-3 py-2 text-xs text-neutral-600 ${className ?? ""}`} style={css}>
          Kode kustom
          <span className="mt-1 block font-mono text-[11px] text-neutral-500">{hasCss ? "CSS" : "Tanpa CSS"} · {hasJs ? "JavaScript" : "Tanpa JavaScript"}</span>
        </div>
      );
    }
    return <PageCode id={node.id} css={node.content.css} javascript={node.content.javascript} />;
  }
  if (node.type === "divider") return <hr data-vn={node.id} className={className} style={css} />;
  if (node.type === "spacer") return <div data-vn={node.id} className={className} style={css} aria-hidden />;
  if (node.type === "icon") {
    const Icon = ICONS[node.content.name as IconName] ?? Heart;
    const size = typeof css?.fontSize === "number" ? css.fontSize : 32;
    return (
      <span data-vn={node.id} className={`inline-flex ${className ?? ""}`} style={css}>
        <Icon size={size} aria-hidden />
      </span>
    );
  }
  return null;
}

export function VisualTree({ nodes, device }: { nodes: VisualNode[]; device: Device | "public" }) {
  return nodes.map((node) => (
    <VisualNodeView key={node.id} node={node} device={device}>
      {node.type === "container" ? <VisualTree nodes={node.children ?? []} device={device} /> : undefined}
    </VisualNodeView>
  ));
}

/** Section `visual` di halaman publik. */
export function VisualSection({ nodes }: { nodes: VisualNode[] }) {
  if (!nodes.length) return null;
  return (
    <section className="container-site py-8">
      <style>{visualCss(nodes)}</style>
      <VisualTree nodes={nodes} device="public" />
    </section>
  );
}
