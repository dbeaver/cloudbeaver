/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { Placeholder, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { UnstyledButton } from '@dbeaver/ui-kit';

import { PANEL_ID_LEFT_SIDEBAR, PANEL_ID_MAIN_CONTENT } from './AppScreenService.js';
import { SkipNavService } from './SkipNavService.js';
import styles from './SkipNavLinks.module.css';

function focusPanel(panelId: string) {
  const element = document.querySelector<HTMLElement>(`[data-panel-id="${panelId}"]`);
  element?.focus();
}

export const SkipNavLinks = observer(function SkipNavLinks(): React.ReactElement {
  const translate = useTranslate();
  const skipNavService = useService(SkipNavService);

  return (
    <nav aria-label={translate('app_skip_nav_label')} className={styles['skipNav']}>
      <UnstyledButton type="button" className={styles['skipNavLink']} onClick={() => focusPanel(PANEL_ID_LEFT_SIDEBAR)}>
        {translate('app_skip_nav_navigator')}
      </UnstyledButton>
      <UnstyledButton type="button" className={styles['skipNavLink']} onClick={() => focusPanel(PANEL_ID_MAIN_CONTENT)}>
        {translate('app_skip_nav_main_content')}
      </UnstyledButton>
      <Placeholder container={skipNavService.extraLinks} />
    </nav>
  );
});
