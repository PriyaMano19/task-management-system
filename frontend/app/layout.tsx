import "./globals.css";
import AppProvider from "@/providers/app-provider";
import AuthInitializer from "@/components/AuthInitializer";
import { Toaster } from "sonner";
import { Geist } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
     <body className="font-sans antialiased">
        <AppProvider>
          <AuthInitializer />
          {children}

          <Toaster
            position="top-right"
            richColors
            closeButton
          />
        </AppProvider>
      </body>
    </html>
  );
}