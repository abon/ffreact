import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import NoWrapper from "./components/NoWrapper";
import "@mantine/core/styles.css";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FFmpeg Converter",
  description: "Transform videos the way you like",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body className="bg-gray-200 ">
        <NoWrapper>
          <MantineProvider>{children}</MantineProvider>
        </NoWrapper>
      </body>
    </html>
  );
}
