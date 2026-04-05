import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solar Inspector",
  description: "Solar panel inspection report generator",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} dark h-full`}>
      <body className="min-h-full flex flex-col bg-[#0f172a] text-slate-100">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
