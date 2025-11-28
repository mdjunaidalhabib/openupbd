import "./globals.css";
import { CartProvider } from "../../context/CartContext";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/home/footer";
import { UserProvider } from "../../context/UserContext";
import PWARegister from "../../components/pwa-register";

export const metadata = {
  title: "Habib's Fashion",
  description: "Habib's Fashion store",
  icons: {
    icon: "/Logo-Rounted.ico",
    shortcut: "/Logo-Rounted.ico",
    apple: "/Logo-Rounted.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f472b6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>

      <body className="flex flex-col min-h-screen bg-gray-50">
        <PWARegister />
        <UserProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-grow bg-pink-50">{children}</main>
            <Footer />
          </CartProvider>
        </UserProvider>
      </body>
    </html>
  );
}
