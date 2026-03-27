/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';

const ShortcutsDialog = importLazyComponent(() => import('./Shortcuts/ShortcutsDialog.js').then(m => m.ShortcutsDialog));

export function SkipNavShortcutsLink(): React.ReactElement {
  const translate = useTranslate();
  const commonDialogService = useService(CommonDialogService);

  function handleClick() {
    commonDialogService.open(ShortcutsDialog, undefined);
  }

  return (
    <button type="button" className="dbv-kit-skip-nav__link" onClick={handleClick}>
      {translate('shortcuts_title')}
    </button>
  );
}
