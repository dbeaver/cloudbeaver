/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { importLazyComponent, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { UnstyledButton } from '@dbeaver/ui-kit';

import { skipNavLinkStyles } from '@cloudbeaver/core-app';

const ShortcutsDialog = importLazyComponent(() => import('./Shortcuts/ShortcutsDialog.js').then(m => m.ShortcutsDialog));

export const SkipNavShortcutsLink = observer(function SkipNavShortcutsLink(): React.ReactElement {
  const translate = useTranslate();
  const commonDialogService = useService(CommonDialogService);

  function handleClick() {
    commonDialogService.open(ShortcutsDialog, undefined);
  }

  return (
    <UnstyledButton type="button" className={skipNavLinkStyles} onClick={handleClick}>
      {translate('shortcuts_title')}
    </UnstyledButton>
  );
});
