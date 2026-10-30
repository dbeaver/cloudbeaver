/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Icon, ToolbarAction, useTranslate } from '@cloudbeaver/core-blocks';

interface Props {
  onUpdate: () => void;
}

export const RefreshUsersButton = observer<Props>(function RefreshUsersButton({ onUpdate }) {
  const translate = useTranslate();
  const label = translate('authentication_administration_tools_refresh_tooltip');

  return (
    <ToolbarAction aria-label={label} title={label} onClick={onUpdate}>
      <Icon className="tw:size-full tw:fill-(--theme-primary)!" name="/icons/refresh_m.svg#root" viewBox="0 0 24 24" />
    </ToolbarAction>
  );
});
