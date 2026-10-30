/* Entry point of the standalone SOFIT demo (single page, no server). */
import "./api";
import { Component, Suspense, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { navigate, ParamsContext, useLocation } from "./router";
import { store } from "./store";
import { NotFoundError } from "./shims/next-navigation";

import SiteLayout from "@/app/(site)/layout";
import HomePage from "@/app/(site)/page";
import ConcertsPage from "@/app/(site)/concerts/page";
import EventPage from "@/app/(site)/concerts/[slug]/page";
import ServicesPage from "@/app/(site)/services/page";
import PortfolioPage from "@/app/(site)/portfolio/page";
import ProjectPage from "@/app/(site)/portfolio/[slug]/page";
import ContactsPage from "@/app/(site)/contacts/page";
import NotFound from "@/app/not-found";

import { AdminShell } from "@/components/admin/AdminShell";
import { LoginForm } from "@/components/admin/LoginForm";
import { Dashboard } from "@/components/admin/Dashboard";
import { ResourceEditor, ResourceList } from "@/components/admin/ResourceViews";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { Leads } from "@/components/admin/Leads";
import { Orders } from "@/components/admin/Orders";
import { ContentEditor } from "@/components/admin/ContentEditor";

class Boundary extends Component<{ children: ReactNode; resetKey: string }, { notFound: boolean; error: Error | null }> {
  state = { notFound: false, error: null as Error | null };
  static getDerivedStateFromError(e: Error) {
    return e instanceof NotFoundError ? { notFound: true, error: null } : { notFound: false, error: e };
  }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && (this.state.notFound || this.state.error)) this.setState({ notFound: false, error: null });
  }
  render() {
    if (this.state.notFound) return <NotFound />;
    if (this.state.error)
      return (
        <div className="wrap py-40">
          <p className="h-card">Что-то пошло не так на этой странице.</p>
          <p className="mt-2 text-dim">{this.state.error.message}</p>
        </div>
      );
    return this.props.children;
  }
}

const TITLES: [RegExp, string][] = [
  [/^\/$/, "SOFIT — концертное агентство полного цикла"],
  [/^\/concerts$/, "Афиша концертов — SOFIT"],
  [/^\/concerts\//, "Концерт — SOFIT"],
  [/^\/services/, "Услуги — SOFIT"],
  [/^\/portfolio/, "Проекты — SOFIT"],
  [/^\/contacts/, "Контакты — SOFIT"],
  [/^\/admin/, "Админ-панель — SOFIT"],
];

function sitePage(path: string, search: string): [ReactNode, Record<string, string>] {
  const sp = Object.fromEntries(new URLSearchParams(search));
  let m: RegExpMatchArray | null;
  if (path === "/") return [<HomePage key="home" />, {}];
  if (path === "/concerts") return [<ConcertsPage key="concerts" params={{} as never} searchParams={sp as never} />, {}];
  if ((m = path.match(/^\/concerts\/([\w-]+)$/))) return [<EventPage key={path} params={{ slug: m[1] } as never} searchParams={{} as never} />, { slug: m[1] }];
  if (path === "/services") return [<ServicesPage key="services" />, {}];
  if (path === "/portfolio") return [<PortfolioPage key="portfolio" />, {}];
  if ((m = path.match(/^\/portfolio\/([\w-]+)$/))) return [<ProjectPage key={path} params={{ slug: m[1] } as never} searchParams={{} as never} />, { slug: m[1] }];
  if (path === "/contacts") return [<ContactsPage key="contacts" />, {}];
  return [<NotFound key="404" />, {}];
}

function adminPage(path: string): [ReactNode, Record<string, string>] {
  let m: RegExpMatchArray | null;
  if (path === "/admin") return [<Dashboard />, {}];
  if (path === "/admin/media") return [<MediaLibrary />, {}];
  if (path === "/admin/leads") return [<Leads />, {}];
  if (path === "/admin/orders") return [<Orders />, {}];
  if (path === "/admin/content") return [<ContentEditor />, {}];
  if ((m = path.match(/^\/admin\/(events|artists|venues|projects)\/(new|\d+)$/)))
    return [<ResourceEditor key={path} resource={m[1]} id={m[2]} />, { resource: m[1], id: m[2] }];
  if ((m = path.match(/^\/admin\/(events|artists|venues|projects)$/))) return [<ResourceList key={path} resource={m[1]} />, { resource: m[1] }];
  return [<p key="nf">Раздел не найден</p>, {}];
}

function DemoBar() {
  return (
    <div className="fixed bottom-3 left-1/2 z-[90] flex max-w-[calc(100%-24px)] -translate-x-1/2 items-center gap-3 rounded-full border border-[var(--line-strong)] bg-black/80 py-1.5 pl-4 pr-1.5 text-xs text-paper/85 backdrop-blur">
      <span className="truncate">Демо: изменения сохраняются в этом браузере</span>
      <button type="button" className="shrink-0 rounded-full bg-paper px-3 py-1.5 font-semibold text-black hover:bg-spot" onClick={() => navigate("/admin")}>
        Админка
      </button>
    </div>
  );
}

function App() {
  const { path, search } = useLocation();
  useSyncExternalStore(store.subscribe, store.version);
  const session = store.get().session;

  useEffect(() => {
    document.title = TITLES.find(([r]) => r.test(path))?.[1] ?? "SOFIT";
  }, [path]);

  const isAdmin = path.startsWith("/admin");
  const needLogin = isAdmin && path !== "/admin/login" && !session;
  useEffect(() => {
    if (needLogin) navigate(`/admin/login?next=${encodeURIComponent(path)}`, { replace: true });
    if (path === "/admin/login" && session) navigate("/admin", { replace: true });
  }, [needLogin, path, session]);

  if (isAdmin) {
    if (path === "/admin/login" || needLogin)
      return (
        <AdminShell>
          <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4">
            <div
              aria-hidden
              className="absolute left-1/2 top-0 h-[110vh] w-[70vw] -translate-x-1/2"
              style={{ background: "conic-gradient(from 180deg at 50% 0%, transparent 166deg, rgb(255 197 110 / .14) 180deg, transparent 194deg)" }}
            />
            <div className="relative w-full max-w-sm">
              <LoginForm />
              <p className="mt-4 text-center text-sm text-dim">
                Демо-доступ: admin@sofit.live / sofit-admin-2026
              </p>
              <p className="mt-2 text-center">
                <a href="#" className="link-underline text-sm" onClick={(e) => (e.preventDefault(), navigate("/"))}>
                  Вернуться на сайт
                </a>
              </p>
            </div>
          </main>
        </AdminShell>
      );
    const [page, params] = adminPage(path);
    return (
      <ParamsContext.Provider value={params}>
        <AdminShell>
          <Boundary resetKey={path}>
            {page}
            <div className="mt-12 border-t border-[var(--line)] pt-6 text-sm text-dim">
              Демо-версия: данные хранятся в этом браузере.{" "}
              <button
                type="button"
                className="link-underline text-paper"
                onClick={async () => {
                  if (await window.__confirm("Вернуть демо-данные к исходному состоянию? Ваши изменения будут удалены.")) {
                    store.reset();
                    navigate("/admin/login", { replace: true });
                  }
                }}
              >
                Сбросить демо-данные
              </button>
            </div>
          </Boundary>
        </AdminShell>
      </ParamsContext.Provider>
    );
  }

  const [page, params] = sitePage(path, search);
  return (
    <ParamsContext.Provider value={params}>
      <SiteLayout>
        <Boundary resetKey={path}>
          <Suspense>{page}</Suspense>
        </Boundary>
      </SiteLayout>
      <DemoBar />
    </ParamsContext.Provider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
