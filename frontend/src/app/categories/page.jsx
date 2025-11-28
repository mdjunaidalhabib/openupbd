"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
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

  const [loading, setLoading] = useState(true); // category loading
  const [productLoading, setProductLoading] = useState(false); // products loading

  const [catError, setCatError] = useState(false);
  const [prodError, setProdError] = useState(false);

  // 🔹 প্রোডাক্ট লোড (memoized)
  const fetchProducts = useCallback((categoryId) => {
    if (!categoryId) return;

    setSelectedCategory(categoryId);
    setProductLoading(true);
    setProdError(false);

    axios
      .get(`${API_URL}/api/products/category/${categoryId}`)
      .then((res) => {
        setProducts(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error(err);
        setProdError(true);
        setProducts([]); // clear to avoid stale data
      })
      .finally(() => setProductLoading(false));
  }, []);

  // 🔹 ক্যাটাগরি লোড
  useEffect(() => {
    let cancelled = false;
    let retryTimer = null;

    const loadCategories = async () => {
      try {
        setLoading(true);
        setCatError(false);

        const res = await axios.get(`${API_URL}/api/categories`);
        if (cancelled) return;

        const data = Array.isArray(res.data) ? res.data : [];
        setCategories(data);

        if (data.length > 0) {
          const firstCat = data[0];
          setSelectedCategory(firstCat._id);
          fetchProducts(firstCat._id);
        } else {
          setSelectedCategory(null);
          setProducts([]);
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        if (cancelled) return;

        setCatError(true);
        setLoading(false);

        // ✅ Auto retry (optional): 3s পর আবার চেষ্টা করবে
        retryTimer = setTimeout(loadCategories, 3000);
      }
    };

    loadCategories();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [fetchProducts]);

  // ✅ category skeleton should show if:
  // loading OR error OR no categories
  const shouldShowCategorySkeleton = useMemo(() => {
    return loading || catError || categories.length === 0;
  }, [loading, catError, categories.length]);

  // ✅ product skeleton should show if:
  // products loading OR product error OR selected category but no products yet
  const shouldShowProductSkeleton = useMemo(() => {
    if (!selectedCategory) return false;
    return productLoading || prodError || products.length === 0;
  }, [selectedCategory, productLoading, prodError, products.length]);

  // 🌀 প্রথমবার / category fail হলে পুরো Skeleton always
  if (shouldShowCategorySkeleton) {
    return (
      <div>
        <CategorySkeleton />
        <p className="text-center text-sm text-gray-500 mt-2">
          {catError
            ? "ক্যাটাগরি লোড হচ্ছে না—আবার চেষ্টা করা হচ্ছে..."
            : "লোড হচ্ছে..."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-pink-50">
      <div className="container mx-auto flex flex-col md:flex-row gap-6 p-3 md:p-6">
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

          {/* ✅ Products skeleton always when fail/empty/loading */}
          {shouldShowProductSkeleton ? (
            <div>
              <ProductDetailsSkeleton />
              <p className="text-center text-sm text-gray-500 mt-2">
                {prodError
                  ? "প্রোডাক্ট লোড হচ্ছে না—আবার চেষ্টা করা হচ্ছে..."
                  : "প্রোডাক্ট লোড হচ্ছে..."}
              </p>
            </div>
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
