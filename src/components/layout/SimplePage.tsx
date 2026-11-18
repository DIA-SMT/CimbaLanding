import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function SimplePage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <Header />
      <main id="contenido" className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-primary hover:underline">
          <ArrowLeft className="size-4" aria-hidden /> Volver al inicio
        </Link>
        <h1 className="mt-6 flex items-center gap-3 text-4xl font-extrabold tracking-tight text-ink">
          <span className="leaf" aria-hidden />
          {title}
        </h1>
        <div className="mt-8 space-y-5 text-[1.05rem] leading-relaxed text-ink-soft [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
