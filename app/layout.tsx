import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Raddai Metropolitan School Jalingo - Excellence in Education",
  description: "Raddai Metropolitan School Jalingo provides quality education with modern facilities, qualified teachers, and comprehensive academic programs from nursery to senior secondary level.",
  keywords: "Raddai Metropolitan School, Jalingo, Taraba State, school, education, nursery, primary, secondary, WAEC, NECO, quality education",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
