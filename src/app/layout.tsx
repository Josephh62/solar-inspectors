import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AVAX",
  description: "Solar inspection reports",
  other: {
    "theme-color": "#ffffff",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" style={{ backgroundColor: "#ffffff" }}>
      <body className={`${geist.className} min-h-full bg-white antialiased`}>
        {children}
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}
