export default function IconBtn({
  children,
  className = "",
  disabled,
  ...props
}) {
  return (
    <button
      disabled={disabled}
      {...props}
      className={`h-8 w-8 grid place-items-center rounded-md shadow-sm transition active:scale-95 ${
        disabled ? "cursor-not-allowed opacity-60" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}
