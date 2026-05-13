"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Check, Palette } from "lucide-react";
import { MaterialSectionHeader } from "@/app/components/material/primitives";
import {
  isMaterialThemeId,
  materialThemeChangeEvent,
  materialThemePresets,
  materialThemeStorageKey,
  type MaterialThemeId,
} from "@/app/components/material/theme-colors";
import { applyMaterialTheme } from "@/app/components/material/theme-provider";
import {
  expressiveItem,
  expressiveListItem,
  materialDefaultSpatial,
  materialFastSpatial,
  materialPress,
  materialRowHover,
  materialSpring,
} from "@/app/components/material/motion";
import { cn } from "@/lib/utils";

export function ThemeColorSettings() {
  const selectedThemeId = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  function selectTheme(themeId: MaterialThemeId) {
    applyMaterialTheme(themeId);
  }

  const selectedTheme =
    materialThemePresets.find((theme) => theme.id === selectedThemeId) ??
    materialThemePresets[0];

  return (
    <motion.section layout variants={expressiveItem}>
      <MaterialSectionHeader
        className="mb-5"
        description="Choose a prepared Material color scheme. Each option updates primary, secondary, tertiary, surface, container, and outline roles together."
        icon={<Palette className="size-6" aria-hidden="true" />}
        title="Expressive color"
      />

      <LayoutGroup id="material-theme-colors">
      <div className="grid gap-6 border-y border-outline-variant py-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-2">
          {materialThemePresets.map((theme) => {
            const isSelected = theme.id === selectedThemeId;

            return (
              <motion.button
                key={theme.id}
                type="button"
                aria-pressed={isSelected}
                layout
                variants={expressiveListItem}
                whileHover={materialRowHover}
                whileTap={materialPress}
                onClick={() => selectTheme(theme.id)}
                className={cn(
                  "md-state-layer md-expressive-surface relative grid w-full gap-4 overflow-hidden px-4 py-4 text-left transition-colors sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center",
                  isSelected
                    ? "text-on-primary-container"
                    : "bg-surface-container-low text-on-surface",
                )}
              >
                {isSelected ? (
                  <motion.span
                    className="absolute inset-0 rounded-[inherit] bg-primary-container"
                    layoutId="theme-selected-container"
                    transition={materialDefaultSpatial}
                  />
                ) : null}

                <span className="relative z-10 min-w-0">
                  <span className="block md-title-small md-emphasized">
                    {theme.name}
                  </span>
                  <span className="mt-1 block md-body-small opacity-80">
                    {theme.description}
                  </span>
                </span>

                <span className="relative z-10 flex items-center gap-3">
                  <RoleSwatches roles={theme.roles} />
                  <AnimatePresence initial={false}>
                    {isSelected ? (
                      <motion.span
                        className="grid size-9 place-items-center rounded-full bg-primary text-on-primary"
                        initial={{ scale: 0.72, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.72, opacity: 0 }}
                        layoutId="theme-selected-check"
                        transition={materialFastSpatial}
                      >
                        <Check className="size-5" aria-hidden="true" />
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="min-w-0">
          <p className="mb-3 md-label-large md-emphasized text-on-surface">
            Role preview
          </p>
          <motion.div
            key={selectedTheme.id}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="md-expressive-surface overflow-hidden rounded-[var(--md-sys-shape-corner-extra-large)] bg-surface-container-low"
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={materialSpring}
          >
            <motion.div
              animate={{ backgroundColor: selectedTheme.roles.primary }}
              className="h-20"
              style={{
                background: selectedTheme.roles.primary,
              }}
              transition={materialDefaultSpatial}
            />
            <div className="grid grid-cols-3">
              <RoleBlock label="Primary" value={selectedTheme.roles.primary} />
              <RoleBlock
                label="Secondary"
                value={selectedTheme.roles.secondary}
              />
              <RoleBlock label="Tertiary" value={selectedTheme.roles.tertiary} />
            </div>
          </motion.div>
          <p className="mt-3 md-body-small text-on-surface-variant">
            Seed {selectedTheme.seed}. Containers and surface tint are mapped in
            CSS variables for the whole app.
          </p>
        </div>
      </div>
      </LayoutGroup>
    </motion.section>
  );
}

function subscribeToTheme(onStoreChange: () => void) {
  window.addEventListener(materialThemeChangeEvent, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(materialThemeChangeEvent, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getThemeSnapshot(): MaterialThemeId {
  const activeTheme = document.documentElement.dataset.materialTheme;
  if (activeTheme && isMaterialThemeId(activeTheme)) {
    return activeTheme;
  }

  const stored = window.localStorage.getItem(materialThemeStorageKey);
  return stored && isMaterialThemeId(stored) ? stored : "relay";
}

function getServerThemeSnapshot(): MaterialThemeId {
  return "relay";
}

function RoleSwatches({
  roles,
}: {
  roles: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
}) {
  return (
    <span className="flex -space-x-2">
      <span
        className="size-8 rounded-full ring-2 ring-surface-container-low"
        style={{ background: roles.primary }}
      />
      <span
        className="size-8 rounded-full ring-2 ring-surface-container-low"
        style={{ background: roles.secondary }}
      />
      <span
        className="size-8 rounded-full ring-2 ring-surface-container-low"
        style={{ background: roles.tertiary }}
      />
    </span>
  );
}

function RoleBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-outline-variant px-3 py-3 last:border-r-0">
      <span
        className="mb-2 block h-8 rounded-full"
        style={{ background: value }}
      />
      <p className="md-label-medium text-on-surface-variant">{label}</p>
    </div>
  );
}
