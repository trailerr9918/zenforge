import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZenForge AI — Elite Website Design Studio",
  description: "ZenForge AI is an elite website design studio powered by Z.AI. Generate stunning, production-quality websites from a simple description.",
  keywords: ["ZenForge", "ZenForge AI", "Website Builder", "AI Website Design", "Next.js", "TypeScript", "Tailwind CSS", "React"],
  authors: [{ name: "ZenForge" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "ZenForge AI — Elite Website Design Studio",
    description: "Generate stunning, production-quality websites from a simple description.",
    url: "https://zenforge.site",
    siteName: "ZenForge",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZenForge AI",
    description: "Elite website design studio powered by Z.AI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
