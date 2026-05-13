export const materialThemeStorageKey = "quotahubrelay:material-theme";
export const materialThemeCookieName = "quotahubrelay_material_theme";
export const materialThemeChangeEvent = "quotahubrelay:material-theme-change";

export type MaterialThemeId = "relay" | "lagoon" | "sage" | "ember" | "mono";

export type MaterialThemePreset = {
  id: MaterialThemeId;
  name: string;
  seed: string;
  description: string;
  roles: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
};

export const materialThemePresets: MaterialThemePreset[] = [
  {
    id: "relay",
    name: "Material Baseline",
    seed: "#6750A4",
    description: "Baseline purple with neutral secondary and rose tertiary.",
    roles: {
      primary: "#6750A4",
      secondary: "#625B71",
      tertiary: "#7D5260",
    },
  },
  {
    id: "lagoon",
    name: "Ocean",
    seed: "#006a6a",
    description: "Teal primary with blue tertiary depth.",
    roles: {
      primary: "#006A6A",
      secondary: "#4A6363",
      tertiary: "#4B607C",
    },
  },
  {
    id: "sage",
    name: "Forest",
    seed: "#4f6f32",
    description: "Green primary with restrained blue-green support.",
    roles: {
      primary: "#386A20",
      secondary: "#55624C",
      tertiary: "#386666",
    },
  },
  {
    id: "ember",
    name: "Clay",
    seed: "#b3532c",
    description: "Warm primary with olive tertiary balance.",
    roles: {
      primary: "#8C4A00",
      secondary: "#745944",
      tertiary: "#596313",
    },
  },
  {
    id: "mono",
    name: "White / Gray / Black",
    seed: "#1d1b20",
    description: "Monochrome Material roles for white, gray, and black UI.",
    roles: {
      primary: "#1D1B20",
      secondary: "#5F5E62",
      tertiary: "#78767A",
    },
  },
];

export function isMaterialThemeId(value: string): value is MaterialThemeId {
  return materialThemePresets.some((theme) => theme.id === value);
}
