import "./globals.css";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { AppProvider } from "@/context/AppContext";
import SiteChrome from "@/components/SiteChrome";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const appName = process.env.NEXT_PUBLIC_APP_NAME || "Sells Point";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(appUrl),
  title: `${appName} — Buy & Sell with Trust`,
  description: "A premium online marketplace to buy and sell mobiles, laptops, vehicles, furniture and more with built-in chat and verified sellers.",
  icons: {
    icon: "/assets/brand/sellspoint-logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable}`}>
      <body className="font-body">
        <AppProvider>
          <SiteChrome appName={appName}>{children}</SiteChrome>
        </AppProvider>
      </body>
    </html>
  );
}
