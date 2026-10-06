'use client';

import Link from 'next/link';
import { Fragment, useDeferredValue, useId, useMemo, useState, type ReactNode } from 'react';
import { useSetup, type Setup } from '../setup';
import { Button, Label, Output, Status, Widget } from '../widget';
import { EXAMPLES, matchProblems, type Match } from './troubleshooting/catalog';

const SHOWN = 4;

/** Turns `code spans` in catalog text into <code>. */
function inline(text: string): ReactNode {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith('`') && part.endsWith('`') ? (
      <code key={i} className="rounded border border-hairline bg-surface-raised px-1 py-px font-mono text-mono-md text-fg-strong">
        {part.slice(1, -1)}
      </code>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

function panelUrl(setup: Setup): string {
  return setup.domain ? `${setup.ssl ? 'https' : 'http'}://${setup.domain}` : 'https://panel.example.com';
}

/** Fills the reader's values into catalog text. */
function fill(text: string, setup: Setup): string {
  return text.replaceAll('{path}', setup.path).replaceAll('{php}', setup.php).replaceAll('{panel}', panelUrl(setup));
}

function ProblemCard({ match, setup, top }: { match: Match; setup: Setup; top: boolean }) {
  const { problem, score, hits } = match;
  const strong = score >= 3;

  return (
    <article className={`rounded-lg border bg-surface p-4 sm:p-5 ${top ? 'border-hairline-strong' : 'border-hairline'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Status tone={strong ? 'green' : 'yellow'}>{strong ? 'strong match' : 'possible match'}</Status>
        <span className="eyebrow">{problem.where}</span>
      </div>
      <h3 className="mt-2 text-entry text-white">{problem.title}</h3>

      {hits.length > 0 && (
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-ui-sm text-fg-faint">
          <span>Matched on</span>
          {hits.map((hit) => (
            <span key={hit} className="inline-block max-w-full rounded bg-accent-soft px-1.5 py-0.5 font-mono text-mono-sm leading-snug break-all text-fg-strong">
              {hit}
            </span>
          ))}
        </p>
      )}

      <p className="eyebrow mt-4 mb-1">Why it happens</p>
      <p className="text-note text-fg-muted">{inline(fill(problem.why, setup))}</p>

      <p className="eyebrow mt-4 mb-1">Fix</p>
      <ol className="list-decimal space-y-1 pl-5 text-note text-fg-muted marker:text-fg-dim">
        {problem.fix.map((step) => (
          <li key={step}>{inline(fill(step, setup))}</li>
        ))}
      </ol>

      {problem.commands && problem.commands.length > 0 && (
        <div className="mt-3">
          <Output>{problem.commands.map((c) => fill(c, setup)).join('\n')}</Output>
        </div>
      )}

      <Link href={problem.link.href} className="mt-3 inline-flex text-ui-sm text-fg-muted underline decoration-fg-dim underline-offset-4 hover:text-white hover:decoration-accent">
        Read more: {problem.link.label}
      </Link>
    </article>
  );
}

function NoMatch({ setup }: { setup: Setup }) {
  return (
    <div className="rounded-lg border border-dashed border-hairline-strong p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Status tone="blue">no match</Status>
      </div>
      <p className="mt-2 text-note text-fg-muted">
        Nothing in this list matches that text. Collect the lines below, remove any passwords or tokens, and include them when you ask for help on
        Discord. The Panel log and the Wings log usually hold the real error, a few lines above the first stack trace.
      </p>
      <div className="mt-3">
        <Output>
          {[
            '# The Panel log for today',
            `tail -n 100 ${setup.path}/storage/logs/laravel-$(date +%F).log`,
            '',
            '# The Wings service log',
            'journalctl -u wings -n 100 --no-pager',
            '',
            '# A Wings report. Choose to review it before it is uploaded.',
            'sudo wings diagnostics',
          ].join('\n')}
        </Output>
      </div>
    </div>
  );
}

export function TroubleshootingMatcher() {
  const setup = useSetup();
  const id = useId();
  const [text, setText] = useState('');
  const [showAll, setShowAll] = useState(false);
  const query = useDeferredValue(text);
  const matches = useMemo(() => matchProblems(query), [query]);
  const shown = showAll ? matches : matches.slice(0, SHOWN);
  const hasInput = query.trim().length >= 2;

  const choose = (value: string) => {
    setText(value);
    setShowAll(false);
  };

  return (
    <Widget
      title="Match an error to its fix"
      description="Paste an error or a log line. Known problems that match it appear below, best match first."
      actions={
        text ? (
          <Button onClick={() => choose('')}>Clear</Button>
        ) : undefined
      }
    >
      <label htmlFor={id} className="eyebrow mb-2 block">
        Error or log line
      </label>
      <textarea
        id={id}
        value={text}
        onChange={(e) => choose(e.target.value)}
        rows={4}
        spellCheck={false}
        autoComplete="off"
        placeholder="Could not establish a connection to the machine running this server..."
        className="block w-full resize-y rounded-lg border border-hairline bg-black px-3 py-2.5 font-mono text-mono-lg leading-relaxed text-fg-strong placeholder:text-fg-ghost focus:border-accent focus:outline-none"
      />

      <div className="mt-4">
        <Label>Try one</Label>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example.label}
              type="button"
              onClick={() => choose(example.text)}
              aria-pressed={text === example.text}
              className={`rounded-md border px-2.5 py-1 text-ui-sm transition-colors ${
                text === example.text
                  ? 'border-accent bg-accent-soft text-white'
                  : 'border-hairline text-fg-muted hover:border-hairline-strong hover:text-white'
              }`}
            >
              {example.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 border-t border-hairline pt-5" aria-live="polite">
        {!hasInput ? (
          <p className="text-note text-fg-faint">Matches appear here as you type.</p>
        ) : matches.length === 0 ? (
          <NoMatch setup={setup} />
        ) : (
          <>
            <p className="mb-3 text-ui-sm text-fg-subtle">
              {matches.length === 1 ? '1 known problem matches.' : `${matches.length} known problems match.`}
            </p>
            <div className="space-y-4">
              {shown.map((match, i) => (
                <ProblemCard key={match.problem.id} match={match} setup={setup} top={i === 0} />
              ))}
            </div>
            {matches.length > SHOWN && (
              <div className="mt-4">
                <Button onClick={() => setShowAll(!showAll)}>{showAll ? 'Show fewer' : `Show ${matches.length - SHOWN} more`}</Button>
              </div>
            )}
          </>
        )}
      </div>
    </Widget>
  );
}
