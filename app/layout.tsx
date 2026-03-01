import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agency OS",
  description: "Run your marketing agency from one system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
