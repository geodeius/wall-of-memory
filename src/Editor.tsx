import { useEffect, useRef, useState } from "react";
import { MarkView } from "./MarkView";
import { X, Undo2, Redo2, Trash2, Send } from "lucide-react";
import { palette, path, type Mark, type Stroke } from "./types";
export function Editor({
  position,
  onClose,
  onPublish,
  onPreview,
}: {
  position: { x: number; y: number };
  onClose: () => void;
  onPublish: (m: Mark) => Promise<void>;
  onPreview: (m: Mark | null) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const active = useRef(false);
  const [draft, setDraft] = useState<Mark>(() => {
    const initial: Mark = {
      id: crypto.randomUUID(),
      kind: "text",
      ...position,
      width: 280,
      height: 140,
      rotation: -4,
      text: "",
      name: "",
      color: palette[0][1],
      font: "hand",
      size: 36,
      strokes: [],
    };
    try {
      const saved = JSON.parse(localStorage.getItem("wall-draft") || "null");
      return saved?.kind ? { ...initial, ...saved, ...position } : initial;
    } catch {
      return initial;
    }
  });
  const [redo, setRedo] = useState<Stroke[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const m = draft;
  function update(v: Partial<Mark>) {
    setDraft({ ...m, ...v });
  }
  useEffect(() => {
    dialog.current?.showModal();
    return () => onPreview(null);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("wall-draft", JSON.stringify(m));
    } catch {}
    onPreview(m);
  }, [draft]);
  function point(e: React.PointerEvent<SVGSVGElement>) {
    const b = e.currentTarget.getBoundingClientRect();
    return [
      Math.max(0, Math.min(280, ((e.clientX - b.left) * 280) / b.width)),
      Math.max(0, Math.min(140, ((e.clientY - b.top) * 140) / b.height)),
    ];
  }
  return (
    <dialog
      ref={dialog}
      aria-labelledby="editor-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (saving) return;
          setSaving(true);
          setError("");
          try {
            await onPublish(m);
            try {
              localStorage.removeItem("wall-draft");
            } catch {}
            onClose();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="dialog-head">
          <div>
            <span className="eyebrow">A little piece of you</span>
            <h2 id="editor-title">Make your mark.</h2>
          </div>
          <button type="button" aria-label="Close editor" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="tabs">
          <button
            type="button"
            aria-pressed={m.kind === "text"}
            onClick={() => update({ kind: "text" })}
          >
            Write something
          </button>
          <button
            type="button"
            aria-pressed={m.kind === "drawing"}
            onClick={() => update({ kind: "drawing" })}
          >
            Draw / sign
          </button>
        </div>
        {m.kind === "text" ? (
          <>
            <label htmlFor="message">
              Your message <small>{m.text.length}/120</small>
            </label>
            <textarea
              id="message"
              autoFocus
              placeholder="A thought, a wish, a little hello…"
              maxLength={120}
              required
              value={m.text}
              onChange={(e) => update({ text: e.target.value })}
            />
          </>
        ) : (
          <>
            <label>Make yourself at home</label>
            <svg
              className="drawing-pad"
              viewBox="0 0 280 140"
              aria-label="Drawing pad"
              onPointerDown={(e) => {
                if (m.strokes.length >= 60) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                active.current = true;
                setRedo([]);
                update({
                  strokes: [
                    ...m.strokes,
                    { points: [point(e)], color: m.color, width: m.size / 12 },
                  ],
                });
              }}
              onPointerMove={(e) => {
                if (!active.current) return;
                const strokes = [...m.strokes],
                  last = strokes.at(-1)!;
                if (last.points.length < 400)
                  strokes[strokes.length - 1] = {
                    ...last,
                    points: [...last.points, point(e)],
                  };
                update({ strokes });
              }}
              onPointerUp={() => (active.current = false)}
              onPointerCancel={() => (active.current = false)}
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
            <div className="draw-actions">
              <button
                type="button"
                disabled={!m.strokes.length}
                onClick={() => {
                  setRedo([...redo, m.strokes.at(-1)!]);
                  update({ strokes: m.strokes.slice(0, -1) });
                }}
              >
                <Undo2 size={15} /> Undo
              </button>
              <button
                type="button"
                disabled={!redo.length}
                onClick={() => {
                  update({ strokes: [...m.strokes, redo.at(-1)!] });
                  setRedo(redo.slice(0, -1));
                }}
              >
                <Redo2 size={15} /> Redo
              </button>
              <button
                type="button"
                onClick={() => {
                  update({ strokes: [] });
                  setRedo([]);
                }}
              >
                <Trash2 size={15} /> Clear
              </button>
            </div>
          </>
        )}
        <label>Ink color</label>
        <div className="palette">
          {palette.map(([name, color]) => (
            <button
              type="button"
              key={color}
              title={name}
              aria-label={name + " ink"}
              aria-pressed={m.color === color}
              style={{ background: color }}
              onClick={() => update({ color })}
            />
          ))}
        </div>
        <div className="editor-grid">
          <label>
            {m.kind === "text" ? "Lettering" : "Stroke width"}
            {m.kind === "text" ? (
              <select
                value={m.font}
                onChange={(e) => update({ font: e.target.value })}
              >
                <option value="hand">Handwritten</option>
                <option value="print">Simple print</option>
                <option value="serif">Bookish</option>
              </select>
            ) : (
              <input
                aria-label="Stroke width"
                type="range"
                min="12"
                max="72"
                value={m.size}
                onChange={(e) => update({ size: +e.target.value })}
              />
            )}
          </label>
          <label>
            Tilt · {m.rotation}°
            <input
              type="range"
              min="-15"
              max="15"
              value={m.rotation}
              onChange={(e) => update({ rotation: +e.target.value })}
            />
          </label>
        </div>
        {m.kind === "text" && (
          <label>
            Letter size · {m.size}px
            <input
              type="range"
              min="24"
              max="60"
              value={m.size}
              onChange={(e) => update({ size: +e.target.value })}
            />
          </label>
        )}
        <label htmlFor="name">
          Your name <span className="muted">(if you like)</span>
        </label>
        <input
          id="name"
          maxLength={30}
          placeholder="Anonymous is lovely, too"
          value={m.name}
          onChange={(e) => update({ name: e.target.value })}
        />
        {m.kind === "text" && m.text && (
          <div className="inline-preview" aria-label="Your mark preview">
            <MarkView m={{ ...m, x: 140, y: 65 }} />
          </div>
        )}
        <p className="form-note">
          Your preview is placed on the wall behind this window. Keep it kind.
          No hate, spam, or personal information.
        </p>
        {error && (
          <p role="alert" className="error">
            {error} Your draft is safe. Try publishing again.
          </p>
        )}
        <button
          className="primary publish"
          disabled={
            saving || (m.kind === "text" ? !m.text.trim() : !m.strokes.length)
          }
        >
          <Send size={17} />
          {saving ? "Publishing…" : "Publish your mark"}
        </button>
      </form>
    </dialog>
  );
}
