import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-sm",
          {
            "bg-blue-500/90 backdrop-blur-sm text-white hover:bg-blue-600/90 hover:shadow-md": variant === "default",
            "bg-red-500/90 backdrop-blur-sm text-white hover:bg-red-600/90 hover:shadow-md": variant === "destructive",
            "border border-gray-300/50 bg-white/50 backdrop-blur-sm text-gray-900 hover:bg-gray-100/70 dark:border-gray-600/50 dark:bg-gray-700/50 dark:text-gray-100 dark:hover:bg-gray-700/70": variant === "outline",
            "bg-gray-100/80 backdrop-blur-sm text-gray-900 hover:bg-gray-200/80 dark:bg-gray-700/60 dark:text-gray-100 dark:hover:bg-gray-700/80": variant === "secondary",
            "text-gray-700 hover:bg-gray-100/60 dark:text-gray-300 dark:hover:bg-gray-700/40": variant === "ghost",
            "text-blue-500 underline-offset-4 hover:underline dark:text-blue-400": variant === "link",
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-xl px-3": size === "sm",
            "h-11 rounded-xl px-8": size === "lg",
            "h-10 w-10 rounded-xl": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
