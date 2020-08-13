/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { Loader } from '@cloudbeaver/core-blocks';
import { CommonDialogWrapper } from '@cloudbeaver/core-dialogs';

import { IDriver } from './Driver';
import { DriverSelector } from './DriverSelector';

const styles = css`
  CommonDialogWrapper {
    max-height: 550px;
    min-height: 550px;
  }
  DriverSelector {
    flex: 1;
  }
`;

type DriverSelectorDialogProps = {
  title: string;
  drivers: IDriver[];
  isLoading: boolean;
  onSelect(driverId: string): void;
  onClose(): void;
}

export const DriverSelectorDialog = observer(
  function DriverSelectorDialog({
    title,
    drivers,
    isLoading,
    onSelect,
    onClose,
  }: DriverSelectorDialogProps) {

    return styled(styles)(
      <CommonDialogWrapper
        title={title}
        noBodyPadding
        onReject={onClose}
      >
        {isLoading && <Loader />}
        {!isLoading && <DriverSelector drivers={drivers} onSelect={onSelect}/>}
      </CommonDialogWrapper>
    );
  }
);
