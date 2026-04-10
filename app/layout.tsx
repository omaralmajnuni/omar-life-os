import "./globals.css";
import Nav from "@/components/Nav";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          <main id="app-main-layout" className="relative min-h-screen flex flex-col">
            {children}
          </main>
          <Nav />
        </ThemeProvider>
      </body>
    </html>
  );
}