"use client";
import { useEffect } from "react";

export function useTabWake(onWake: () => void) {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        onWake();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [onWake]);
}

