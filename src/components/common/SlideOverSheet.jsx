import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { cn } from "../../utils/cn";

/**
 * Viewport-anchored slide-over panel rendered via portal.
 * Prevents sheets from scrolling away when the dashboard main area scrolls.
 */
const SlideOverSheet = ({
  isOpen,
  onClose,
  children,
  maxWidth = "max-w-2xl",
  panelClassName,
  backdropClassName,
  closeOnBackdrop = true,
}) => {
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return ReactDOM.createPortal(
    <>
      <div
        className={cn(
          "fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100] transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
          backdropClassName
        )}
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden={!isOpen}
      />

      <div
        className={cn(
          "fixed top-0 right-0 h-dvh w-full bg-white shadow-2xl z-[110] transform transition-transform duration-300 ease-in-out flex flex-col",
          maxWidth,
          isOpen ? "translate-x-0" : "translate-x-full",
          panelClassName
        )}
        role="dialog"
        aria-modal={isOpen}
      >
        {children}
      </div>
    </>,
    document.body
  );
};

export default SlideOverSheet;
