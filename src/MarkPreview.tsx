import { useLayoutEffect, useRef, useState } from "react";
import { MarkView } from "./MarkView";
import { type Mark } from "./types";
import { MapPinIcon, PenNibIcon } from "./icons";
export function MarkPreview({ mark }: { mark: Mark }) {
  const stage = useRef<HTMLDivElement>(null),
    art = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const empty = mark.kind === "text" ? !mark.text.trim() : !mark.strokes.length;
  useLayoutEffect(() => {
    const measure = () => {
      const el = art.current?.querySelector<HTMLElement>(".mark");
      if (!el || !stage.current) return;
      const a = (mark.rotation * Math.PI) / 180,
        w = el.offsetWidth,
        h = el.offsetHeight;
      const rw = Math.abs(w * Math.cos(a)) + Math.abs(h * Math.sin(a)),
        rh = Math.abs(h * Math.cos(a)) + Math.abs(w * Math.sin(a));
      setScale(
        Math.min(
          1,
          (stage.current.clientWidth - 36) / rw,
          (stage.current.clientHeight - 30) / rh,
        ),
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (stage.current) observer.observe(stage.current);
    const el = art.current?.querySelector(".mark");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [mark]);
  return (
    <section className="mark-preview" aria-label="Your mark preview">
      <div className="preview-heading">
        <span>Preview</span>
        <span>
          <MapPinIcon size={14} aria-hidden="true" />
          Your spot is saved
        </span>
      </div>
      <div className="preview-stage" ref={stage}>
        {empty ? (
          <div className="preview-empty">
            <PenNibIcon size={28} weight="light" aria-hidden="true" />
            <p>
              {mark.kind === "text"
                ? "Your words go here."
                : "Your drawing goes here."}
            </p>
          </div>
        ) : (
          <div
            className="preview-canvas"
            ref={art}
            style={{ transform: `translate(-50%,-50%) scale(${scale})` }}
          >
            <MarkView m={{ ...mark, x: 140, y: 70 }} />
          </div>
        )}
      </div>
      <p className="preview-note">
        {empty
          ? "A thought, a doodle, a little hello."
          : "Just as it will appear on the wall."}
      </p>
    </section>
  );
}
