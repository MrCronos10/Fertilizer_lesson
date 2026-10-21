"use client";

import dynamic from "next/dynamic";

/**
 * three.js lives behind this import and nowhere else, so only a route that renders a
 * scene ever downloads it (D16); the text-route budget has no room for it.
 */
export const Scene3D = dynamic(() => import("./Scene3DIsland").then((m) => m.Scene3DIsland), {
  ssr: false,
  // Same box as the island, so the page does not jump while the three.js chunk loads.
  loading: () => <div className="scene3d" aria-hidden="true" />,
});
