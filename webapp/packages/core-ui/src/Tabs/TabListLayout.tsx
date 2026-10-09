/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { TabList as BaseTabList } from '@dbeaver/ui-kit';

import { useTabsState } from './useTabsState.js';

export function TabListLayout({
  children,
  className,
  'data-dialog-persistent-element': persistent,
  ...props
}: React.ComponentProps<typeof BaseTabList> & { 'data-dialog-persistent-element'?: boolean }): React.ReactElement {
  const items = useTabsState('renderedItems');

  return (
    <BaseTabList
      {...props}
      className="tw:sr-only"
      aria-owns={items.map(item => item.id).join(' ') || undefined}
      data-dialog-persistent-element={persistent}
      render={({ children, ...tabListProps }) => (
        <>
          {/* Keep Ariakit's tab context while separating action buttons from accessible tab ownership. */}
          <div {...tabListProps} />
          <div className={className} data-dialog-persistent-element={persistent}>
            {children}
          </div>
        </>
      )}
    >
      {children}
    </BaseTabList>
  );
}
