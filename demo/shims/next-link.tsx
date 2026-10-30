import { forwardRef } from "react";
import { navigate, pathToHash } from "../router";

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean; replace?: boolean; scroll?: boolean };

const Link = forwardRef<HTMLAnchorElement, Props>(function Link({ href, prefetch, replace, scroll, onClick, ...rest }, ref) {
  void prefetch;
  const external = /^(https?:|mailto:|tel:)/.test(href);
  const anchorOnly = href.startsWith("#");
  const [path] = href.split(/[?#]/);
  const display = external || anchorOnly ? href : `#${pathToHash(path)}`;
  return (
    <a
      ref={ref}
      href={display || "#"}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || external || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(href, { replace, scroll });
      }}
      {...rest}
    />
  );
});
export default Link;
