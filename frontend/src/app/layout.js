import "./globals.css";
import { CartProvider } from "../../context/CartContext";
import Navbar from "../../components/navbar/Navbar";
import Footer from "../../components/home/footer";
import { UserProvider } from "../../context/UserContext";
import PWARegister from "../../components/pwa/pwa-register";
import FloatingActionButton from "../../components/home/FloatingActionButton";

// তোমার থিম কালার
const themeColor = "#f472b6";

// ✅ এখানে তুমি চাইলে নিজের metadata সরাসরি লিখতে পারো
export const metadata = {
  title: "OpenUpBD | Trusted Online Shopping Platform in Bangladesh",
  description:
    "OpenUpBD is a reliable e-commerce platform in Bangladesh offering quality products at competitive prices. Shop online with secure payment, fast delivery, and excellent customer support.",
  icons: {
    icon: "/favicon.ico",
  },
};

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
            <main className="flex-grow bg-pink-50">
              <div className="mx-auto w-full max-w-[1280px]">
                {children}
              </div>
            </main>
            <Footer />
            <FloatingActionButton />
          </CartProvider>
        </UserProvider>
      </body>
    </html>
  );
}
