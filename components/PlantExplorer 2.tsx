"use client";

import dynamic from "next/dynamic";

/** Its own chunk, so the chapter's text and radios never wait for three.js (D16). */
export const PlantExplorer = dynamic(() => import("./PlantExplorer3D").then((m) => m.PlantExplorer3D), {
  ssr: false,
  loading: () => <div className="scene3d" aria-hidden="true" />,
});
