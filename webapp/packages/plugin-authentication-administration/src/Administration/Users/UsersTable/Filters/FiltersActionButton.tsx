/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { clsx, IconButton, type IconButtonProps } from '@dbeaver/ui-kit';

const BUTTON_BOX_CLASS_NAME = clsx(
  'theme-form-element-radius theme-background-surface theme-text-on-surface theme theme-border-color-background',
  'tw:flex tw:items-center tw:justify-center tw:box-border tw:h-8 tw:border-2',
);

const BUTTON_CLASS_NAME = 'tw:relative! tw:box-border! tw:bg-inherit! tw:cursor-pointer! tw:w-[28px]! tw:h-full! tw:p-1! tw:hover:opacity-80!';

export interface IFiltersActionButtonProps extends IconButtonProps {
  active?: boolean;
}

export const FiltersActionButton = observer<IFiltersActionButtonProps>(function FiltersActionButton({ active, className, size = 'small', ...rest }) {
  return (
    <div className={BUTTON_BOX_CLASS_NAME}>
      <IconButton className={clsx(BUTTON_CLASS_NAME, active && 'tw:bg-(--theme-secondary)!', className)} size={size} {...rest} />
    </div>
  );
});
