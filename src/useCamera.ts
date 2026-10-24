import { useRef, useState, useEffect } from "react";
export type Camera = { x: number; y: number; z: number };
export function useCamera() {
  const wall = useRef<HTMLDivElement>(null),
    world = useRef<HTMLDivElement>(null),
    cam = useRef<Camera>({ x: 0, y: 0, z: 1 });
  const [camera, setCamera] = useState(cam.current);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef({ distance: 0, pinched: false });
  const frame = useRef(0),
    flight = useRef(0);
  function apply(c: Camera) {
    cam.current = c;
    if (world.current)
      world.current.style.transform = `translate(${innerWidth / 2 + c.x}px,${innerHeight / 2 + c.y}px) scale(${c.z})`;
    if (wall.current)
      wall.current.style.backgroundPosition = `${c.x}px ${c.y}px`;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setCamera({ ...cam.current }));
  }
  function cancelMotion() {
    cancelAnimationFrame(flight.current);
    flight.current = 0;
  }
  function move(c: Camera) {
    cancelMotion();
    apply(c);
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
  function home(immediate = false) {
    if (
      flight.current &&
      !immediate &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    cancelMotion();
    if (immediate || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply({ x: 0, y: 0, z: 1 });
      return;
    }
    const velocity = { x: 0, y: 0, z: 0 };
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.032);
      last = now;
      const next = { ...cam.current };
      for (const axis of ["x", "y", "z"] as const) {
        const target = axis === "z" ? 1 : 0,
          offset = next[axis] - target,
          v = velocity[axis],
          w = 24,
          decay = Math.exp(-w * dt);
        next[axis] = target + (offset + (v + w * offset) * dt) * decay;
        velocity[axis] = (v - w * (v + w * offset) * dt) * decay;
      }
      apply(next);
      if (
        Math.abs(next.x) + Math.abs(next.y) < 0.15 &&
        Math.abs(next.z - 1) < 0.001
      ) {
        apply({ x: 0, y: 0, z: 1 });
        flight.current = 0;
        return;
      }
      flight.current = requestAnimationFrame(tick);
    };
    flight.current = requestAnimationFrame(tick);
  }
  useEffect(() => {
    const el = wall.current!;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey)
        zoom(Math.exp(-e.deltaY * 0.008), e.clientX, e.clientY);
      else
        move({
          ...cam.current,
          x: cam.current.x - e.deltaX,
          y: cam.current.y - e.deltaY,
        });
    };
    const resize = () => move({ ...cam.current });
    el.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("resize", resize);
    return () => {
      el.removeEventListener("wheel", wheel);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frame.current);
      cancelMotion();
    };
  }, []);
  return {
    wall,
    world,
    cam,
    camera,
    move,
    zoom,
    home,
    cancelMotion,
    pointers,
    drag,
  };
}
