import { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  fullWidth?: boolean;
  compact?: boolean;
}

export default function Input({
  className = "",
  fullWidth,
  compact,
  ...props
}: Props) {
  return (
    <input
      {...props}
      className={`rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
        fullWidth ? "w-full" : ""
      } ${compact ? "!py-1" : ""} ${className}`}
    />
  );
}
