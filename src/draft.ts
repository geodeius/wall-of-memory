import { palette, type Mark, type Stroke } from "./types";
const colors = new Set([...palette.map(([, color]) => color), "#8055a3"]);
const number = (value: unknown, fallback: number, min: number, max: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(min, Math.min(max, value))
    : fallback;
export function readDraft(
  position: { x: number; y: number },
  raw?: string | null,
): Mark {
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
    const saved = raw && raw.length < 300000 ? JSON.parse(raw) : null;
    if (
      !saved ||
      typeof saved !== "object" ||
      !["text", "drawing"].includes(saved.kind)
    )
      return initial;
    const strokes: Stroke[] = Array.isArray(saved.strokes)
      ? saved.strokes.slice(0, 60).flatMap((stroke: unknown) => {
          if (!stroke || typeof stroke !== "object") return [];
          const s = stroke as Stroke;
          if (!Array.isArray(s.points) || !colors.has(s.color)) return [];
          const points = s.points
            .slice(0, 400)
            .filter(
              (p) =>
                Array.isArray(p) &&
                p.length === 2 &&
                p.every(Number.isFinite) &&
                p[0] >= 0 &&
                p[0] <= 280 &&
                p[1] >= 0 &&
                p[1] <= 140,
            );
          return points.length
            ? [{ points, color: s.color, width: number(s.width, 3, 1, 6) }]
            : [];
        })
      : [];
    return {
      ...initial,
      id:
        typeof saved.id === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          saved.id,
        )
          ? saved.id
          : initial.id,
      kind: saved.kind,
      text: typeof saved.text === "string" ? saved.text.slice(0, 120) : "",
      name: typeof saved.name === "string" ? saved.name.slice(0, 30) : "",
      color: colors.has(saved.color) ? saved.color : initial.color,
      font: ["hand", "print", "serif"].includes(saved.font)
        ? saved.font
        : "hand",
      size: number(
        saved.size,
        36,
        saved.kind === "text" ? 24 : 12,
        saved.kind === "text" ? 60 : 72,
      ),
      rotation: number(saved.rotation, -4, -15, 15),
      strokes,
    };
  } catch {
    return initial;
  }
}
