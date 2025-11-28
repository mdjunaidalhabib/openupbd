// app/dashboard/layout.jsx
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import "../globals.css";

export const metadata = {
  title: "Dashboard | Admin Panel",
  icons: {
    icon: "/Logo-Rounted.ico",
    shortcut: "/Logo-Rounted.ico",
    apple: "/Logo-Rounted.ico",
  },
};

export default function AdminLayout({ children }) {
  return (
        <div className="flex h-screen bg-gray-100">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Header />
            <main className="p-2 sm:p-4 overflow-auto flex-1">{children}</main>
          </div>
        </div>
  );
}
