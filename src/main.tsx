import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Plus,
  Minus,
  Move,
  Home,
  ArrowUpRight,
  List,
  X,
  Heart,
  Paintbrush,
  Flag,
  Trash2,
} from "lucide-react";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/caveat/700.css";
import { Art } from "./Art";
import { Editor } from "./Editor";
import { type Mark, path } from "./types";
import "./style.css";
import { MarkView } from "./MarkView";
import { useCamera } from "./useCamera";
import { useWallData } from "./useWallData";
function App() {
  const { wall, world, cam, camera, move, zoom, pointers, drag } = useCamera();
  const [preview, setPreview] = useState<Mark | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [panel, setPanel] = useState<"list" | "about" | "moderate" | null>(
    null,
  );
  const [notice, setNotice] = useState("");
  const [hidden, setHidden] = useState<string[]>([]);
  const [queue, setQueue] = useState<Mark[]>([]);
  const [modToken, setModToken] = useState("");
  const { marks, status, online, cache, setReload, reload } =
    useWallData(camera);
  function add(sx = innerWidth / 2, sy = innerHeight / 2) {
    const c = cam.current;
    setPosition({
      x: (sx - innerWidth / 2 - c.x) / c.z,
      y: (sy - innerHeight / 2 - c.y) / c.z,
    });
  }
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(t);
  }, [notice]);
  async function action(id: string, kind: string) {
    try {
      const r = await fetch(
        `/api/marks/${id}${kind === "report" ? "/report" : ""}`,
        { method: kind === "report" ? "POST" : "DELETE" },
      );
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      setNotice(
        kind === "report"
          ? "Report received. Thank you for looking out for the wall."
          : "Your mark has been removed.",
      );
      cache.current.clear();
      setReload((n) => n + 1);
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  const visible = marks.filter(
    (m) =>
      !hidden.includes(m.id) &&
      Math.abs(m.x + camera.x / camera.z) < innerWidth / 2 / camera.z + 650 &&
      Math.abs(m.y + camera.y / camera.z) < innerHeight / 2 / camera.z + 650,
  );
  return (
    <>
      <div
        ref={wall}
        className="wall"
        tabIndex={0}
        role="region"
        aria-label="Community wall. Drag or use arrow keys to explore. Enter adds a mark; Home resets the view."
        onKeyDown={(e) => {
          const d = (
            {
              ArrowLeft: [80, 0],
              ArrowRight: [-80, 0],
              ArrowUp: [0, 80],
              ArrowDown: [0, -80],
            } as Record<string, number[]>
          )[e.key];
          if (d) {
            e.preventDefault();
            move({
              ...cam.current,
              x: cam.current.x + d[0],
              y: cam.current.y + d[1],
            });
          }
          if (e.key === "Home") {
            e.preventDefault();
            move({ x: 0, y: 0, z: 1 });
          }
          if (e.key === "Enter") add();
        }}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          if (!pointers.current.size)
            drag.current = { distance: 0, pinched: false };
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pointers.current.size > 1) drag.current.pinched = true;
        }}
        onPointerMove={(e) => {
          const prev = pointers.current.get(e.pointerId);
          if (!prev) return;
          const before = [...pointers.current.values()];
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          const after = [...pointers.current.values()];
          if (after.length === 2) {
            const oldDist = Math.hypot(
              before[0].x - before[1].x,
              before[0].y - before[1].y,
            );
            const dist = Math.hypot(
              after[0].x - after[1].x,
              after[0].y - after[1].y,
            );
            if (oldDist > 0)
              zoom(
                dist / oldDist,
                (after[0].x + after[1].x) / 2,
                (after[0].y + after[1].y) / 2,
              );
          } else {
            const dx = e.clientX - prev.x,
              dy = e.clientY - prev.y;
            drag.current.distance += Math.hypot(dx, dy);
            move({
              ...cam.current,
              x: cam.current.x + dx,
              y: cam.current.y + dy,
            });
          }
        }}
        onPointerUp={(e) => {
          if (!pointers.current.has(e.pointerId)) return;
          pointers.current.delete(e.pointerId);
          if (
            !pointers.current.size &&
            drag.current.distance < 6 &&
            !drag.current.pinched
          )
            add(e.clientX, e.clientY);
        }}
        onPointerCancel={(e) => pointers.current.delete(e.pointerId)}
      >
        <div
          ref={world}
          className="world"
          style={{
            transform: `translate(${innerWidth / 2 + camera.x}px,${innerHeight / 2 + camera.y}px) scale(${camera.z})`,
          }}
        >
          {Math.abs(camera.x / camera.z) < innerWidth / camera.z + 900 &&
            Math.abs(camera.y / camera.z) < innerHeight / camera.z + 900 && (
              <Art />
            )}
          {visible.map((m) => (
            <MarkView key={m.id} m={m} />
          ))}
          {preview && (
            <div className="preview">
              <MarkView m={preview} />
            </div>
          )}
        </div>
      </div>
      <header>
        <button
          className="brand"
          onClick={() => move({ x: 0, y: 0, z: 1 })}
          aria-label="The Wall, return to start"
        >
          <span>
            The Wall
            <span className="brand-sub">A little space for everyone.</span>
          </span>
        </button>
        <div className="header-right">
          <button className="about-button" onClick={() => setPanel("about")}>
            An open canvas. A shared story. <ArrowUpRight size={15} />
          </button>
          <button className="primary" onClick={() => add()}>
            <Plus size={18} /> Add a mark
          </button>
        </div>
      </header>
      <div className="location">
        <span className="green-dot" />
        {online ? "A wall we make together" : "An open invitation to create"}
        <span className="location-sub">No perfect lines required.</span>
      </div>
      <div className="bottom-left">
        <button className="pill" onClick={() => setPanel("list")}>
          <List size={17} /> Wall notes <span>{marks.length}</span>
        </button>
        <button className="text-button" onClick={() => setPanel("about")}>
          <Heart size={14} /> Keep it kind
        </button>
      </div>
      <div className="explore-hint">
        <Move size={16} />
        <span>
          Drag to explore <i /> Click anywhere to leave a mark
        </span>
      </div>
      <nav className="camera-tools" aria-label="Wall view controls">
        <button
          aria-label="Zoom out"
          disabled={camera.z <= 0.3}
          onClick={() => zoom(1 / 1.2)}
        >
          <Minus size={18} />
        </button>
        <span>{Math.round(camera.z * 100)}%</span>
        <button
          aria-label="Zoom in"
          disabled={camera.z >= 2}
          onClick={() => zoom(1.2)}
        >
          <Plus size={18} />
        </button>
        <span className="divider" />
        <button
          aria-label="Back to start"
          title="Back to start"
          onClick={() => move({ x: 0, y: 0, z: 1 })}
        >
          <Home size={18} />
        </button>
      </nav>
      {notice && (
        <div role="status" className="toast">
          {notice}
        </div>
      )}
      {position && (
        <Editor
          position={position}
          onClose={() => {
            setPosition(null);
            setPreview(null);
            wall.current?.focus();
          }}
          onPreview={setPreview}
          onPublish={async (m) => {
            const r = await fetch("/api/marks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(m),
            });
            const data = await r.json();
            if (!r.ok) throw Error(data.error || "Could not publish.");
            cache.current.clear();
            setReload((n) => n + 1);
            setNotice("Your mark is on the wall. Thanks for being here.");
          }}
        />
      )}
      {panel && (
        <InfoPanel
          close={() => {
            setPanel(null);
            wall.current?.focus();
          }}
          title={
            panel === "list"
              ? "Notes on the wall"
              : panel === "moderate"
                ? "Moderation queue"
                : "A wall for all of us."
          }
        >
          {panel === "about" ? (
            <>
              <div className="about-flower">✳</div>
              <p>
                A thought, a doodle, a tiny reminder. This is a place to leave
                something good and discover what others leave behind.
              </p>
              <h3>A few things we believe in</h3>
              <p>
                Be kind. Make space for others. Share your own words and
                drawings. Leave out hate, harassment, spam, and private
                information.
              </p>
              <p>
                Marks appear immediately. You can report a mark from Wall notes,
                hide it for this visit, or remove your own. Moderators can
                review and remove reported content.
              </p>
              <p className="connection" role="status">
                {status}
              </p>
              <button onClick={() => setPanel("moderate")}>
                Moderator access
              </button>
            </>
          ) : panel === "list" ? (
            <>
              <p className="muted">
                Visitor contributions in the area you’re exploring. Decorative
                artwork is curated, not visitor activity.
              </p>
              <p className="connection">{status}</p>
              {!online && (
                <button onClick={() => setReload((n) => n + 1)}>
                  Retry connection
                </button>
              )}
              {!visible.length && (
                <div className="empty">
                  <Paintbrush size={30} />
                  <h3>Room for your words.</h3>
                  <p>No visitor marks in this area yet.</p>
                  <button
                    className="primary"
                    onClick={() => {
                      setPanel(null);
                      add();
                    }}
                  >
                    Leave the first mark
                  </button>
                </div>
              )}
              {visible.map((m) => (
                <article key={m.id}>
                  <p>
                    {m.kind === "text"
                      ? m.text
                      : "A drawing" + (m.name ? ` by ${m.name}` : "")}
                  </p>
                  {m.kind === "drawing" && (
                    <svg viewBox="0 0 280 140">
                      {m.strokes.map((s, i) => (
                        <path
                          key={i}
                          d={path(s.points)}
                          stroke={s.color}
                          strokeWidth={s.width}
                          fill="none"
                        />
                      ))}
                    </svg>
                  )}
                  <small>
                    {m.name || "Anonymous"}
                    {m.created_at
                      ? " · " + new Date(m.created_at).toLocaleDateString()
                      : ""}
                  </small>
                  <div className="draw-actions">
                    <button
                      onClick={() => {
                        setPanel(null);
                        move({
                          ...camera,
                          x: -m.x * camera.z,
                          y: -m.y * camera.z,
                        });
                      }}
                    >
                      View on wall
                    </button>
                    <button onClick={() => setHidden([...hidden, m.id])}>
                      Hide
                    </button>
                    <button onClick={() => action(m.id, "report")}>
                      <Flag size={14} /> Report
                    </button>
                    {m.owned && (
                      <button onClick={() => action(m.id, "delete")}>
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </>
          ) : (
            <>
              <p>Use the server’s moderation token to review reported marks.</p>
              <label htmlFor="mod-token">Moderation token</label>
              <input
                id="mod-token"
                type="password"
                value={modToken}
                onChange={(e) => setModToken(e.target.value)}
              />
              <button
                onClick={async () => {
                  const r = await fetch("/api/moderation", {
                    headers: { Authorization: `Bearer ${modToken}` },
                  });
                  const data = await r.json();
                  if (r.ok) setQueue(data);
                  else setNotice(data.error);
                }}
              >
                Load reported marks
              </button>
              {queue.map((m) => (
                <article key={m.id}>
                  <p>{m.kind === "text" ? m.text : "Reported drawing"}</p>
                  {m.kind === "drawing" && (
                    <svg viewBox="0 0 280 140">
                      {m.strokes.map((s, i) => (
                        <path
                          key={i}
                          d={path(s.points)}
                          stroke={s.color}
                          strokeWidth={s.width}
                          fill="none"
                        />
                      ))}
                    </svg>
                  )}
                  {["hide", "approve", "delete"].map((action) => (
                    <button
                      key={action}
                      onClick={async () => {
                        const r = await fetch(`/api/moderation/${m.id}`, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${modToken}`,
                          },
                          body: JSON.stringify({ action }),
                        });
                        if (r.ok) {
                          setQueue(queue.filter((q) => q.id !== m.id));
                          cache.current.clear();
                          setReload((n) => n + 1);
                        } else setNotice("Moderation action failed.");
                      }}
                    >
                      {action}
                    </button>
                  ))}
                </article>
              ))}
            </>
          )}
        </InfoPanel>
      )}
    </>
  );
}
function InfoPanel({
  close,
  title,
  children,
}: {
  close: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      className="info-panel"
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      aria-labelledby="panel-title"
    >
      <div className="dialog-head">
        <h2 id="panel-title">{title}</h2>
        <button aria-label="Close panel" onClick={close}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
