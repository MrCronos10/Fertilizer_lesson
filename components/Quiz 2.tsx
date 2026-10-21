"use client";

import dynamic from "next/dynamic";

/** Its own chunk, fetched only by the chapter that shows it (see Calculator.tsx). */
export const Quiz = dynamic(() => import("./QuizIsland").then((m) => m.QuizIsland));
