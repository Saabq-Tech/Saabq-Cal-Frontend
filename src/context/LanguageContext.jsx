import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { translations } from "../translations/translations";
import client from "../api/client";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang] = useState(() => {
    return localStorage.getItem("saabq_lang") || "ar";
  });

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    localStorage.setItem("saabq_lang", lang);
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", dir);
    client.defaults.headers.common["Accept-Language"] = lang;
  }, [lang, dir]);

  const setLanguage = useCallback((newLang) => {
    if (newLang === "ar" || newLang === "en") {
      localStorage.setItem("saabq_lang", newLang);
      window.location.reload();
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    const nextLang = lang === "ar" ? "en" : "ar";
    localStorage.setItem("saabq_lang", nextLang);
    window.location.reload();
  }, [lang]);

  const t = useCallback(
    (key, fallback) => {
      const dict = translations[lang] || translations.ar;
      if (dict && dict[key]) return dict[key];
      if (translations.en && translations.en[key]) return translations.en[key];
      if (fallback !== undefined) return fallback;
      return undefined;
    },
    [lang],
  );

  const value = {
    lang,
    dir,
    isRTL: dir === "rtl",
    setLanguage,
    toggleLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export default LanguageContext;
