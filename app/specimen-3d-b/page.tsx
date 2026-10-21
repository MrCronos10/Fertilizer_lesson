import type { Metadata } from "next";
import Link from "next/link";
import { Scene3DDemo } from "../specimen-3d/Scene3DDemo";

export const metadata: Metadata = {
  title: "3D foundation specimen B",
  robots: { index: false, follow: false },
};

/** A second 3D route, so e2e can prove 3D-to-3D navigation never holds two contexts (the lesson will have two). */
export default function Specimen3DB() {
  return (
    <main className="stack" style={{ padding: "1rem" }}>
      <h1>3D foundation specimen B</h1>
      <p id="lesson-text">Second 3D route.</p>
      <Scene3DDemo />
      <Link href="/specimen-3d">To the first 3D route</Link>
    </main>
  );
}
