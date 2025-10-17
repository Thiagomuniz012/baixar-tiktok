import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TikTok Downloader - Baixe vídeos e áudios do TikTok!",
  description: "Baixe vídeos do TikTok em alta qualidade, baixa qualidade ou apenas áudio MP3. Rápido, fácil e gratuito.",
  other: {
    monetag: "3a7efed86c94e17eac3f4a28511e7350",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}

        <Script
          src="https://fpyf8.com/88/tag.min.js"
          data-zone="178778"
          strategy="lazyOnload"
          data-cfasync="false"
        />
      </body>
    </html>
  );
}
