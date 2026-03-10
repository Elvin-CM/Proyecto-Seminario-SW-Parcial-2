"use client";

import { Toaster as HotToaster } from "react-hot-toast";

export function Toaster() {
  return (
    <HotToaster
      position="bottom-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "hsl(0 0% 100%)",
          color: "hsl(222.2 84% 4.9%)",
          border: "1px solid hsl(214.3 31.8% 91.4%)",
          borderRadius: "0.5rem",
          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
        },
        success: {
          iconTheme: {
            primary: "#22c55e",
            secondary: "white",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "white",
          },
        },
      }}
    />
  );
}
