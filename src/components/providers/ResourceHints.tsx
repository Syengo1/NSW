
"use client";

import { preconnect } from "react-dom";

export function ResourceHints() {
  preconnect("https://wqrtjgfrjuadksaotbxj.supabase.co", {
    crossOrigin: "anonymous",
  });

  preconnect(
    "https://ewxf0eupwexd82yb.public.blob.vercel-storage.com",
    {
      crossOrigin: "anonymous",
    }
  );

  preconnect("https://framerusercontent.com", {
    crossOrigin: "anonymous",
  });

  return null;
}
