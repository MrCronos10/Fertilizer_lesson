"use client";

import dynamic from "next/dynamic";
import { useEffect, useLayoutEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { heroMode, type HeroMode } from "@/lib/home";
import { webglAvailableOnce } from "@/lib/webgl";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/** three.js lives behind this import: nothing of it is fetched until the hero asks (D16). */
const HeroScene3D = dynamic(() => import("./HeroScene3D").then((m) => m.HeroScene3D), { ssr: false, loading: () => null });

/** Waits for the browser to be idle, so the 3D chunk never competes with the first paint (T-024's lesson). */
function useIdle(enabled: boolean): boolean {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if (!enabled || idle) return;
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setIdle(true), { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(() => setIdle(true), 200);
    return () => clearTimeout(t);
  }, [enabled, idle]);
  return idle;
}

/** Rendered by the island when the scene cannot run after all (lost context, a throw): back to the flat hero. */
function GiveUp({ onGiveUp }: { onGiveUp: () => void }) {
  useEffect(onGiveUp, [onGiveUp]);
  return null;
}

/**
 * Chooses the hero (T-027): the live block, or the flat plate under reduced motion and without
 * WebGL. HERO_MODE_SCRIPT made the same choice before the first paint; this keeps `<html
 * data-hero>` right after a client-side navigation (where that script does not run), when the
 * reader changes their motion setting, or when the scene fails.
 */
export function HeroScene({ label, leadersId }: { label: string; leadersId: string }): ReactNode {
  const reducedMotion = usePrefersReducedMotion();
  const webgl = useSyncExternalStore(
    () => () => {},
    webglAvailableOnce,
    () => null,
  );
  const [failed, setFailed] = useState(false);
  const mode: HeroMode | null = failed ? "flat" : webgl === null ? null : heroMode({ webgl, reducedMotion });

  useLayoutEffect(() => {
    if (mode) document.documentElement.dataset.hero = mode;
  }, [mode]);

  const idle = useIdle(mode === "3d");
  if (mode !== "3d" || !idle) return null;
  return <HeroScene3D label={label} leadersId={leadersId} fallback={<GiveUp onGiveUp={() => setFailed(true)} />} />;
}
