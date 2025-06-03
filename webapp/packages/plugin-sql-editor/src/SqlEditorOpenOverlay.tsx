/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  Button,
  Fill,
  Overlay,
  OverlayActions,
  OverlayHeader,
  OverlayHeaderIcon,
  OverlayHeaderTitle,
  OverlayMessage,
  useTranslate,
} from '@cloudbeaver/core-blocks';

import type { ISqlDataSource } from './SqlDataSource/ISqlDataSource.js';

interface Props {
  dataSource: ISqlDataSource | undefined;
}

// TODO: probably we need to combine this component with SqlEditorOverlay and use common API for overlays
export const SqlEditorOpenOverlay = observer<Props>(function SqlEditorOpenOverlay({ dataSource }) {
  const translate = useTranslate();

  function openHandler() {
    dataSource?.open();
  }

  return (
    <Overlay active={!dataSource?.isOpened()}>
      <OverlayHeader>
        <OverlayHeaderIcon icon={dataSource?.icon} />
        <OverlayHeaderTitle>{translate('plugin_sql_editor_action_overlay_title')}</OverlayHeaderTitle>
      </OverlayHeader>
      <OverlayMessage>{translate('plugin_sql_editor_action_overlay_description')}</OverlayMessage>
      <OverlayActions>
        <Fill />
        <Button type="button" loading={dataSource?.isLoading()} loader onClick={openHandler}>
          {translate('ui_open')}
        </Button>
      </OverlayActions>
    </Overlay>
  );
});
