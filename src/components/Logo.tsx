/** SOFIT wordmark: the "O" is a follow-spot lens with its beam. */
export function Logo({ className = "", title = "SOFIT" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 132 28" className={className} role="img" aria-label={title} fill="currentColor">
      <title>{title}</title>
      {/* S */}
      <path d="M12.4 9.2c-.5-2.3-2.4-3.6-5-3.6-2.8 0-4.6 1.4-4.6 3.4 0 1.9 1.4 2.8 4.3 3.4l2 .4c4.1.8 6.2 2.7 6.2 6 0 4-3.3 6.6-8.1 6.6C2.7 25.4 0 23 0 19.5h2.6c.3 2.5 2.3 3.9 4.7 3.9 3 0 5-1.5 5-3.9 0-1.9-1.3-3-4.4-3.6l-2-.4C2 14.8 0 13 0 9.8 0 6.1 3 3.6 7.4 3.6c4.2 0 7.3 2.3 7.6 5.6h-2.6z" />
      {/* O — lens */}
      <circle cx="33" cy="14.5" r="10.4" fill="none" stroke="currentColor" strokeWidth="2.3" />
      <circle cx="33" cy="14.5" r="4.2" />
      {/* F */}
      <path d="M52 4h13.3v2.3H54.6v7h9.6v2.3h-9.6V25H52V4z" />
      {/* I */}
      <path d="M71.8 4h2.6v21h-2.6z" />
      {/* T */}
      <path d="M80 4h16.4v2.3h-6.9V25h-2.6V6.3H80V4z" />
      {/* beam */}
      <path d="M101 25 L132 1.5 L132 5.5 L103.6 25 Z" opacity=".55" />
      <path d="M101 25 L132 10 L132 13 L104.5 25 Z" opacity=".25" />
    </svg>
  );
}
