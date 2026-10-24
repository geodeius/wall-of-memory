import { useRef, useState, useEffect } from "react";
export type Camera = { x: number; y: number; z: number };
export function useCamera() {
  const wall = useRef<HTMLDivElement>(null),
    world = useRef<HTMLDivElement>(null);
  const cam = useRef<Camera>({ x: 0, y: 0, z: 1 });
  const [camera, setCamera] = useState(cam.current);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef({ distance: 0, pinched: false });
  const frame = useRef(0);
  function move(c: Camera) {
    cam.current = c;
    if (world.current)
      world.current.style.transform = `translate(${innerWidth / 2 + c.x}px,${innerHeight / 2 + c.y}px) scale(${c.z})`;
    if (wall.current)
      wall.current.style.backgroundPosition = `${c.x}px ${c.y}px`;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setCamera({ ...cam.current }));
  }
  function zoom(factor: number, sx = innerWidth / 2, sy = innerHeight / 2) {
    const c = cam.current,
      z = Math.max(0.3, Math.min(2, c.z * factor)),
      wx = (sx - innerWidth / 2 - c.x) / c.z,
      wy = (sy - innerHeight / 2 - c.y) / c.z;
    move({
      x: sx - innerWidth / 2 - wx * z,
      y: sy - innerHeight / 2 - wy * z,
      z,
    });
  }
  useEffect(() => {
    const el = wall.current!;
    function wheel(e: WheelEvent) {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey)
        zoom(Math.exp(-e.deltaY * 0.008), e.clientX, e.clientY);
      else
        move({
          ...cam.current,
          x: cam.current.x - e.deltaX,
          y: cam.current.y - e.deltaY,
        });
    }
    el.addEventListener("wheel", wheel, { passive: false });
    const resize = () => move({ ...cam.current });
    window.addEventListener("resize", resize);
    return () => {
      el.removeEventListener("wheel", wheel);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frame.current);
    };
  }, []);
  return { wall, world, cam, camera, move, zoom, pointers, drag };
}
