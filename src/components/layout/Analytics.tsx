import Script from "next/script";

/**
 * GA4 + Meta Pixel — hanya aktif bila ID diisi di /admin/pengaturan (fallback: environment
 * variable NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_META_PIXEL_ID). ID sudah divalidasi Zod
 * (G-XXXX / angka) sehingga aman disisipkan ke skrip.
 */
export function Analytics({ gaId: ga, pixelId: pixel }: { gaId: string; pixelId: string }) {
  // Hanya produksi: dev lokal & preview Vercel tidak mengirim data ke GA4/Pixel.
  const live = process.env.NODE_ENV === "production" && (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production");
  const gaId = live ? ga : "";
  const pixelId = live ? pixel : "";

  return (
    <>
      {gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
          </Script>
          {/* Event klik untuk kartu dashboard (src/server/ga4.ts): satu listener terdelegasi untuk semua tombol Donasi & WhatsApp. */}
          <Script id="ga4-click-events" strategy="afterInteractive">
            {`document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(!a||typeof gtag!=='function')return;var h=a.getAttribute('href')||'';var p=h.replace(/^https?:\\/\\/[^/]+/,'');if(/^\\/(campaign|donasi|prog)/.test(p)){gtag('event','donate_click',{link_url:h,transport_type:'beacon'});}else if(/api\\.whatsapp\\.com|wa\\.me\\//.test(h)){gtag('event','whatsapp_click',{link_url:h,transport_type:'beacon'});}},true);`}
          </Script>
        </>
      )}
      {pixelId && (
        <Script id="meta-pixel" strategy="lazyOnload">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
