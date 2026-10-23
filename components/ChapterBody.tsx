import { evaluate } from "@mdx-js/mdx";
import type { ReactNode } from "react";
import * as runtime from "react/jsx-runtime";
import type { UiStrings } from "@/lib/ui";
import { mdxComponents } from "./mdx-components";

/** Compiles a chapter body at build time; nothing here ships to the client. */
export async function ChapterBody({ source, ui, sources }: { source: string; ui: UiStrings; sources?: ReactNode }) {
  const { default: Content } = await evaluate(source, { ...runtime, development: false });
  return <Content components={mdxComponents(ui, { sources })} />;
}
