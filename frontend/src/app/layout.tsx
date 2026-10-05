import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Observability Control Center | OpenTelemetry & Dynatrace",
  description: "Enterprise Observability Control Center showcasing distributed tracing, OpenTelemetry Collector pipelines, microservices topology, APM metrics, logs correlation, and Dynatrace PurePath hybrid monitoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-[#060913] text-slate-100 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
