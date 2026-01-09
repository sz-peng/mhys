import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import { isDbEnabled, getSetting, initDatabase } from "@/lib/db";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 动态生成 metadata，从数据库读取站点标题
export async function generateMetadata(): Promise<Metadata> {
  const defaultTitle = "梅花易数 | 观象占验";
  const defaultDescription = "基于梅花易数的在线占卜工具";

  let siteTitle = defaultTitle;

  try {
    if (isDbEnabled()) {
      await initDatabase();
      const title = await getSetting<string>('site_title', '梅花易数');
      if (title) {
        siteTitle = `${title} | 观象占验`;
      }
    }
  } catch (error) {
    console.error('Failed to fetch site title:', error);
    // 使用默认标题
  }

  return {
    title: siteTitle,
    description: defaultDescription,
    icons: {
      icon: "/icon.png",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        {children}
        <Footer />

      </body>
    </html>
  );
}
