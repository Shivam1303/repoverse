import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Repoverse — Your code has a universe',
  description: 'Explore any public GitHub profile as a procedural universe of code.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}

    {/* Cloudflare Web Analytics */}
    <script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "dc345fa3d98e41caa4a55f3d4be92e41"}'></script>
    {/* End Cloudflare Web Analytics */}
  </body></html>;
}
