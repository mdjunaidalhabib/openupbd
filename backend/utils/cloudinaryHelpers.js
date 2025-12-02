import cloudinary from "./cloudinary.js";

// ✅ URL থেকে ডিলিট (পুরোনোটা রেখে দিলাম - Footer/Navbar এ ব্যবহার করো না)
export const deleteFromCloudinary = async (imageUrl, folder = "products") => {
  try {
    if (!imageUrl) return;

    const publicId = imageUrl.split("/").slice(-1)[0].split(".")[0];

    await cloudinary.uploader.destroy(`${folder}/${publicId}`, {
      resource_type: "image",
      invalidate: true,
    });

    // ✅ Recursive folder delete
    const deleteFolderIfEmpty = async (folderPath) => {
      const { resources, folders } = await cloudinary.api.resources({
        type: "upload",
        prefix: folderPath + "/",
        max_results: 1,
      });

      const isEmpty =
        resources.length === 0 && (!folders || folders.length === 0);

      if (isEmpty) {
        await cloudinary.api.delete_folder(folderPath);

        const parent = folderPath.includes("/")
          ? folderPath.split("/").slice(0, -1).join("/")
          : null;

        if (parent) await deleteFolderIfEmpty(parent);
      }
    };

    await deleteFolderIfEmpty(folder);
  } catch (error) {
    console.error("❌ Cloudinary deleteFromCloudinary error:", error);
  }
};

// ✅ public_id দিয়ে ডিলিট (Footer/Navbar Logo এর জন্য সেফ)
export const deleteByPublicId = async (publicId) => {
  try {
    if (!publicId) return;

    await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });

    // ✅ folder empty হলে ডিলিট
    const folder = publicId.includes("/")
      ? publicId.split("/").slice(0, -1).join("/")
      : null;

    if (!folder) return;

    const deleteFolderIfEmpty = async (folderPath) => {
      const { resources, folders } = await cloudinary.api.resources({
        type: "upload",
        prefix: folderPath + "/",
        max_results: 1,
      });

      const isEmpty =
        resources.length === 0 && (!folders || folders.length === 0);

      if (isEmpty) {
        await cloudinary.api.delete_folder(folderPath);

        const parent = folderPath.includes("/")
          ? folderPath.split("/").slice(0, -1).join("/")
          : null;

        if (parent) await deleteFolderIfEmpty(parent);
      }
    };

    await deleteFolderIfEmpty(folder);
  } catch (error) {
    console.error("❌ Cloudinary deleteByPublicId error:", error);
  }
};
