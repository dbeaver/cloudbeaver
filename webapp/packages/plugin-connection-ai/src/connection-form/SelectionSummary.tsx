/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2019-2026 DBeaver Corp
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useId, type ReactElement } from 'react';

import { Button } from '@cloudbeaver/core-blocks';

interface SummaryAction {
  label: string;
  disabled?: boolean;
  onClick: () => void | Promise<void>;
}

interface Props {
  title: string;
  summary: string;
  count?: number | string;
  countLabel: string;
  hint?: string;
  active?: boolean;
  clearAction?: SummaryAction;
  editAction: SummaryAction;
}

export function SelectionSummary({ title, summary, count, countLabel, hint, active, clearAction, editAction }: Props): ReactElement {
  const titleId = useId();
  const summaryId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={`${active ? 'theme-border-color-primary tw:bg-[color-mix(in_srgb,var(--theme-primary)_5%,transparent)]' : 'theme-border-color-background'} ${count === undefined ? 'tw:border-dashed' : ''} tw:flex tw:min-w-0 tw:items-center tw:gap-4 tw:rounded-md tw:border tw:p-4 tw:flex-wrap`}
    >
      <div className="tw:flex tw:min-w-0 tw:flex-1 tw:basis-56 tw:items-center tw:gap-4" role="status">
        {count !== undefined && (
          <div
            className="tw:flex tw:h-8 tw:min-w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-(--theme-primary) tw:px-1 tw:text-(--theme-on-primary) tw:font-semibold"
            aria-label={countLabel}
          >
            {count}
          </div>
        )}
        <div className="tw:min-w-0 tw:flex-1">
          <div id={titleId} className="tw:font-semibold">
            {title}
          </div>
          <div id={summaryId} title={summary} className="tw:mt-1 tw:truncate tw:text-(--theme-text-hint-on-light)">
            {summary}
          </div>
          {hint && <div className="tw:mt-1 tw:text-xs tw:text-(--theme-text-hint-on-light)">{hint}</div>}
        </div>
      </div>
      <div className="tw:ml-auto tw:flex tw:shrink-0 tw:items-center tw:gap-2">
        {clearAction && (
          <Button
            className="tw:uppercase"
            type="button"
            variant="ghost"
            disabled={clearAction.disabled}
            aria-describedby={summaryId}
            onClick={clearAction.onClick}
          >
            {clearAction.label}
          </Button>
        )}
        <Button
          className="theme-border-color-primary theme-text-primary tw:uppercase"
          type="button"
          variant="secondary"
          disabled={editAction.disabled}
          aria-describedby={summaryId}
          loader
          onClick={editAction.onClick}
        >
          {editAction.label}
        </Button>
      </div>
    </section>
  );
}
