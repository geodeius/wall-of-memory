import { memo } from "react";
import { type Mark, path } from "./types";
export const MarkView = memo(({ m }: { m: Mark }) => (
  <div
    className="mark"
    style={{
      left: m.x,
      top: m.y,
      width: m.width,
      minHeight: m.height,
      color: m.color,
      transform: `translate(-50%,-50%) rotate(${m.rotation}deg)`,
      fontSize: m.size,
      fontFamily:
        m.font === "print"
          ? "DM Sans"
          : m.font === "serif"
            ? "Georgia"
            : "Caveat",
    }}
  >
    {m.kind === "text" ? (
      <>
        {m.text}
        {m.name && <small>— {m.name}</small>}
      </>
    ) : (
      <>
        <svg
          viewBox="0 0 280 140"
          aria-label={m.name ? `Drawing by ${m.name}` : "Visitor drawing"}
        >
          {m.strokes.map((s, i) => (
            <path
              key={i}
              d={path(s.points)}
              stroke={s.color}
              strokeWidth={s.width}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>
        {m.name && <small>— {m.name}</small>}
      </>
    )}
  </div>
));
