/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { TextPlaceholder, useTab, Loader, useTabState, ExceptionMessage, useMapResource, ColoredContainer, Group, ObjectPropertyInfoFormNew, BASE_CONTAINERS_STYLES } from '@cloudbeaver/core-blocks';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import type { IConnectionFormTabProps } from '../ConnectionFormService';

export const OriginInfo: TabContainerPanelComponent<IConnectionFormTabProps> = observer(function OriginInfo({
  tabId,
  data,
}) {
  const tab = useTab(tabId);
  const translate = useTranslate();
  const state = useTabState<Record<string, any>>(() => ({}));
  const styles = useStyles(BASE_CONTAINERS_STYLES);

  const connection = useMapResource(data.resource!, {
    key: tab.selected ? data.info!.id : null,
    includes: ['includeOrigin', 'customIncludeOriginDetails'],
  }, {
    onData: (connection, res, prev) => {
      if (!connection.origin.details) {
        return;
      }

      if (prev?.origin.details) {
        for (const property of prev.origin.details) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete state[property.id!];
        }
      }

      for (const property of connection.origin.details) {
        state[property.id!] = property.value;
      }
    },
  }
  );

  if (connection.isLoading()) {
    return styled(styles)(
      <ColoredContainer>
        <Loader key="static" />
      </ColoredContainer>
    );
  }

  if (connection.exception) {
    return styled(styles)(
      <ColoredContainer>
        <ExceptionMessage exception={connection.exception} onRetry={connection.reload} />
      </ColoredContainer>
    );
  }

  if (!connection.data?.origin.details || connection.data.origin.details.length === 0) {
    return styled(styles)(
      <ColoredContainer>
        <TextPlaceholder>{translate('connections_administration_connection_no_information')}</TextPlaceholder>
      </ColoredContainer>
    );
  }

  return styled(styles)(
    <ColoredContainer>
      <Group>
        <ObjectPropertyInfoFormNew
          properties={connection.data.origin.details}
          state={state}
          editable={false}
          autoHide
        />
      </Group>
      <Loader key="overlay" loading={connection.isLoading()} overlay />
    </ColoredContainer>
  );
});
