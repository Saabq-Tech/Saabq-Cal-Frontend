import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * ModalPortal renders children into document.body, ensuring the modal
 * is detached from any nested stacking contexts or transformed containers.
 * It also manages locking body scroll while the modal is mounted.
 */
export default function ModalPortal({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}
