import type { Metadata } from "next";
import { Kode_Mono } from "next/font/google";
import "./globals.css";

const kodeMono = Kode_Mono({
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CHIP-8 Interpreter",
  description: "CHIP-8 interpreter written using next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="favicon.svg" sizes="any" />
      </head>
      <body className={kodeMono.className} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
