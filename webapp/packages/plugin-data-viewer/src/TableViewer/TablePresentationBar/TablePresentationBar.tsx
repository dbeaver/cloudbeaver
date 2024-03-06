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
import { baseTabStyles, TabList, TabsState, verticalRotatedTabStyles } from '@cloudbeaver/core-ui';

import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import { DataPresentationService, DataPresentationType } from '../../DataPresentationService';
import { PresentationTab } from './PresentationTab';
import styles from './TablePresentationBar.m.css';

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

const tablePresentationBarRegistry: StyleRegistry = [[baseTabStyles, { mode: 'append', styles: [verticalRotatedTabStyles, styles] }]];

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
  const style = useS(baseTabStyles, verticalRotatedTabStyles, styles);
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
    <SContext registry={tablePresentationBarRegistry}>
      <div className={s(style, { tableLeftBar: true }, className)}>
        <TabsState currentTabId={presentationId} autoSelect={main}>
          <TabList className={s(style, { tabListFlexible: main, tabList: true })} aria-label="Data Presentations">
            {presentations.map(presentation => (
              <Tab
                key={presentation.id}
                className={s(style, { baseTab: true })}
                presentation={presentation}
                model={model}
                resultIndex={resultIndex}
                style={styles}
                onClick={handleClick}
              />
            ))}
          </TabList>
        </TabsState>
      </div>
    </SContext>
  );
});
