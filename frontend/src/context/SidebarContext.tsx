import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface SidebarContextType {
  isOpen: boolean;
  isPinned: boolean;
  isMobile: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  togglePin: () => void;
  setPinned: (pinned: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 1024;
    }
    return false;
  });

  const [isPinned, setIsPinnedState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hse_sidebar_pinned");
      if (saved !== null) return saved === "true";
      return window.innerWidth >= 1024;
    }
    return true;
  });

  const [isOpen, setIsOpenState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hse_sidebar_open");
      if (saved !== null) return saved === "true";
      return window.innerWidth >= 1024;
    }
    return true;
  });

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsPinnedState(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Listen to keyboard shortcut: Ctrl+B or Cmd+B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsOpenState((prev) => {
          const next = !prev;
          localStorage.setItem("hse_sidebar_open", String(next));
          return next;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsOpenState((prev) => {
      const next = !prev;
      localStorage.setItem("hse_sidebar_open", String(next));
      return next;
    });
  }, []);

  const openSidebar = useCallback(() => {
    setIsOpenState(true);
    localStorage.setItem("hse_sidebar_open", "true");
  }, []);

  const closeSidebar = useCallback(() => {
    setIsOpenState(false);
    localStorage.setItem("hse_sidebar_open", "false");
  }, []);

  const togglePin = useCallback(() => {
    setIsPinnedState((prev) => {
      const next = !prev;
      localStorage.setItem("hse_sidebar_pinned", String(next));
      if (next) {
        setIsOpenState(true);
        localStorage.setItem("hse_sidebar_open", "true");
      }
      return next;
    });
  }, []);

  const setPinned = useCallback((pinned: boolean) => {
    setIsPinnedState(pinned);
    localStorage.setItem("hse_sidebar_pinned", String(pinned));
    if (pinned) {
      setIsOpenState(true);
      localStorage.setItem("hse_sidebar_open", "true");
    }
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        isPinned: !isMobile && isPinned,
        isMobile,
        toggleSidebar,
        openSidebar,
        closeSidebar,
        togglePin,
        setPinned,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
