import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Repoverse — Your code has a universe',
  description: 'Explore any public GitHub profile as a procedural universe of code.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
