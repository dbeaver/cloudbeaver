/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { SContext, StyleRegistry, useTranslate } from '@cloudbeaver/core-blocks';
import type { ComponentStyle } from '@cloudbeaver/core-theming';
import { baseTabStyles, TabIcon, Tab, TabTitle, verticalRotatedTabStyles } from '@cloudbeaver/core-ui';

import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import type { IDataPresentationOptions } from '../../DataPresentationService';

interface Props {
  model: IDatabaseDataModel;
  resultIndex: number;
  presentation: IDataPresentationOptions;
  className?: string;
  style?: ComponentStyle; // TODO remove it
  onClick: (tabId: string) => void;
}

const presentationTabRegistry: StyleRegistry = [
  [
    baseTabStyles,
    {
      mode: 'append',
      styles: [verticalRotatedTabStyles],
    },
  ],
];

export const PresentationTab = observer<Props>(function PresentationTab({ model, presentation, className, style, onClick }) {
  const translate = useTranslate();

  if (presentation.getTabComponent) {
    const Tab = presentation.getTabComponent();

    return (
      <SContext registry={presentationTabRegistry}>
        <Tab tabId={presentation.id} className={className} model={model} presentation={presentation} disabled={model.isLoading()} onClick={onClick} />
      </SContext>
    );
  }

  return (
    <SContext registry={presentationTabRegistry}>
      <Tab tabId={presentation.id} disabled={model.isLoading()} onClick={onClick}>
        {presentation.icon && <TabIcon icon={presentation.icon} />}
        {presentation.title && <TabTitle>{translate(presentation.title)}</TabTitle>}
      </Tab>
    </SContext>
  );
});
