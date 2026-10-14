import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: { default: 'Open Shelf: your PayPal shop, ready for AI shoppers', template: '%s | Open Shelf' },
  description: 'Turn what you sell on PayPal into a store AI agents can ask questions of and buy from, and list it where agents shop.',
};

export const viewport: Viewport = { themeColor: '#f7f7f7' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
