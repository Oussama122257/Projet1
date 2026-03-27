import { create } from "zustand";

interface ThemeStore {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  darkMode: false,
  toggleDarkMode: () =>
    set((state) => {
      const newValue = !state.darkMode;
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", newValue);
        localStorage.setItem("theme", newValue ? "dark" : "light");
      }
      return { darkMode: newValue };
    }),
  setDarkMode: (value) => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", value);
      localStorage.setItem("theme", value ? "dark" : "light");
    }
    set({ darkMode: value });
  },
}));
