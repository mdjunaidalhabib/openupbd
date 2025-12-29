export default function VariantSelector({
  colors = [],
  selectedColor,
  onSelect,
}) {
  if (!colors?.length) return null;

  return (
    <div className="mb-4">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
        Select Variant:
      </h3>

      <div className="flex flex-wrap gap-2">
        {colors.map((color, idx) => (
          <button
            type="button"
            key={idx}
            onClick={() => onSelect(color)}
            className={`px-4 py-2 border rounded-xl text-sm font-semibold transition-all ${
              selectedColor?.name === color.name
                ? "border-pink-600 bg-pink-600 text-white shadow-lg shadow-pink-200"
                : "border-gray-200 bg-white text-gray-600 hover:border-pink-300"
            }`}
          >
            {color.name}
          </button>
        ))}
      </div>
    </div>
  );
}
