/** D16: the pixel ratio handed to <Canvas dpr={[1, MAX_DPR]}>, so a 3x display never costs more than 4 px per CSS px. */
export const MAX_DPR = 2;

type Probe = Pick<Document, "createElement">;

/**
 * True when this browser can make a WebGL context. The probe context is released at
 * once: D16 allows exactly one live context, and a leaked probe would count as a second.
 * Any failure (no support, blocked by a setting, a throwing getContext) reads as "no".
 */
export function webglAvailable(doc: Probe = document): boolean {
  try {
    const canvas = doc.createElement("canvas") as HTMLCanvasElement;
    const gl = (canvas.getContext("webgl2") ?? canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

let probed: boolean | undefined;

/** One probe per page load: a stable snapshot for React, and one released context rather than many. */
export function webglAvailableOnce(): boolean {
  probed ??= webglAvailable();
  return probed;
}
