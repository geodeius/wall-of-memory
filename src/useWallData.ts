import { useState, useRef, useEffect } from "react";
import { type Mark } from "./types";
import { type Camera } from "./useCamera";
export function useWallData(camera: Camera) {
  const [marks, setMarks] = useState<Mark[]>([]);
  const [status, setStatus] = useState("Connecting to the shared wall…");
  const [online, setOnline] = useState(false);
  const cache = useRef(new Map<string, Mark[]>());
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const c = camera;
      const left = (-innerWidth / 2 - c.x) / c.z - 400,
        top = (-innerHeight / 2 - c.y) / c.z - 400,
        right = (innerWidth / 2 - c.x) / c.z + 400,
        bottom = (innerHeight / 2 - c.y) / c.z + 400;
      const cell = 1200;
      const x0 = Math.floor(left / cell),
        y0 = Math.floor(top / cell),
        x1 = Math.floor(right / cell),
        y1 = Math.floor(bottom / cell);
      const key = `${x0},${y0},${x1},${y1},${Math.round(c.z * 10)}`;
      if (cache.current.has(key)) setMarks(cache.current.get(key)!);
      try {
        const r = await fetch(
          `/api/marks?left=${x0 * cell}&top=${y0 * cell}&right=${(x1 + 1) * cell}&bottom=${(y1 + 1) * cell}&zoom=${c.z}`,
          { signal: controller.signal },
        );
        const data = await r.json();
        if (!r.ok) throw Error(data.error);
        cache.current.set(key, data);
        if (cache.current.size > 16)
          cache.current.delete(cache.current.keys().next().value!);
        setMarks(data);
        setOnline(true);
        setStatus(
          data.length === 1000
            ? "A busy corner of the wall. Zoom in to discover more marks."
            : "Shared wall connected",
        );
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setOnline(false);
          setStatus(
            "Shared publishing is unavailable. Explore and prepare a draft.",
          );
        }
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [camera, reload]);
  return { marks, status, online, cache, reload, setReload };
}
