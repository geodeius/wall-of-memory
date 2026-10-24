import { useLayoutEffect, useRef, type RefObject } from "react";
const ease = "cubic-bezier(.23,1,.32,1)";
export function useModal(
  onClose: () => void,
  initialFocus?: RefObject<HTMLElement | null>,
) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef(
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );
  const animation = useRef<Animation | null>(null),
    closing = useRef(false),
    mounted = useRef(true);
  useLayoutEffect(() => {
    const el = dialog.current!;
    mounted.current = true;
    el.showModal();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const keyboard = opener.current?.matches(":focus-visible");
    if (!keyboard)
      animation.current = el.animate(
        reduced
          ? [{ opacity: 0 }, { opacity: 1 }]
          : [
              { opacity: 0, transform: "translateY(16px) scale(.985)" },
              { opacity: 1, transform: "translateY(0) scale(1)" },
            ],
        { duration: reduced ? 120 : 220, easing: ease },
      );
    const first =
      initialFocus?.current ||
      el.querySelector<HTMLElement>('.tabs [aria-pressed="true"]');
    first?.focus({ preventScroll: true });
    const resize = () => {
      const v = window.visualViewport;
      el.style.setProperty(
        "--available-height",
        `${v?.height ?? innerHeight}px`,
      );
      el.style.setProperty("--viewport-top", `${v?.offsetTop ?? 0}px`);
      el.style.setProperty(
        "--viewport-bottom",
        `${Math.max(0, innerHeight - (v?.height ?? innerHeight) - (v?.offsetTop ?? 0))}px`,
      );
    };
    resize();
    window.visualViewport?.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("scroll", resize);
    window.addEventListener("resize", resize);
    return () => {
      mounted.current = false;
      animation.current?.cancel();
      el.close();
      window.visualViewport?.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("scroll", resize);
      window.removeEventListener("resize", resize);
      requestAnimationFrame(() => {
        const target = opener.current?.isConnected
          ? opener.current
          : document.querySelector<HTMLElement>(".add-mark");
        target?.focus({ preventScroll: true });
      });
    };
  }, []);
  function close(immediate = false) {
    if (closing.current) return;
    closing.current = true;
    if (immediate) {
      onClose();
      return;
    }
    const el = dialog.current!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const current = getComputedStyle(el);
    const from = {
      opacity: current.opacity,
      transform:
        current.transform === "none"
          ? "translateY(0) scale(1)"
          : current.transform,
    };
    animation.current?.cancel();
    el.dataset.closing = "true";
    animation.current = el.animate(
      [
        from,
        reduced
          ? { opacity: 0, transform: from.transform }
          : { opacity: 0, transform: "translateY(16px) scale(.985)" },
      ],
      { duration: reduced ? 100 : 160, easing: ease, fill: "forwards" },
    );
    animation.current.finished
      .then(() => {
        if (mounted.current) onClose();
      })
      .catch(() => {});
  }
  return { dialog, close };
}
