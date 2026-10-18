import { DEFAULT_LOCALE } from "@/lib/locales";

export default function Home() {
  return (
    <main>
      <h1>เรียนรู้เรื่องปุ๋ย</h1>
      <p lang="en">
        Scaffold only. Locale routing and the chapter shell arrive in T-010; this placeholder is
        replaced then. Default locale: {DEFAULT_LOCALE}.
      </p>
    </main>
  );
}
