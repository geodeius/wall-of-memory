import { useEffect, useRef, useState } from "react";
import {
  XIcon,
  ArrowUUpLeftIcon,
  ArrowUUpRightIcon,
  TrashIcon,
  PaperPlaneTiltIcon,
  CaretDownIcon,
  SlidersHorizontalIcon,
  CheckIcon,
} from "./icons";
import { palette, path, type Mark, type Stroke } from "./types";
import { readDraft } from "./draft";
import { useModal } from "./useModal";
import { MarkPreview } from "./MarkPreview";
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
  const message = useRef<HTMLTextAreaElement>(null),
    active = useRef(false);
  const [draft, setDraft] = useState<Mark>(() => {
    let raw = null;
    try {
      raw = localStorage.getItem("wall-draft");
    } catch {}
    return readDraft(position, raw);
  });
  const current = useRef(draft);
  current.current = draft;
  const [past, setPast] = useState<Stroke[][]>([]),
    [future, setFuture] = useState<Stroke[][]>([]);
  const [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [keyboardMode, setKeyboardMode] = useState(false);
  const { dialog, close } = useModal(onClose, message);
  function update(change: Partial<Mark> | ((m: Mark) => Partial<Mark>)) {
    setDraft((m) => {
      const next = {
        ...m,
        ...(typeof change === "function" ? change(m) : change),
      };
      current.current = next;
      return next;
    });
  }
  useEffect(() => {
    try {
      localStorage.setItem("wall-draft", JSON.stringify(draft));
    } catch {}
    onPreview(draft);
  }, [draft]);
  useEffect(() => () => onPreview(null), []);
  const selectedColor =
    palette.find(([, color]) => color === draft.color)?.[0] || "Violet";
  function point(e: React.PointerEvent<SVGSVGElement>) {
    const b = e.currentTarget.getBoundingClientRect();
    return [
      Math.max(0, Math.min(280, ((e.clientX - b.left) * 280) / b.width)),
      Math.max(0, Math.min(140, ((e.clientY - b.top) * 140) / b.height)),
    ];
  }
  function snapshot() {
    setPast((p) => [...p.slice(-19), current.current.strokes]);
    setFuture([]);
  }
  function undo() {
    if (!past.length) return;
    setFuture((f) => [...f, current.current.strokes]);
    update({ strokes: past.at(-1)! });
    setPast((p) => p.slice(0, -1));
  }
  function redo() {
    if (!future.length) return;
    setPast((p) => [...p, current.current.strokes]);
    update({ strokes: future.at(-1)! });
    setFuture((f) => f.slice(0, -1));
  }
  return (
    <dialog
      className="editor-dialog"
      ref={dialog}
      aria-labelledby="editor-title"
      aria-describedby="editor-description"
      onCancel={(e) => {
        e.preventDefault();
        close(true);
      }}
    >
      <form
        className="editor-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (saving) return;
          setSaving(true);
          setError("");
          try {
            await onPublish(current.current);
            try {
              localStorage.removeItem("wall-draft");
            } catch {}
            close(document.activeElement?.matches(":focus-visible") ?? false);
          } catch (e) {
            setError((e as Error).message);
            setSaving(false);
          }
        }}
      >
        <div className="dialog-head editor-heading">
          <div>
            <h2 id="editor-title">Make your mark.</h2>
            <p id="editor-description">A little piece of you, for everyone.</p>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Close editor"
            onClick={(e) => close(e.detail === 0)}
          >
            <XIcon size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="editor-body">
          <section
            className="compose-section"
            aria-label="Create your contribution"
          >
            <div
              className="tabs"
              data-mode={draft.kind}
              role="group"
              aria-label="Contribution type"
            >
              <button
                type="button"
                aria-pressed={draft.kind === "text"}
                onClick={(e) => {
                  setKeyboardMode(e.detail === 0);
                  update((m) => ({
                    kind: "text",
                    size: Math.max(24, Math.min(60, m.size)),
                  }));
                }}
              >
                Write something
              </button>
              <button
                type="button"
                aria-pressed={draft.kind === "drawing"}
                onClick={(e) => {
                  setKeyboardMode(e.detail === 0);
                  update({ kind: "drawing" });
                }}
              >
                Draw / sign
              </button>
            </div>
            <div
              className="mode-content"
              key={draft.kind}
              data-keyboard={keyboardMode}
            >
              {draft.kind === "text" ? (
                <div className="field">
                  <label htmlFor="message">
                    Your message <small>{draft.text.length}/120</small>
                  </label>
                  <textarea
                    ref={message}
                    id="message"
                    placeholder="A thought, a wish, a little hello…"
                    maxLength={120}
                    required
                    value={draft.text}
                    onChange={(e) => update({ text: e.target.value })}
                  />
                  <p className="field-note">No perfect words required.</p>
                </div>
              ) : (
                <>
                  <div className="field">
                    <label id="drawing-label">Draw something that’s you</label>
                    <svg
                      className="drawing-pad"
                      viewBox="0 0 280 140"
                      role="img"
                      aria-label="Drawing pad"
                      aria-describedby="drawing-help"
                      onPointerDown={(e) => {
                        if (
                          e.button !== 0 ||
                          current.current.strokes.length >= 60
                        )
                          return;
                        e.currentTarget.setPointerCapture(e.pointerId);
                        active.current = true;
                        snapshot();
                        const p = point(e);
                        update((m) => ({
                          strokes: [
                            ...m.strokes,
                            { points: [p], color: m.color, width: m.size / 12 },
                          ],
                        }));
                      }}
                      onPointerMove={(e) => {
                        if (!active.current) return;
                        const p = point(e);
                        update((m) => {
                          const strokes = [...m.strokes],
                            last = strokes.at(-1);
                          if (!last || last.points.length >= 400) return {};
                          strokes[strokes.length - 1] = {
                            ...last,
                            points: [...last.points, p],
                          };
                          return { strokes };
                        });
                      }}
                      onPointerUp={() => (active.current = false)}
                      onPointerCancel={() => (active.current = false)}
                    >
                      {draft.strokes.map((s, i) => (
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
                  </div>
                  <div
                    className="draw-actions"
                    role="group"
                    aria-label="Drawing actions"
                  >
                    <button
                      type="button"
                      disabled={!past.length}
                      onClick={undo}
                    >
                      <ArrowUUpLeftIcon size={17} aria-hidden="true" />
                      Undo
                    </button>
                    <button
                      type="button"
                      disabled={!future.length}
                      onClick={redo}
                    >
                      <ArrowUUpRightIcon size={17} aria-hidden="true" />
                      Redo
                    </button>
                    <button
                      type="button"
                      disabled={!draft.strokes.length}
                      onClick={() => {
                        snapshot();
                        update({ strokes: [] });
                      }}
                    >
                      <TrashIcon size={17} aria-hidden="true" />
                      Clear
                    </button>
                  </div>
                  <p className="field-note" id="drawing-help">
                    Mouse, touch, or pen. Prefer words? Choose Write something.
                  </p>
                </>
              )}
            </div>
          </section>
          <MarkPreview mark={draft} />
          <section className="ink-section" aria-label="Ink and styling">
            <div className="ink-heading">
              <h3>Ink color</h3>
              <span>{selectedColor}</span>
            </div>
            <div className="palette" role="group" aria-label="Ink color">
              {palette.map(([name, color]) => (
                <button
                  type="button"
                  key={color}
                  title={name}
                  aria-label={`${name} ink`}
                  aria-pressed={draft.color === color}
                  style={{ "--ink": color } as React.CSSProperties}
                  onClick={() => update({ color })}
                >
                  {draft.color === color && (
                    <CheckIcon size={16} weight="bold" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
            <details className="style-details">
              <summary>
                <SlidersHorizontalIcon size={18} aria-hidden="true" />
                Style your mark
                <CaretDownIcon
                  className="disclosure-caret"
                  size={16}
                  aria-hidden="true"
                />
              </summary>
              <div className="style-content">
                <div className="editor-grid">
                  {draft.kind === "text" ? (
                    <label className="field">
                      Lettering
                      <select
                        value={draft.font}
                        onChange={(e) => update({ font: e.target.value })}
                      >
                        <option value="hand">Handwritten</option>
                        <option value="print">Simple print</option>
                        <option value="serif">Bookish</option>
                      </select>
                    </label>
                  ) : (
                    <label className="field">
                      Stroke width · {(draft.size / 12).toFixed(1)}
                      <input
                        aria-label="Stroke width"
                        type="range"
                        min="12"
                        max="72"
                        value={draft.size}
                        onChange={(e) => update({ size: +e.target.value })}
                      />
                    </label>
                  )}
                  <label className="field">
                    Tilt · {draft.rotation}°
                    <input
                      type="range"
                      min="-15"
                      max="15"
                      value={draft.rotation}
                      onChange={(e) => update({ rotation: +e.target.value })}
                    />
                  </label>
                </div>
                {draft.kind === "text" && (
                  <label className="field">
                    Letter size · {draft.size}px
                    <input
                      type="range"
                      min="24"
                      max="60"
                      value={draft.size}
                      onChange={(e) => update({ size: +e.target.value })}
                    />
                  </label>
                )}
                <label className="field" htmlFor="name">
                  Your name <span className="muted">(if you like)</span>
                  <input
                    id="name"
                    maxLength={30}
                    placeholder="Anonymous is lovely, too"
                    value={draft.name}
                    onChange={(e) => update({ name: e.target.value })}
                  />
                </label>
              </div>
            </details>
          </section>
        </div>
        <div className="editor-footer">
          <div className="editor-reassurance">
            {error ? (
              <p role="alert" className="error">
                {error} Your draft is safe. Try publishing again.
              </p>
            ) : (
              <>
                <p>Good things belong here.</p>
                <span>
                  Keep it kind. No hate, spam, or personal information.
                </span>
              </>
            )}
          </div>
          <button
            className="primary publish"
            disabled={
              saving ||
              (draft.kind === "text"
                ? !draft.text.trim()
                : !draft.strokes.length)
            }
          >
            <PaperPlaneTiltIcon size={18} aria-hidden="true" />
            <span>{saving ? "Publishing…" : "Publish your mark"}</span>
          </button>
        </div>
      </form>
    </dialog>
  );
}
