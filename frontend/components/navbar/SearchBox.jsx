"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaSearch } from "react-icons/fa";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ✅ Debounce Hook
const useDebouncedValue = (value, delay = 400) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setV(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return v;
};

// ✅ Animation Variants
const panelVariants = {
  hidden: { y: "100%" },  // open এর সময় নিচ থেকে উঠবে
  visible: { y: 0 },      // অবস্থানে থাকবে
  exit: { y: "100%" },    // close এর সময় উপরের দিক থেকে নিচে নামবে
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export default function SearchBox({ mobileSearchOpen, setMobileSearchOpen }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebouncedValue(query);
  const ref = useRef(null);

  // ✅ Navigate to product
  const goToProduct = useCallback(
    (id) => {
      setQuery("");
      setResults([]);
      setMobileSearchOpen(false);
      router.push(`/products/${id}`);
    },
    [router, setMobileSearchOpen]
  );

  // ✅ Fetch search results
  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) return setResults([]);

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/products`
        );
        const products = await res.json();
        const filtered = products.filter((p) =>
          p.name?.toLowerCase().includes(q.toLowerCase())
        );
        if (!cancelled) setResults(filtered.slice(0, 20));
      } catch (e) {
        console.error(e);
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => (cancelled = true);
  }, [debouncedQuery]);

  return (
    <>
      {/* 🖥️ Desktop Search */}
      <div className="hidden md:block relative" ref={ref}>
        <input
          type="text"
          placeholder="Search products..."
          className="rounded-lg px-3 py-1 w-64 border border-pink-300  focus:outline-none focus:border-pink-400"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search products"
        />
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute mt-1 w-64 bg-white shadow rounded-lg px-3 py-2 text-gray-500"
            >
              Searching...
            </motion.div>
          )}
          {!loading && !!results.length && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="absolute mt-1 w-64 bg-white shadow rounded-lg max-h-60 overflow-y-auto"
            >
              {results.map((p) => (
                <button
                  key={p._id}
                  onClick={() => goToProduct(p._id)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100"
                >
                  {p.name}
                </button>
              ))}
            </motion.div>
          )}
          {!loading && debouncedQuery && !results.length && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute mt-1 w-64 bg-white shadow rounded-lg px-3 py-2 text-gray-500"
            >
              No results found
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 📱 Mobile Search Panel */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <>
            {/* 🔸 Background Fade */}
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileSearchOpen(false)}
            />

            {/* 🔸 Slide Animation */}
            <motion.div
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed inset-0 bg-pink-50 z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-pink-200 shadow-sm">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="flex-1 border border-pink-300  focus:outline-none focus:border-pink-400 rounded-lg px-3 py-2"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
                <button
                  className="ml-3 p-2 hover:bg-gray-100 rounded"
                  onClick={() => setMobileSearchOpen(false)}
                >
                  <X className="w-6 h-6 text-rose-600" />
                </button>
              </div>

              {/* Search Results */}
              <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                  <p className="text-gray-500">Searching...</p>
                ) : results.length ? (
                  results.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => goToProduct(p._id)}
                      className="block w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100"
                    >
                      {p.name}
                    </button>
                  ))
                ) : debouncedQuery ? (
                  <p className="text-gray-500">No results found</p>
                ) : (
                  <p className="text-gray-400">Type to search products...</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
