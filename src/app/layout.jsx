import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import SiteChrome from "@/components/SiteChrome";

const appName = process.env.NEXT_PUBLIC_APP_NAME || "Sells Point";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(appUrl),
  title: `${appName} — Buy & Sell with Trust`,
  description: "A premium online marketplace to buy and sell mobiles, laptops, vehicles, furniture and more with built-in chat and verified sellers.",
};

export default function RootLayout({ children }) {
  return <html lang="en"><body className="font-body"><AppProvider><SiteChrome appName={appName}>{children}</SiteChrome></AppProvider></body></html>;
}
