"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import ProductCard from "../../../components/home/ProductCard";
import CategorySkeleton from "../../../components/skeletons/CategorySkeleton";
import ProductDetailsSkeleton from "../../../components/skeletons/ProductDetailsSkeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function CategoryPage() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(false);

  // 🔹 ক্যাটাগরি লোড
  useEffect(() => {
    axios
      .get(`${API_URL}/api/categories`)
      .then((res) => {
        setCategories(res.data);
        if (res.data.length > 0) {
          const firstCat = res.data[0];
          setSelectedCategory(firstCat._id);
          fetchProducts(firstCat._id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // 🔹 প্রোডাক্ট লোড
  const fetchProducts = (categoryId) => {
    setSelectedCategory(categoryId);
    setProductLoading(true);
    axios
      .get(`${API_URL}/api/products/category/${categoryId}`)
      .then((res) => setProducts(res.data))
      .catch((err) => console.error(err))
      .finally(() => setProductLoading(false));
  };

  // 🌀 প্রথমবার পুরো Skeleton
  if (loading) return <CategorySkeleton />;

  return (
    <div className="bg-pink-50">
      <div className=" container mx-auto flex flex-col md:flex-row gap-6 p-3 md:p-6">
        {/* === Category Sidebar === */}
        <div className="md:w-64 bg-pink-100 shadow-md rounded-xl p-3 md:p-4">
          <h3 className="text-lg font-semibold mb-3 border-b pb-2">
            🗂️ Categories
          </h3>

          <ul className="flex md:flex-col gap-3 overflow-x-auto md:space-y-2 no-scrollbar">
            {categories.map((cat) => (
              <li
                key={cat._id}
                onClick={() => fetchProducts(cat._id)}
                className={`flex items-center gap-3 p-2 rounded-lg border border-pink-400 cursor-pointer transition min-w-[120px] md:min-w-0 ${
                  selectedCategory === cat._id
                    ? "bg-pink-300 text-pink-600 font-medium border"
                    : "hover:bg-pink-300"
                }`}
              >
                {cat.image && (
                  <div className="relative w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      className="rounded-md object-cover border"
                    />
                  </div>
                )}
                <span className="truncate">{cat.name}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* === Product List === */}
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-4">
            {selectedCategory
              ? "🛍️ Products"
              : "👉 প্রথমে কোনো Category সিলেক্ট করুন"}
          </h3>

          {productLoading ? (
            <ProductDetailsSkeleton />
          ) : products.length === 0 ? (
            <p className="text-gray-500">কোনো পণ্য পাওয়া যায়নি 😔</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
