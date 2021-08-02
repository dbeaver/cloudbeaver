/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import {
  verticalRotatedTabStyles, Tab, TabIcon, TabTitle
} from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';

import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import type { IDataPresentationOptions } from '../../DataPresentationService';

interface Props {
  model: IDatabaseDataModel<any>;
  resultIndex: number;
  presentation: IDataPresentationOptions;
  className?: string;
  style?: ComponentStyle;
}

export const PresentationTab = observer(function PresentationTab({
  model,
  presentation,
  className,
  style,
}: Props) {
  const translate = useTranslate();
  const styles = useStyles(verticalRotatedTabStyles, style);

  if (presentation.getTabComponent) {
    const Tab = presentation.getTabComponent();

    return (
      <Tab
        tabId={presentation.id}
        className={className}
        style={verticalRotatedTabStyles}
        model={model}
        presentation={presentation}
        disabled={model.isLoading()}
      />
    );
  }

  return styled(styles)(
    <Tab
      tabId={presentation.id}
      style={[verticalRotatedTabStyles, style]}
      disabled={model.isLoading()}
    >
      {presentation.icon && <TabIcon icon={presentation.icon} />}
      {presentation.title && <TabTitle>{translate(presentation.title)}</TabTitle>}
    </Tab>
  );
});
