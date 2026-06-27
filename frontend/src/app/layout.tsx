import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MallikaAI - AI Assistant",
  description: "Advanced AI assistant with deep reasoning, code execution, and more",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = JSON.parse(localStorage.getItem('mallika-settings') || '{}');
                  var theme = stored.state && stored.state.theme;
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else if (theme === 'system') {
                    if (!window.matchMedia('(prefers-color-scheme: dark)').matches) {
                      document.documentElement.classList.remove('dark');
                    }
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900`}>
        {children}
      </body>
    </html>
  );
}
