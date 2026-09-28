/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Button, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ScreenService } from '@cloudbeaver/core-routing';

import styles from './AdministrationTopAppBarHeader.module.css';

export const AdministrationTopAppBarHeader = observer(function AdministrationTopAppBarHeader() {
  const screenService = useService(ScreenService);
  const translate = useTranslate();
  const style = useS(styles);

  return (
    <div className={s(style, { container: true })}>
      <Button
        className={s(style, { button: true }, 'theme-text-on-primary')}
        icon="angle"
        iconPlacement="start"
        iconSize={16}
        viewBox="0 0 15 8"
        variant="secondary"
        size="medium"
        onClick={screenService.navigateToRoot}
      >
        {translate('core_connections_connections_settings_group')}
      </Button>
      <div className={s(style, { divider: true })} aria-hidden="true" />
      <span className={s(style, { title: true })}>{translate('administration_menu_enter')}</span>
    </div>
  );
});
