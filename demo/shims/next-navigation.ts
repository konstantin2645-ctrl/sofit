import { useMemo } from "react";
import { navigate, useLocation, useRouteParams } from "../router";
import { store } from "../store";

export class NotFoundError extends Error {}
export function notFound(): never {
  throw new NotFoundError("not found");
}
export function redirect(href: string): never {
  navigate(href, { replace: true });
  throw new NotFoundError("redirect");
}
export function unstable_rethrow() {}

export function usePathname() {
  return useLocation().path;
}
export function useSearchParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}
export function useParams() {
  return useRouteParams();
}
export function useRouter() {
  return {
    push: (href: string, o?: { scroll?: boolean }) => navigate(href, o),
    replace: (href: string, o?: { scroll?: boolean }) => navigate(href, { ...o, replace: true }),
    refresh: () => store.update(() => {}),
    back: () => history.back(),
    prefetch: () => {},
  };
}
