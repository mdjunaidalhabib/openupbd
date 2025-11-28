"use client";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function NavbarAdminPanel() {
  const [navbar, setNavbar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Fetch Navbar Data
  useEffect(() => {
    const fetchNavbar = async () => {
      try {
        const res = await fetch(`${API_URL}/api/navbar`);
        const data = await res.json();
        setNavbar({ ...data, brand: data.brand || {} });
      } catch (err) {
        toast.error("❌ Failed to fetch navbar data");
      } finally {
        setLoading(false);
      }
    };
    fetchNavbar();
  }, [API_URL]);

  // ✅ Save Navbar (brand + removeLogo + optional file)
  const handleSave = async (nextNavbar) => {
    setSaving(true);
    try {
      const payload = structuredClone(nextNavbar);

      const formData = new FormData();

      if (payload.brand?.logoFile) {
        formData.append("logo", payload.brand.logoFile);
        delete payload.brand.logoFile;
      }

      if (payload.removeLogo) {
        formData.append("removeLogo", "true");
        delete payload.removeLogo;
      }

      formData.append("brand", JSON.stringify(payload.brand || {}));

      const res = await fetch(`${API_URL}/api/navbar`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Save failed");

      const data = await res.json();
      setNavbar(data.navbar);
      toast.success("✅ Navbar updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to update navbar");
    } finally {
      setSaving(false);
    }
  };

  // ✅ Upload Logo (same endpoint)
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const updated = {
      ...navbar,
      brand: { ...navbar.brand, logoFile: file },
    };

    setNavbar(updated);
    handleSave(updated);

    // ✅ VERY IMPORTANT: reset input so same file triggers onChange again
    e.target.value = "";
  };

  if (loading) return <p>Loading...</p>;
  if (!navbar) return <p>No navbar data</p>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      {/* ✅ Footer-like Toast Style (ONLY UI) */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#0f172a",
            color: "#fff",
            padding: "12px 14px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 600,
            boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
          },
          success: {
            style: { background: "#16a34a" },
            iconTheme: { primary: "#fff", secondary: "#16a34a" },
          },
          error: {
            style: { background: "#dc2626" },
            iconTheme: { primary: "#fff", secondary: "#dc2626" },
          },
        }}
      />

      <h2 className="text-xl font-bold mb-4">🛠 Navbar Admin Panel</h2>

      {/* Brand Name */}
      <div className="mb-4">
        <label className="block font-medium mb-1">Brand Name</label>
        <input
          type="text"
          value={navbar?.brand?.name || ""}
          onChange={(e) =>
            setNavbar({
              ...navbar,
              brand: { ...navbar.brand, name: e.target.value },
            })
          }
          className="w-full border p-2 rounded"
          disabled={saving}
        />
        <button
          onClick={() => handleSave(navbar)}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={saving}
        >
          {saving ? "Saving..." : "💾 Save Name"}
        </button>
      </div>

      {/* Logo Upload */}
      <div className="mb-4">
        <label className="block font-medium mb-2">Logo</label>

        {navbar?.brand?.logo ? (
          <div className="flex items-center gap-3 mb-3">
            <img
              src={navbar.brand.logo}
              alt="Logo"
              className="h-16 rounded border"
            />

            {/* ✅ Remove Logo (logic same) */}
            <button
              disabled={saving}
              onClick={() => {
                const updated = {
                  ...navbar,
                  brand: {
                    ...navbar.brand,
                    logo: "",
                    logoPublicId: "",
                  },
                  removeLogo: true,
                };
                setNavbar(updated);
                handleSave(updated);
                toast.error("❌ Logo removed");
              }}
              className="bg-red-600 text-white px-3 py-1 rounded disabled:opacity-60"
            >
              Remove
            </button>
          </div>
        ) : null}

        {/* ✅ Hidden file input (same logic) */}
        <input
          type="file"
          id="logoUpload"
          accept="image/*"
          onChange={handleLogoUpload}
          disabled={saving}
          className="hidden"
        />

        {/* ✅ Extra compact upload UI */}
        {!navbar?.brand?.logo && (
          <button
            type="button"
            disabled={saving}
            onClick={() => document.getElementById("logoUpload")?.click()}
            className="w-full flex items-center justify-center gap-2 
                       border border-dashed border-gray-300 
                       hover:border-blue-400 hover:bg-blue-50 
                       text-gray-700 px-3 py-2 rounded-md transition 
                       text-sm disabled:opacity-60"
          >
            <span className="text-base">🖼️</span>
            <span className="font-medium">Upload Logo</span>
          </button>
        )}
      </div>

      {saving && (
        <p className="text-sm text-gray-500 italic">Saving changes...</p>
      )}
    </div>
  );
}
