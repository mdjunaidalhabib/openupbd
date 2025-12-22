"use client";
import React from "react";
import { FaPalette, FaPlus, FaTrash, FaImages, FaTimes } from "react-icons/fa";

export default function ColorVariantSection({
  form,
  addColor,
  handleColorChange,
  removeColor,
}) {
  const handleColorImages = (index, files) => {
    const validFiles = Array.from(files).filter(
      (f) => f.size <= 5 * 1024 * 1024
    );
    const currentFiles = form.colors[index].files || [];
    handleColorChange(index, "files", [...currentFiles, ...validFiles]);
  };

  const removeColorImage = (colorIdx, imgIdx, isExisting = false) => {
    if (isExisting) {
      const updatedImages = form.colors[colorIdx].images.filter(
        (_, i) => i !== imgIdx
      );
      handleColorChange(colorIdx, "images", updatedImages);
    } else {
      const updatedFiles = form.colors[colorIdx].files.filter(
        (_, i) => i !== imgIdx
      );
      handleColorChange(colorIdx, "files", updatedFiles);
    }
  };

  return (
    <div className="space-y-4 border-t pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <FaPalette className="text-purple-600" /> Color Variants
        </h3>
        <button
          type="button"
          onClick={addColor}
          className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
        >
          <FaPlus /> Add Color
        </button>
      </div>

      <div className="space-y-4">
        {form.colors.map((color, colorIdx) => (
          <div
            key={colorIdx}
            className="bg-gray-50 rounded-xl p-4 border relative"
          >
            <button
              type="button"
              onClick={() => removeColor(colorIdx)}
              className="absolute top-2 right-2 text-red-400 hover:text-red-600"
            >
              <FaTrash size={14} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <input
                  type="text"
                  value={color.name}
                  onChange={(e) =>
                    handleColorChange(colorIdx, "name", e.target.value)
                  }
                  placeholder="Color Name (e.g. Black)"
                  className="w-full border p-2 rounded"
                />
                <input
                  type="number"
                  value={color.stock}
                  onChange={(e) =>
                    handleColorChange(colorIdx, "stock", e.target.value)
                  }
                  placeholder="Stock"
                  className="w-full border p-2 rounded"
                />
                <button
                  type="button"
                  onClick={() =>
                    document.getElementById(`file-${colorIdx}`).click()
                  }
                  className="w-full bg-white border-2 border-dashed p-2 rounded text-purple-600 text-sm font-bold"
                >
                  <FaImages className="inline mr-2" /> Select Images
                </button>
                <input
                  id={`file-${colorIdx}`}
                  type="file"
                  multiple
                  hidden
                  onChange={(e) => handleColorImages(colorIdx, e.target.files)}
                />
              </div>

              {/* Preview Area */}
              <div className="bg-white p-2 rounded border flex flex-wrap gap-2">
                {/* Existing Cloudinary Images */}
                {color.images?.map((url, imgIdx) => (
                  <div
                    key={`old-${imgIdx}`}
                    className="relative w-16 h-16 border"
                  >
                    <img
                      src={url}
                      className="w-full h-full object-cover"
                      alt="prev"
                    />
                    <button
                      type="button"
                      onClick={() => removeColorImage(colorIdx, imgIdx, true)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                ))}
                {/* New Selected Files Preview */}
                {color.files?.map((file, imgIdx) => (
                  <div
                    key={`new-${imgIdx}`}
                    className="relative w-16 h-16 border-2 border-purple-300"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      className="w-full h-full object-cover"
                      alt="preview"
                    />
                    <button
                      type="button"
                      onClick={() => removeColorImage(colorIdx, imgIdx, false)}
                      className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
