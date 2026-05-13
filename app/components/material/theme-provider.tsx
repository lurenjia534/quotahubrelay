"use client";

import { useEffect } from "react";
import {
  isMaterialThemeId,
  materialThemeCookieName,
  materialThemeChangeEvent,
  materialThemeStorageKey,
  type MaterialThemeId,
} from "@/app/components/material/theme-colors";

export function applyMaterialTheme(themeId: MaterialThemeId) {
  document.documentElement.dataset.materialTheme = themeId;
  window.localStorage.setItem(materialThemeStorageKey, themeId);
  document.cookie = `${materialThemeCookieName}=${themeId}; Path=/; Max-Age=31536000; SameSite=Lax`;
  window.dispatchEvent(new Event(materialThemeChangeEvent));
}

export function MaterialThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme: MaterialThemeId;
}) {
  useEffect(() => {
    const stored = window.localStorage.getItem(materialThemeStorageKey);
    const themeId = stored && isMaterialThemeId(stored) ? stored : initialTheme;
    applyMaterialTheme(themeId);
  }, [initialTheme]);

  return children;
}
