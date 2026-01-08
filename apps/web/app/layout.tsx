import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '../components/Providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'RuleTheWorld - Yönet, Öğren, Değiştir',
    template: '%s | RuleTheWorld',
  },
  description:
    'İnsanlara kendilerini yönetebileceklerini öğreten çok oyunculu tarayıcı oyunu. Topluluğunuzu yönetin, kararlar alın, sonuçlarıyla yüzleşin.',
  keywords: [
    'oyun',
    'demokrasi',
    'yönetim',
    'multiplayer',
    'eğitim',
    'topluluk',
    'strateji',
    'karar verme',
    'çok oyunculu',
  ],
  authors: [{ name: 'RuleTheWorld Team' }],
  creator: 'RuleTheWorld',
  publisher: 'RuleTheWorld',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: 'RuleTheWorld',
    title: 'RuleTheWorld - Yönet, Öğren, Değiştir',
    description: 'İnsanlara kendilerini yönetebileceklerini öğreten çok oyunculu tarayıcı oyunu.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'RuleTheWorld - Topluluk Yönetim Oyunu',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RuleTheWorld - Yönet, Öğren, Değiştir',
    description: 'İnsanlara kendilerini yönetebileceklerini öğreten çok oyunculu tarayıcı oyunu.',
    images: ['/images/og-image.jpg'],
  },
  verification: {
    // Google Search Console doğrulama kodu buraya eklenebilir
    // google: 'verification-code',
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var tema = JSON.parse(localStorage.getItem('tema-storage') || '{}');
                  var seciliTema = tema.state?.tema || 'koyu';
                  var gercekTema = seciliTema;
                  if (seciliTema === 'sistem') {
                    gercekTema = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'koyu' : 'acik';
                  }
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(gercekTema === 'koyu' ? 'dark' : 'light');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
