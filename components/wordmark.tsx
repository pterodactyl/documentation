/**
 * The lockup with the name of this shelf of the site set beside it. The
 * SVG is the same file pterodactyl.io and the egg library use, so the three
 * cannot drift apart.
 */
export function Wordmark() {
  return (
    <span className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/pterodactyl-lockup.svg" alt="Pterodactyl" width={108} height={20} className="hidden h-5 w-auto dark:block" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/pterodactyl-lockup-light.svg" alt="Pterodactyl" width={108} height={20} className="h-5 w-auto dark:hidden" />
      <span className="border-l border-hairline-strong pl-3 font-mono text-mono-md font-normal text-fg-subtle">docs</span>
    </span>
  );
}
