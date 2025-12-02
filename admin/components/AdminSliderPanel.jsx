"use client";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import AddSlideModal from "./AddSlideModal";
import SliderPanelSkeleton from "./Skeleton/SliderSkeleton";

export default function AdminSliderPanel() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const [slides, setSlides] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  // add/edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editSlide, setEditSlide] = useState(null);

  // single delete modal state
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ✅ delete-all modal state
  const [deleteAllModal, setDeleteAllModal] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  // fetch slides
  const fetchSlides = async () => {
    try {
      setPageLoading(true);
      const res = await fetch(`${API_URL}/admin/sliders`, {
        credentials: "include",
      });
      const data = await res.json();
      setSlides(data.slides || []);
    } catch {
      toast.error("❌ Failed to fetch slides");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, [API_URL]);

  // save slide
  const handleSave = async (slideObj) => {
    setSavingId(slideObj._id || "new");
    try {
      const payload = structuredClone(slideObj);
      const formData = new FormData();

      if (payload.imageFile) {
        formData.append("image", payload.imageFile);
        delete payload.imageFile;
      }

      if (payload.removeImage) {
        formData.append("removeImage", "true");
        delete payload.removeImage;
      }

      formData.append("slide", JSON.stringify(payload));

      const res = await fetch(`${API_URL}/admin/sliders`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Save failed");

      const data = await res.json();
      setSlides(data.slides || []);
      toast.success("✅ Slide saved");

      setShowModal(false);
      setEditSlide(null);
    } catch (e) {
      console.error(e);
      toast.error("❌ Slide save failed");
    } finally {
      setSavingId(null);
    }
  };

  // open single delete modal
  const confirmDelete = (slide) => setDeleteModal(slide);

  // delete single slide (modal confirm)
  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);

    try {
      const res = await fetch(`${API_URL}/admin/sliders/${deleteModal._id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Delete failed");

      toast.success("✅ Slide deleted");
      setDeleteModal(null);
      fetchSlides();
    } catch {
      toast.error("❌ Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  // ✅ delete all slides handler
  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      const res = await fetch(`${API_URL}/admin/sliders/delete-all`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Delete all failed");

      toast.success("🗑 All slides deleted!");
      setDeleteAllModal(false);
      fetchSlides();
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to delete all slides");
    } finally {
      setDeletingAll(false);
    }
  };

  // toggle active
  const handleToggle = async (id) => {
    try {
      await fetch(`${API_URL}/admin/sliders/${id}/toggle`, {
        method: "PATCH",
        credentials: "include",
      });
      fetchSlides();
    } catch {
      toast.error("❌ Toggle failed");
    }
  };

  // ✅ Skeleton UI
  if (pageLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-9 w-56 bg-gray-200 rounded animate-pulse" />
        </div>

        <SliderPanelSkeleton count={8} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🖼️ Sliders</h1>

        <div className="flex gap-3">
          {/* ✅ Delete All Button */}
          {slides.length > 0 && (
            <button
              onClick={() => setDeleteAllModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg shadow"
            >
              🗑 Delete All
            </button>
          )}

          {/* Add New Slide Button */}
          <button
            onClick={() => {
              setEditSlide(null);
              setShowModal(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow"
          >
            + Add New Slide
          </button>
        </div>
      </div>

      {/* Slides Grid */}
      {slides.length === 0 ? (
        <div className="text-center text-gray-500 py-10">No slides found.</div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch">
          {slides.map((s) => (
            <div
              key={s._id}
              className="border border-gray-200 bg-white rounded-xl p-3 shadow-sm flex flex-col h-full"
            >
              {/* image fixed height */}
              <div className="h-44 bg-gray-100 rounded-lg overflow-hidden">
                {s.src ? (
                  <img
                    src={s.src}
                    alt={s.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="h-full grid place-items-center text-gray-400 text-sm">
                    No Image
                  </div>
                )}
              </div>

              {/* body */}
              <div className="flex flex-col flex-1 mt-2">
                <h2 className="font-semibold truncate min-h-[24px]">
                  {s.title || "No Title"}
                </h2>

                <p className="text-xs text-gray-500 truncate min-h-[18px]">
                  {s.href || "No link"}
                </p>

                <div className="flex justify-between items-center mt-2 min-h-[28px]">
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                    Serial No: {s.order ?? 1}
                  </span>

                  <button
                    onClick={() => handleToggle(s._id)}
                    className={`text-xs px-2 py-0.5 rounded ${
                      s.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {s.isActive ? "Active" : "Hidden"}
                  </button>
                </div>

                {/* actions bottom */}
                <div className="mt-auto pt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setEditSlide(s);
                      setShowModal(true);
                    }}
                    className="flex-1 bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => confirmDelete(s)}
                    className="flex-1 bg-red-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Add/Edit Modal */}
      <AddSlideModal
        showModal={showModal}
        closeModal={() => {
          setShowModal(false);
          setEditSlide(null);
        }}
        onSubmit={handleSave}
        loading={savingId === (editSlide?._id || "new")}
        editId={editSlide?._id || null}
        initialData={editSlide}
        slidesLength={slides.length}
      />

      {/* ✅ Single DELETE POPUP */}
      {deleteModal && (
        <>
          <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-40" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl border">
              <h2 className="text-xl font-bold text-red-600 mb-3">
                ⚠ Delete Slide
              </h2>

              <p className="text-gray-700 mb-6">
                আপনি কি নিশ্চিত{" "}
                <span className="font-semibold">
                  {deleteModal.title || "this slide"}
                </span>{" "}
                ডিলিট করতে চান?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  className="px-4 py-2 border rounded"
                  disabled={deleting}
                >
                  Cancel
                </button>

                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ✅ DELETE ALL POPUP */}
      {deleteAllModal && (
        <>
          <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-40" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl border">
              <h2 className="text-xl font-bold text-red-600 mb-3">
                ⚠ Delete ALL Slides
              </h2>

              <p className="text-gray-700 mb-6">
                আপনি কি নিশ্চিত সবগুলো স্লাইড ডিলিট করতে চান?
                <br />
                <span className="font-semibold text-red-600">
                  (এই কাজটি করলে কোন স্লাইড থাকবে না)
                </span>
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteAllModal(false)}
                  className="px-4 py-2 border rounded"
                  disabled={deletingAll}
                >
                  Cancel
                </button>

                <button
                  onClick={handleDeleteAll}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                  disabled={deletingAll}
                >
                  {deletingAll ? "Deleting..." : "Delete All"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
