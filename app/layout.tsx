import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import NextTopLoader from "nextjs-toploader";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="https://prod.spline.design/gdzDOdrCBCG8apuu/scene.splinecode"
          as="fetch"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <NextTopLoader color="var(--accent-blue)" height={2} showSpinner={false} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
