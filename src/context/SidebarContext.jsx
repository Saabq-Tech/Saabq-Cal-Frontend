import { createContext, useContext, useState, useEffect, useCallback } from "react";

const SidebarContext = createContext({
  isSidebarCollapsed: false,
  toggleSidebar: () => {},
  setSidebarCollapsed: () => {},
});

export function SidebarProvider({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("saabq_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("saabq_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const setSidebarCollapsed = useCallback((val) => {
    const bool = Boolean(val);
    setIsSidebarCollapsed(bool);
    try {
      localStorage.setItem("saabq_sidebar_collapsed", String(bool));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "saabq_sidebar_collapsed") {
        setIsSidebarCollapsed(e.newValue === "true");
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isSidebarCollapsed,
        toggleSidebar,
        setSidebarCollapsed,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
