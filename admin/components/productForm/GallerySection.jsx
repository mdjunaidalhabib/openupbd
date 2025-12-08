import React, { useRef } from "react";
import { X } from "lucide-react";


export default function GallerySection({
  form,
  galleryDropRef,
  handleGalleryDrop,
  handleGalleryFiles,
  galleryPreviews,
  removeGalleryImage,
  moveGalleryImage,
  clearAllGallery,
}) {
  const dragItemIndex = useRef(null);
  const dragOverIndex = useRef(null);

  const handleDragStart = (idx) => {
    dragItemIndex.current = idx;
  };

  const handleDragEnter = (idx) => {
    dragOverIndex.current = idx;
  };

  const handleDragEnd = () => {
    const from = dragItemIndex.current;
    const to = dragOverIndex.current;

    if (
      from === null ||
      to === null ||
      from === to ||
      from < 0 ||
      to < 0
    ) {
      dragItemIndex.current = null;
      dragOverIndex.current = null;
      return;
    }

    moveGalleryImage(from, to);

    dragItemIndex.current = null;
    dragOverIndex.current = null;
  };

  return (
    <section className="bg-gradient-to-br from-pink-50 to-white rounded-2xl p-5 border border-pink-100 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          📸 গ্যালারির ছবি
          <span className="text-xs font-medium text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">
            Optional
          </span>
        </h2>

        <div className="flex items-center gap-3">
          {form.images.length > 0 && (
            <>
              <p className="text-xs text-gray-500">
                {form.images.length} ছবি যুক্ত আছে
              </p>
              <button
                type="button"
                onClick={clearAllGallery}
                className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 px-2 py-1 rounded-lg"
              >
                Clear all
              </button>
            </>
          )}
        </div>
      </div>

      <div
        ref={galleryDropRef}
        onDrop={handleGalleryDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => galleryDropRef.current?.querySelector("input")?.click()}
        className="group relative rounded-2xl border-2 border-dashed border-pink-200 bg-pink-50/50 p-5 cursor-pointer hover:border-pink-400 hover:bg-white transition"
      >
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-white shadow-sm ring-1 ring-pink-100 flex items-center justify-center text-2xl">
            🖼️
          </div>

          <div className="flex-1 text-center sm:text-left">
            <p className="font-semibold text-gray-700">
              একাধিক ছবি ড্র্যাগ করে ছাড়ুন
            </p>
            <p className="text-sm text-gray-500">অথবা ক্লিক করে সিলেক্ট করুন</p>
            <p className="text-xs text-gray-400">
              JPG, PNG, WEBP • Multiple allowed • Max 5MB each
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-pink-600 text-white text-xs font-medium shadow-sm">
            ⬆ Upload Gallery
          </div>
        </div>

        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleGalleryFiles(e.target.files)}
        />
      </div>

      {form.images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {galleryPreviews.map((src, idx) => (
            <div
              key={src + idx}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className="relative group rounded-2xl overflow-hidden border bg-white shadow-sm cursor-grab active:cursor-grabbing"
            >
              <img
                src={src}
                alt={`gallery-${idx}`}
                className="h-36 w-full object-cover transition group-hover:scale-105"
              />

              {/* index pill */}
              <div className="absolute top-2 left-2 text-[11px] bg-black/60 text-white px-2 py-0.5 rounded-full">
                #{idx + 1}
              </div>

              {/* remove */}
              <button
                type="button"
                onClick={() => removeGalleryImage(idx)}
                className="absolute top-2 right-2 bg-white text-red-600 text-xs px-2 py-1 rounded-full shadow-sm opacity-95 hover:opacity-100 hover:bg-red-50 transition flex items-center justify-center"
                aria-label="Remove image"
              >
                <X size={14} className="text-red-600" />
              </button>

              {/* Drag handle UI (no buttons) */}
              <div className="absolute inset-x-0 bottom-0 p-2">
                <div
                  className="flex items-center justify-center gap-2 rounded-xl bg-black/55 backdrop-blur-md px-2 py-1.5
                                opacity-100 md:opacity-0 md:group-hover:opacity-100 transition"
                >
                  <span className="text-white/90 text-xs flex items-center gap-2 select-none">
                    <span className="text-sm leading-none">⋮⋮</span>
                    টেনে এনে সাজান
                  </span>
                </div>
              </div>

              {/* bottom gradient for readability */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
