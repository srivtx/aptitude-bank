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
  title: "Placement Aptitude Research Bank",
  description: "Research-first question collection for Indian placement exams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <header className="border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-xl font-bold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors">
                Aptitude Bank
              </Link>
              <nav className="flex gap-6 text-sm">
                <Link href="/" className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                  Topics
                </Link>
                <Link href="/roadmap" className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                  Roadmap
                </Link>
                <Link href="/mock" className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                  Mock Tests
                </Link>
                <Link href="/bank" className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                  Bank
                </Link>
                <Link href="/patterns" className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                  Patterns
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">
          {children}
        </main>
        <footer className="border-t border-[var(--border)] mt-12 py-6 text-center text-sm text-[var(--text-muted)]">
          <p>Research-first placement preparation. Data from IndiaBIX, PrepInsta, GeeksforGeeks.</p>
        </footer>
      </body>
    </html>
  );
}
