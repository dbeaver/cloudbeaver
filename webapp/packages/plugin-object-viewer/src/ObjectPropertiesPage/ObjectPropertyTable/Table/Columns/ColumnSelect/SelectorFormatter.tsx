/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import { Command } from '@dbeaver/ui-kit';
import { CheckboxIndicator, getComputed, TableState } from '@cloudbeaver/core-blocks';
import type { DBObject } from '@cloudbeaver/core-navigation-tree';

interface Props {
  tableState: TableState<string>;
  object: DBObject;
}

export const SelectorFormatter = observer<Props>(function SelectorFormatter({ tableState, object }) {
  const id = object.uri;
  const selected = getComputed(() => tableState?.selected.get(id) ?? false);

  const select = useCallback(() => {
    tableState?.selected.set(id, !selected);
  }, [tableState, id, selected]);

  return (
    <Command
      className="tw:flex tw:w-full tw:h-full tw:items-center tw:justify-center tw:outline-0!"
      disabled={!tableState}
      tabIndex={0}
      onClick={select}
    >
      <CheckboxIndicator checked={selected} />
    </Command>
  );
});
