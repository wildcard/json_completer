import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'json_completer - High-Performance JSON Completion Library',
  description: 'Complete incomplete JSON instantly. Rust-powered, 10-50x faster, universal compatibility with Node.js, Nest.js, Next.js, and more.',
  keywords: 'json, completion, parser, rust, typescript, nodejs, streaming, api',
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
