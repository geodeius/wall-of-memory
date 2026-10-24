export const colors = new Set([
  "#66023c",
  "#303a36",
  "#bd4867",
  "#386fa5",
  "#427c61",
  "#b77a22",
  "#8055a3",
]);
export function validate(b) {
  if (
    b?.id !== undefined &&
    (typeof b.id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        b.id,
      ))
  )
    throw Error("Invalid mark ID.");
  if (b?.kind === "text" && (b.size < 24 || b.size > 60))
    throw Error("Invalid lettering size.");
  if (!b || !["text", "drawing"].includes(b.kind))
    throw Error("Choose text or drawing.");
  for (const [key, min, max] of [
    ["x", -1e9, 1e9],
    ["y", -1e9, 1e9],
    ["width", 280, 280],
    ["height", 140, 140],
    ["rotation", -15, 15],
    ["size", 12, 72],
  ])
    if (!Number.isFinite(b[key]) || b[key] < min || b[key] > max)
      throw Error(`Invalid ${key}.`);
  if (
    typeof b.text !== "string" ||
    b.text.length > 120 ||
    typeof b.name !== "string" ||
    b.name.length > 30 ||
    !colors.has(b.color) ||
    !["hand", "print", "serif"].includes(b.font)
  )
    throw Error("Invalid message settings.");
  if (!Array.isArray(b.strokes) || b.strokes.length > 60)
    throw Error("Too many strokes.");
  for (const s of b.strokes) {
    if (
      !s ||
      !colors.has(s.color) ||
      !Number.isFinite(s.width) ||
      s.width < 1 ||
      s.width > 6 ||
      !Array.isArray(s.points) ||
      !s.points.length ||
      s.points.length > 400
    )
      throw Error("Invalid drawing.");
    for (const p of s.points)
      if (
        !Array.isArray(p) ||
        p.length !== 2 ||
        !Number.isFinite(p[0]) ||
        !Number.isFinite(p[1]) ||
        p[0] < 0 ||
        p[0] > 280 ||
        p[1] < 0 ||
        p[1] > 140
      )
        throw Error("Invalid drawing point.");
  }
  if (
    (b.kind === "text" && !b.text.trim()) ||
    (b.kind === "drawing" && !b.strokes.length)
  )
    throw Error("Add a message or a drawing.");
  return Object.fromEntries(
    [
      "kind",
      "x",
      "y",
      "width",
      "height",
      "rotation",
      "text",
      "name",
      "color",
      "font",
      "size",
      "strokes",
    ].map((k) => [k, k === "text" || k === "name" ? b[k].trim() : b[k]]),
  );
}
