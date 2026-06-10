/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef } from 'react';

import { DataGridContext } from '../DataGridContext.js';
import { TableMenuContext } from '../CellRenderer/TableMenuContext.js';
import { CellMenu } from './CellMenu.js';
import type { IDataGridMenu } from './useDataGridMenu.js';
import { throttle } from '@cloudbeaver/core-utils';

interface Props {
  menu: IDataGridMenu;
}

interface ScrollPosition {
  left: number;
  top: number;
}

const ALLOWED_SCROLL_OFFSET_PX = 20;

export const DataGridMenuContextProvider = observer<PropsWithChildren<Props>>(function DataGridMenuContextProvider({ menu, children }) {
  const gridContext = useContext(DataGridContext);
  const container = gridContext.getContainer();
  const containerPrevScrollPosition = useRef<ScrollPosition>({
    left: container?.scrollLeft ?? 0,
    top: container?.scrollTop ?? 0,
  });

  const handleScroll = useCallback(
    (event: Event) => {
      const scrolledElement = event.target as HTMLElement | null;
      const currentScrollTop = scrolledElement?.scrollTop ?? 0;
      const currentScrollLeft = scrolledElement?.scrollLeft ?? 0;
      const prevScrollTop = containerPrevScrollPosition.current?.top ?? 0;
      const prevScrollLeft = containerPrevScrollPosition.current?.left ?? 0;

      const yDelta = Math.abs(currentScrollTop - prevScrollTop);
      const xDelta = Math.abs(currentScrollLeft - prevScrollLeft);

      if (yDelta >= ALLOWED_SCROLL_OFFSET_PX || xDelta >= ALLOWED_SCROLL_OFFSET_PX) {
        menu.closeMenu();
      }

      containerPrevScrollPosition.current = { left: currentScrollLeft, top: currentScrollTop };
    },
    [menu],
  );

  const throttledHandleScroll = useMemo(() => throttle(handleScroll, 200), [handleScroll]);

  useEffect(() => {
    if (!container) {
      return;
    }

    container.addEventListener('scroll', throttledHandleScroll, { capture: true });

    return () => {
      container.removeEventListener('scroll', throttledHandleScroll, { capture: true });
    };
  }, [container, throttledHandleScroll]);

  return (
    <TableMenuContext.Provider value={menu}>
      {children}
      <CellMenu menu={menu} />
    </TableMenuContext.Provider>
  );
});
