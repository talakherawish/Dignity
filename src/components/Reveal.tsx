import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Wraps children in a fade-up entrance animation that triggers once the
 * element scrolls into view. Falls back to visible-immediately if
 * IntersectionObserver isn't available (e.g. during SSR).
 */
export function Reveal({
    children,
    delay = 0,
    className = "",
}: {
    children: ReactNode;
    delay?: number;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

  useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (typeof IntersectionObserver === "undefined") {
                setVisible(true);
                return;
        }
        const observer = new IntersectionObserver(
                (entries) => {
                          for (const entry of entries) {
                                      if (entry.isIntersecting) {
                                                    setVisible(true);
                                                    observer.disconnect();
                                      }
                          }
                },
          { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
              );
        observer.observe(el);
        return () => observer.disconnect();
  }, []);

  return (
        <div

                ref={ref}
                className={`transition-all duration-700 ease-out ${
                          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                } ${className}`}
        style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
              >
        
          {children}
            </div>
      );
}
