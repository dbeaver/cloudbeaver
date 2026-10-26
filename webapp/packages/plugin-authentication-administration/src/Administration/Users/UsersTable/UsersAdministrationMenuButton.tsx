/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Icon, IconOrImage, Loader, useParentProps, useTranslate } from '@cloudbeaver/core-blocks';
import { MenuActionElement, type MenuBarItemProps } from '@cloudbeaver/core-ui';
import { ACTION_CREATE } from '@cloudbeaver/core-view';
import { Button, ButtonIcon, clsx } from '@dbeaver/ui-kit';

export const UsersAdministrationMenuButton = observer<MenuBarItemProps>(function UsersAdministrationMenuButton({
  label,
  tooltip,
  icon,
  onlyIcons,
  loading,
  binding,
  displaySubmenuMark,
  className,
  ...props
}) {
  const translate = useTranslate();
  const action = useParentProps(MenuActionElement);
  const translatedLabel = translate(label);
  const translatedTooltip = translate(tooltip) || (onlyIcons ? translatedLabel : undefined);
  const title = binding ? `${translatedTooltip || translatedLabel} (${binding})` : translatedTooltip;

  return (
    <Button
      {...props}
      variant={action?.item.action.action === ACTION_CREATE ? 'primary' : 'secondary'}
      className={clsx('tw:normal-case! tw:tracking-normal! tw:font-semibold', className)}
      loading={loading}
      title={title}
      aria-label={title}
    >
      {icon && (
        <ButtonIcon placement="start">
          <Loader suspense small inline>
            {typeof icon === 'string' ? <IconOrImage className="tw:h-4 tw:w-4" icon={icon} viewBox="0 0 24 24" /> : icon}
          </Loader>
        </ButtonIcon>
      )}
      {!onlyIcons && translatedLabel}
      {displaySubmenuMark && <Icon className="tw:h-3 tw:w-3" name="angle" viewBox="0 0 15 8" />}
    </Button>
  );
});
