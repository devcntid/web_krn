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
