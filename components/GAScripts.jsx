'use client'
import Script from 'next/script'
import { usePathname } from 'next/navigation'

export default function GAScripts() {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null
  return (
    <>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-BT9KM61B0S" strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-BT9KM61B0S');
      `}</Script>
      <Script id="clarity-init" strategy="afterInteractive">{`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window,document,"clarity","script","wxry0u7az6");
      `}</Script>
    </>
  )
}
