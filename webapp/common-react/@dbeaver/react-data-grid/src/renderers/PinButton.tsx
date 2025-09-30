/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IconButton, Icon, clsx } from '@dbeaver/ui-kit';

interface PinButtonProps {
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
  isPinned: boolean;
  tabIndex?: number;
}

export function PinButton({ onClick, isPinned, tabIndex }: PinButtonProps): React.ReactElement {
  return (
    <IconButton
      className={clsx('tw:group-focus:opacity-100 tw:group-hover:opacity-100 tw:hover:opacity-100 tw:outline-offset-0', !isPinned && 'tw:opacity-0')}
      variant="secondary"
      size="small"
      tabIndex={tabIndex}
      title="Pin/unpin column"
      aria-label="Pin/unpin column"
      onClick={onClick}
    >
      <Icon name="arrow-down" />
    </IconButton>
  );
}
