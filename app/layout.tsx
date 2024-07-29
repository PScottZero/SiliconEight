import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { CookiesProvider } from "next-client-cookies/server";

const inter = IBM_Plex_Mono({
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
        <link rel="icon" href="img/icons8-electronics-96.png" sizes="any" />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        <CookiesProvider>{children}</CookiesProvider>
      </body>
    </html>
  );
}
