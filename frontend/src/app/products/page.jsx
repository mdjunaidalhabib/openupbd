import ProductCard from "../../../components/home/ProductCard";
import Link from "next/link";
import { apiFetch } from "../../../utils/api";

async function getProducts() {
  return await apiFetch("/products", {
    cache: "no-store", // ✅ সর্বদা fresh data
  });
}

export default async function AllProductsPage() {
  const products = await getProducts();

  return (
    <main className="bg-pink-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">All Products</span>
        </nav>

        {/* Heading */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl sm:text-3xl font-semibold">All Products</h1>
        </div>

        {/* Products Grid */}
        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p>No products available.</p>
          </div>
        )}
      </div>
    </main>
  );
}
