/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { IconOrImage, useTranslate } from '@cloudbeaver/core-blocks';

import { FiltersActionButton } from './Filters/FiltersActionButton.js';

interface Props {
  onUpdate: () => void;
}

export const UsersAdministrationToolsPanel = observer<Props>(function UsersAdministrationToolsPanel({ onUpdate }) {
  const translate = useTranslate();
  const label = translate('authentication_administration_tools_refresh_tooltip');

  return (
    <FiltersActionButton aria-label={label} title={label} onClick={onUpdate}>
      <IconOrImage className="tw:w-full tw:h-full" icon="refresh" viewBox="0 0 24 24" />
    </FiltersActionButton>
  );
});
