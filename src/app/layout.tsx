import { Outfit } from "next/font/google";
import "./globals.css";
import "flatpickr/dist/flatpickr.css";
import Providers from "./providers";

const outfit = Outfit({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${outfit.className} min-h-screen bg-gray-50 dark:bg-gray-900`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}