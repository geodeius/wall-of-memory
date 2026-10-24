export type Stroke = { points: number[][]; color: string; width: number };
export type Mark = {
  id: string;
  kind: "text" | "drawing";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  text: string;
  name: string;
  color: string;
  font: string;
  size: number;
  strokes: Stroke[];
  created_at?: string;
  owned?: boolean;
};
export const palette = [
  ["Charcoal", "#303a36"],
  ["Rose", "#bd4867"],
  ["Ocean", "#386fa5"],
  ["Leaf", "#427c61"],
  ["Ochre", "#b77a22"],
  ["Violet", "#8055a3"],
];
export const path = (p: number[][]) =>
  p.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
