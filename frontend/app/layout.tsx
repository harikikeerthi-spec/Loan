import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: {
    default: "Vidhya Loans - Fund Your Dream Education Abroad",
    template: "%s | Vidhya Loans",
  },
  description:
    "Compare education loans from 50+ banks & NBFCs. Get the best rates, quick approvals, and expert guidance — all in one place.",
  keywords: [
    "education loan",
    "study abroad",
    "student loan India",
    "loan comparison",
    "overseas education",
  ],
  openGraph: {
    title: "Vidhya Loans - Fund Your Dream Education Abroad",
    description:
      "Compare education loans from 50+ banks & NBFCs. Get the best rates, quick approvals, and expert guidance.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,100..900;1,100..900&family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Plus+Jakarta+Sans:wght@200..800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="min-h-screen transition-colors duration-500 overflow-x-hidden bg-white">
        {/* Background Structure exactly like index.html - No Dark Mode */}
        <div className="fixed inset-0 z-[-1] bg-white pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(at_0%_0%,rgba(102,5,199,0.4)_0px,transparent_50%),radial-gradient(at_100%_0%,rgba(224,195,137,0.5)_0px,transparent_50%),radial-gradient(at_100%_100%,rgba(139,192,232,0.4)_0px,transparent_50%),radial-gradient(at_0%_100%,rgba(102,5,199,0.3)_0px,transparent_50%)] opacity-90"></div>
          <div
            className="absolute inset-0 opacity-30 mix-blend-overlay"
            style={{
              backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCSQJcRexkqlKu3kzwZCWIGdx9mSdhvK4Je6lxA9kVrWHQFg-ShCu6j3XLipgBh0waP45VYm3rBVD2Psy-FTMp2qLU946EXQwD2sIGZJLe5tw2ugWPYnnOTMWoTGM95X4u1epiDmYaEV_vVdH7tyv2ZlDuFjSMZlzWulHW3UyesMipUWi30MryHEiz-_Lje83ApXK-FpMUQdIEWe0M_ZFfiu3BcH1_opus8b5qOTiMh8tMBAX7ifzSLR_qpWnWtdB8obUzknDxLtfeP")',
              backgroundSize: 'cover'
            }}
          ></div>
        </div>

        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
