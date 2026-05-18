import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aptitude Bank",
  description: "Research-first placement preparation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
        <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]">
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" scroll={false} className="text-sm font-medium tracking-tight hover:opacity-70 transition-opacity">
              Aptitude Bank
            </Link>
            <nav className="flex gap-6 text-sm">
              <Link href="/" scroll={false} className="text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors">
                Topics
              </Link>
              <Link href="/roadmap" scroll={false} className="text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors">
                Roadmap
              </Link>
              <Link href="/mock" scroll={false} className="text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors">
                Mock Tests
              </Link>
              <Link href="/bank" scroll={false} className="text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors">
                Bank
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-6 py-10">
          {children}
        </main>
        <footer className="border-t border-[var(--border)] mt-20 py-8 text-center text-xs text-[var(--text-muted)]">
          <p>Research-first placement preparation</p>
        </footer>
      </body>
    </html>
  );
}
