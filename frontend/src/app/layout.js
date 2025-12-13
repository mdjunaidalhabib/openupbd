import "./globals.css";
import { CartProvider } from "../../context/CartContext";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/home/footer";
import { UserProvider } from "../../context/UserContext";
import PWARegister from "../../components/pwa/pwa-register";
import FloatingActionButton from "../../components/home/FloatingActionButton";
import { rootMetadata } from "../../components/seo/RootMetadata";

// তোমার আগের themeColor এখন আলাদা করে এখানে declare করতে পারো
const themeColor = "#f472b6";

export const metadata = rootMetadata;

export function generateViewportMetadata() {
  return {
    themeColor,
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-gray-50">
        <PWARegister />

        <UserProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-grow bg-pink-50">{children}</main>
            <Footer />
            <FloatingActionButton />
          </CartProvider>
        </UserProvider>
      </body>
    </html>
  );
}
