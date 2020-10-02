/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { TabList, TabsState, verticalRotatedTabStyles } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import { DataPresentationService } from '../../DataPresentationService';
import { PresentationTab } from './PresentationTab';

type Props = {
  presentationId: string;
  supportedDataFormat: ResultDataFormat[];
  model: IDatabaseDataModel<any>;
  className?: string;
  onPresentationChange(id: string): void;
}

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
    tab-outer:only-child {
      display: none;
    }
  `
);

export const TableLeftBar = observer(function TableLeftBar({
  presentationId,
  supportedDataFormat,
  model,
  className,
  onPresentationChange,
}: Props) {
  const dataPresentationService = useService(DataPresentationService);
  const presentations = dataPresentationService.getSupportedList(supportedDataFormat);
  const Tab = PresentationTab; // alias for styles matching

  return styled(useStyles(styles, verticalRotatedTabStyles))(
    <table-left-bar as="div" className={className}>
      <TabsState currentTabId={presentationId} onChange={onPresentationChange}>
        <TabList>
          {presentations.map(presentation => (
            <Tab key={presentation.id} presentation={presentation} model={model} style={styles}/>
          ))}
        </TabList>
      </TabsState>
    </table-left-bar>
  );
});
