import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Internship Radar | PM, TPM, Project & Ops Dashboard',
  description: 'Live internship and co-op postings found in the past 24 hours across Simplify, ATS, LinkedIn, and Workday.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
