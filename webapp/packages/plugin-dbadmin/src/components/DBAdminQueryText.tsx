/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

interface Props {
  title: string;
  query: string | null | undefined;
}

export const DBAdminQueryText = observer<Props>(function DBAdminQueryText({ title, query }) {
  if (!query) {
    return null;
  }

  return (
    <section aria-label={title} className="tw:shrink-0 tw:max-h-40 tw:overflow-auto tw:rounded tw:border tw:border-solid tw:p-2">
      <pre className="tw:m-0 tw:whitespace-pre-wrap tw:break-words tw:text-xs">{query}</pre>
    </section>
  );
});
