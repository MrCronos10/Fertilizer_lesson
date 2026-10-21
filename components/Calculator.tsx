"use client";

import dynamic from "next/dynamic";

/**
 * The calculator's code is its own chunk, fetched only by a page that renders
 * it. Imported statically from the chapter components it would ride along on
 * every chapter route, and the text-route budget (D16) leaves little to spare.
 */
export const Calculator = dynamic(() => import("./CalculatorForm").then((m) => m.CalculatorForm));
