/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';
import { use } from 'reshadow';

import { TabList, TabsState, verticalRotatedTabStyles } from '@cloudbeaver/core-ui';
import { useService } from '@cloudbeaver/core-di';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import { DataPresentationService, DataPresentationType } from '../../DataPresentationService';
import { PresentationTab } from './PresentationTab';

const styles = composes(
  css`
    Tab {
      composes: theme-ripple theme-background-background theme-text-text-primary-on-light from global;
    }
    TabList {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
  `,
  css`
    table-left-bar {
      display: flex;
    }
    Tab {
      composes: theme-typography--body2 from global;
      text-transform: uppercase;
      font-weight: normal;

      &:global([aria-selected=true]) {
        font-weight: normal !important;
      }
    }
    TabList[|flexible] tab-outer:only-child {
      display: none;
    }
  `
);

interface Props {
  type: DataPresentationType;
  presentationId: string | null | undefined;
  dataFormat: ResultDataFormat;
  supportedDataFormat: ResultDataFormat[];
  model: IDatabaseDataModel<any>;
  resultIndex: number;
  className?: string;
  onPresentationChange: (id: string) => void;
  onClose?: () => void;
}

export const TablePresentationBar = observer<Props>(function TablePresentationBar({
  type,
  presentationId,
  supportedDataFormat,
  dataFormat,
  model,
  resultIndex,
  className,
  onPresentationChange,
  onClose,
}) {
  const style = useStyles(styles, verticalRotatedTabStyles);
  const dataPresentationService = useService(DataPresentationService);
  const presentations = dataPresentationService.getSupportedList(
    type,
    supportedDataFormat,
    dataFormat,
    model,
    resultIndex
  );
  const Tab = PresentationTab; // alias for styles matching
  const handleClick = (tabId: string) => {
    if (tabId === presentationId) {
      onClose?.();
    } else {
      onPresentationChange(tabId);
    }
  };

  if (presentations.length <= 1 && type === DataPresentationType.main) {
    return null;
  }

  return styled(style)(
    <table-left-bar className={className}>
      <TabsState currentTabId={presentationId}>
        <TabList {...use({ flexible: type === DataPresentationType.main })}>
          {presentations.map(presentation => (
            <Tab
              key={presentation.id}
              presentation={presentation}
              model={model}
              resultIndex={resultIndex}
              style={styles}
              onClick={handleClick}
            />
          ))}
        </TabList>
      </TabsState>
    </table-left-bar>
  );
});
