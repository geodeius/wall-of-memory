import test from "node:test";
import assert from "node:assert/strict";
import { validate } from "./validation.js";
const valid = () => ({
  kind: "text",
  x: 100,
  y: -50,
  width: 280,
  height: 140,
  rotation: -4,
  text: "Hello, wall",
  name: "",
  color: "#303a36",
  font: "hand",
  size: 36,
  strokes: [],
});
test("accepts safe messages and strips untrusted properties", () => {
  const m = validate({
    ...valid(),
    text: " <script>hello</script> ",
    admin: true,
  });
  assert.equal(m.text, "<script>hello</script>");
  assert.equal(m.admin, undefined);
  assert.equal(validate({ ...valid(), color: "#66023c" }).color, "#66023c");
});
test("rejects nonfinite positions, excessive text and invalid styles", () => {
  for (const patch of [
    { x: NaN },
    { y: Infinity },
    { text: "x".repeat(121) },
    { width: 2000 },
    { rotation: 99 },
    { color: "url(javascript:alert(1))" },
    { font: "arbitrary" },
    { kind: "svg" },
  ])
    assert.throws(() => validate({ ...valid(), ...patch }));
});
test("accepts bounded strokes and rejects arbitrary drawing data", () => {
  const m = {
    ...valid(),
    kind: "drawing",
    text: "",
    strokes: [
      {
        points: [
          [0, 0],
          [280, 140],
        ],
        color: "#303a36",
        width: 3,
      },
    ],
  };
  assert.equal(validate(m).strokes.length, 1);
  for (const strokes of [
    [{ ...m.strokes[0], points: [[281, 0]] }],
    [{ ...m.strokes[0], points: Array(401).fill([0, 0]) }],
    Array(61).fill(m.strokes[0]),
    [{ ...m.strokes[0], width: 99 }],
    [{ svg: "<script/>" }],
  ])
    assert.throws(() => validate({ ...m, strokes }));
});
