import { useEffect, useRef, useState } from "react";
import { InfoIcon } from "./icons";
export function Notice({ text }: { text: string }) {
  const [shown, setShown] = useState(text),
    node = useRef<HTMLDivElement>(null),
    animation = useRef<Animation | null>(null);
  useEffect(() => {
    if (text) {
      setShown(text);
      return;
    }
    const el = node.current;
    if (!el) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    animation.current?.cancel();
    animation.current = el.animate(
      [
        { opacity: 1, translate: "-50% 0" },
        { opacity: 0, translate: reduced ? "-50% 0" : "-50% 8px" },
      ],
      {
        duration: reduced ? 100 : 140,
        easing: "cubic-bezier(.23,1,.32,1)",
        fill: "forwards",
      },
    );
    animation.current.finished.then(() => setShown("")).catch(() => {});
    return () => animation.current?.cancel();
  }, [text]);
  useEffect(() => {
    if (!shown || !text || !node.current) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    animation.current?.cancel();
    animation.current = node.current.animate(
      [
        { opacity: 0, translate: reduced ? "-50% 0" : "-50% 8px" },
        { opacity: 1, translate: "-50% 0" },
      ],
      { duration: reduced ? 100 : 180, easing: "cubic-bezier(.23,1,.32,1)" },
    );
    return () => animation.current?.cancel();
  }, [shown, text]);
  return shown ? (
    <div ref={node} className="toast" role="status">
      <InfoIcon size={18} aria-hidden="true" />
      <span>{shown}</span>
    </div>
  ) : null;
}
