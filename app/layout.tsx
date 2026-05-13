import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Roboto_Flex, Roboto_Mono } from "next/font/google";
import { MaterialThemeProvider } from "@/app/components/material/theme-provider";
import {
  isMaterialThemeId,
  materialThemeCookieName,
} from "@/app/components/material/theme-colors";
import "./globals.css";

const robotoFlex = Roboto_Flex({
  variable: "--font-roboto-flex",
  subsets: ["latin"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "QuotaHub Relay",
  description: "Server-side quota relay dashboard for linked clients.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(materialThemeCookieName)?.value;
  const materialTheme = themeCookie && isMaterialThemeId(themeCookie)
    ? themeCookie
    : "relay";

  return (
    <html
      lang="en"
      data-material-theme={materialTheme}
      className={`${robotoFlex.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MaterialThemeProvider initialTheme={materialTheme}>
          {children}
        </MaterialThemeProvider>
      </body>
    </html>
  );
}
