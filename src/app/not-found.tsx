import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative grid min-h-[100svh] place-items-center overflow-hidden px-6 text-center">
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-[120vh] w-[60vw] -translate-x-1/2"
        style={{ background: "conic-gradient(from 180deg at 50% 0%, transparent 168deg, rgb(255 197 110 / .18) 180deg, transparent 192deg)" }}
      />
      <div className="relative">
        <p className="display text-[clamp(6rem,24vw,18rem)] text-paper/90">404</p>
        <p className="lead mx-auto mt-4">Луч прожектора ничего здесь не нашёл. Возможно, страница переехала или концерт уже прошёл.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/concerts" className="btn btn-light">
            Открыть афишу
          </Link>
          <Link href="/" className="btn btn-ghost">
            На главную
          </Link>
        </div>
      </div>
    </main>
  );
}
