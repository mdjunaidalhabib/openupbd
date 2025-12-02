import ProductDetailsClient from "../../../../components/home/ProductDetailsClient";
import { apiFetch } from "../../../../utils/api";

// 🟢 একক প্রোডাক্ট লোড
async function getProduct(id) {
  try {
    const product = await apiFetch(`/products/${id}`, { cache: "no-store" });

    // ✅ fallback: main image না থাকলে gallery image থেকে সেট করো
    if (!product?.image && product?.images?.length > 0) {
      product.image = product.images[0];
    }

    // ✅ fallback: কোনো image না থাকলে default সেট করো
    if (!product?.image) {
      product.image = "/no-image.png";
    }

    return product;
  } catch (err) {
    console.error("❌ Error fetching product:", err);
    return null;
  }
}

// 🟢 ক্যাটাগরি লোড
async function getCategory(categoryId) {
  if (!categoryId) return null;
  try {
    return await apiFetch(`/api/categories/${categoryId}`, { cache: "no-store" });
  } catch {
    return null;
  }
}

// 🟢 একই ক্যাটাগরির রিলেটেড প্রোডাক্ট
async function getRelated(categoryId, productId) {
  if (!categoryId) return [];
  try {
    const products = await apiFetch(`/api/products/category/${categoryId}`, {
      cache: "no-store",
    });
    return products.filter((p) => p._id !== productId);
  } catch {
    return [];
  }
}

export default async function ProductDetailsPage({ params }) {
  // ✅ প্রোডাক্ট ডাটা লোড
  const product = await getProduct(params.id);

  if (!product?._id) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <p>❌ Product not found.</p>
        </div>
      </main>
    );
  }

  // ✅ ক্যাটাগরি আইডি ঠিকভাবে নির্ধারণ
  const categoryId =
    typeof product.category === "object"
      ? product.category?._id
      : product.category;

  const category = await getCategory(categoryId);
  const related = await getRelated(categoryId, product._id);

  // ✅ ফাইনাল রেন্ডার
  return (
    <ProductDetailsClient
      product={product}
      category={category}
      related={related}
    />
  );
}
