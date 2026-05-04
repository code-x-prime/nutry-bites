"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const Input = forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-2xl border border-nyxis-gray-100 bg-white px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-nyxis-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F6F78]/20 focus-visible:border-[#1F6F78] disabled:cursor-not-allowed disabled:opacity-50 transition-all",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
