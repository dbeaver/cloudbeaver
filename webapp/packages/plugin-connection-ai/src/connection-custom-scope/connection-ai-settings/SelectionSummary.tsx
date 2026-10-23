/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2019-2026 DBeaver Corp
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useId, type ReactElement, type ReactNode } from 'react';

interface Props {
  title: string;
  summary: string;
  badge?: ReactNode;
  active?: boolean;
  children: (summaryId: string) => ReactNode;
}

export function SelectionSummary({ title, summary, badge, active, children }: Props): ReactElement {
  const titleId = useId();
  const summaryId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={`${active ? 'theme-border-color-primary tw:bg-[color-mix(in_srgb,var(--theme-primary)_5%,transparent)]' : 'theme-border-color-background'} ${badge == null ? 'tw:border-dashed' : ''} tw:flex tw:min-w-0 tw:items-center tw:gap-4 tw:rounded-md tw:border tw:p-4 tw:flex-wrap`}
    >
      <div className="tw:flex tw:min-w-0 tw:flex-1 tw:basis-56 tw:items-center tw:gap-4" role="status">
        {badge}
        <div className="tw:min-w-0 tw:flex-1">
          <div id={titleId} className="tw:font-semibold">
            {title}
          </div>
          <div id={summaryId} title={summary} className="tw:mt-1 tw:truncate tw:text-(--theme-text-hint-on-light)">
            {summary}
          </div>
        </div>
      </div>
      <div className="tw:ml-auto tw:flex tw:shrink-0 tw:items-center tw:gap-2">{children(summaryId)}</div>
    </section>
  );
}
