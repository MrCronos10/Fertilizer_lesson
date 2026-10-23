"use client";

import { Canvas } from "@react-three/fiber";
import { Component, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import type { WebGLRenderer } from "three";
import { MAX_DPR, webglAvailableOnce } from "@/lib/webgl";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

type Props = {
  /** Accessible name for the canvas; the caller owns the words (no copy lives here). */
  label: string;
  /** Static stand-in shown when WebGL is unavailable. It must carry the lesson content itself. */
  fallback: ReactNode;
  /** Receives whether idle animation is allowed (false under prefers-reduced-motion). */
  children: (animate: boolean) => ReactNode;
};

/**
 * The probe can pass and the real Canvas still throw (context limit, low memory), and
 * that exception would otherwise take the whole lesson route down with it.
 */
class CanvasBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * True only while this island is mounted AND its route is on screen. With
 * cacheComponents Next keeps a visited route mounted but hidden (React <Activity>):
 * state survives, effects are torn down. A subscription is an effect, so its cleanup
 * fires on hiding and its setup on showing, which is exactly the signal needed to
 * drop the WebGL context while the route is out of sight. The cleanup also releases the
 * renderer's context synchronously: React re-renders a hidden tree at low priority, so waiting for the
 * <Canvas> to unmount leaves a second live context during the next route's mount.
 */
function useRouteActive(gl: RefObject<WebGLRenderer | null>): boolean {
  const [store] = useState(() => {
    let active = false;
    const listeners = new Set<() => void>();
    const emit = () => listeners.forEach((l) => l());
    return {
      get: () => active,
      subscribe(listener: () => void) {
        listeners.add(listener);
        active = true;
        emit();
        return () => {
          listeners.delete(listener);
          active = false;
          const renderer = gl.current;
          gl.current = null; // so the loss event this causes is not mistaken for the browser taking the context
          renderer?.forceContextLoss();
          listener();
        };
      },
    };
  });
  return useSyncExternalStore(store.subscribe, store.get, () => false);
}

/**
 * The one place a WebGL context is created. R3F force-loses the context when the
 * <Canvas> unmounts, which is what keeps a route change from leaking one; e2e counts
 * live contexts across repeated navigation to prove it.
 */
export function Scene3DIsland({ label, fallback, children }: Props) {
  const reduced = usePrefersReducedMotion();
  const gl = useRef<WebGLRenderer | null>(null);
  const active = useRouteActive(gl);
  // iPad Safari takes contexts back under memory pressure; a blank canvas for good is worse than the fallback.
  const [lost, setLost] = useState(false);
  // null on the server and during hydration, so the first paint matches the HTML.
  const supported = useSyncExternalStore(
    () => () => {},
    webglAvailableOnce,
    () => null,
  );

  if (supported === false || lost) return <>{fallback}</>;
  // Same box while the context is released, so returning to the route does not shift the layout.
  if (supported === null || !active) return <div className="scene3d" aria-hidden="true" />;

  return (
    <div className="scene3d" role="img" aria-label={label}>
      <CanvasBoundary fallback={fallback}>
        <Canvas
          dpr={[1, MAX_DPR]}
          frameloop={reduced ? "demand" : "always"}
          camera={{ position: [0, 0, 4], fov: 45 }}
          onCreated={(state) => {
            gl.current = state.gl;
            // Only a loss we did not cause counts: our own release clears gl.current first.
            state.gl.domElement.addEventListener("webglcontextlost", () => {
              if (gl.current === state.gl) setLost(true);
            });
          }}
        >
          {children(!reduced)}
        </Canvas>
      </CanvasBoundary>
    </div>
  );
}
