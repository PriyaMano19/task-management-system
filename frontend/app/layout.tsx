import "./globals.css";
import AppProvider from "@/providers/app-provider";
import AuthInitializer from "@/components/AuthInitializer";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
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