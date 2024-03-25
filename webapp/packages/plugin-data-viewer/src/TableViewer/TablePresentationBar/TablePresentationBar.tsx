/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, SContext, StyleRegistry, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { TabList, TabListStyles, TabListVerticalRotatedRegistry, TabsState, TabStyles } from '@cloudbeaver/core-ui';

import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import { DataPresentationService, DataPresentationType } from '../../DataPresentationService';
import { PresentationTab } from './PresentationTab';
import styles from './shared/TablePresentationBar.m.css';
import TablePresentationBarTab from './shared/TablePresentationBarTab.m.css';
import TablePresentationBarTabList from './shared/TablePresentationBarTabList.m.css';

interface Props {
  type: DataPresentationType;
  presentationId: string | null | undefined;
  dataFormat: ResultDataFormat;
  supportedDataFormat: ResultDataFormat[];
  model: IDatabaseDataModel;
  resultIndex: number;
  className?: string;
  onPresentationChange: (id: string) => void;
  onClose?: () => void;
}

const tablePresentationBarRegistry: StyleRegistry = [
  ...TabListVerticalRotatedRegistry,
  [TabListStyles, { mode: 'append', styles: [TablePresentationBarTabList] }],
  [TabStyles, { mode: 'append', styles: [TablePresentationBarTab] }],
];

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
  const style = useS(styles);
  const dataPresentationService = useService(DataPresentationService);
  const presentations = dataPresentationService.getSupportedList(type, supportedDataFormat, dataFormat, model, resultIndex);
  const Tab = PresentationTab; // alias for styles matching
  const handleClick = (tabId: string) => {
    if (tabId === presentationId) {
      onClose?.();
    } else {
      onPresentationChange(tabId);
    }
  };

  const main = type === DataPresentationType.main;

  if (presentations.length <= 1 && main) {
    return null;
  }

  return (
    <div className={s(style, { tableLeftBar: true }, className)}>
      <TabsState currentTabId={presentationId} autoSelect={main}>
        <SContext registry={tablePresentationBarRegistry}>
          <TabList className={s(style, { tabListFlexible: main })} aria-label="Data Presentations">
            {presentations.map(presentation => (
              <Tab key={presentation.id} presentation={presentation} model={model} resultIndex={resultIndex} onClick={handleClick} />
            ))}
          </TabList>
        </SContext>
      </TabsState>
    </div>
  );
});
