import type { Metadata } from "next";
import Link from "next/link";
import { Scene3DDemo } from "./Scene3DDemo";

export const metadata: Metadata = {
  title: "3D foundation specimen",
  robots: { index: false, follow: false },
};

/**
 * Internal fixture for the 3D substrate (T-017), like /specimen: not part of the lesson,
 * no agronomic content, English sample text. The text below must stay readable when
 * WebGL is missing; T-018 mounts the real scene in a chapter and this page can go.
 */
export default function Specimen3D() {
  return (
    <main className="stack" style={{ padding: "1rem" }}>
      <h1>3D foundation specimen</h1>
      <p id="lesson-text">This sentence stands in for lesson text and is rendered without WebGL.</p>
      <Scene3DDemo />
      <Link href="/th">Leave this page</Link>
      <Link href="/specimen-3d-b">To the second 3D route</Link>
    </main>
  );
}
