import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Doorstep Returns",
  description: "Amazon return pickup service",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
