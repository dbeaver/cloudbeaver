/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Loader, s, useS } from '@cloudbeaver/core-blocks';
import { CommonDialogBody, CommonDialogHeader, CommonDialogWrapper } from '@cloudbeaver/core-dialogs';

import type { IDriver } from './Driver';
import { DriverSelector } from './DriverSelector';
import styles from './DriverSelectorDialog.m.css';

interface IProps {
  title: string;
  drivers: IDriver[];
  isLoading: boolean;
  onSelect: (driverId: string) => void;
  onClose: () => void;
}

export const DriverSelectorDialog = observer<IProps>(function DriverSelectorDialog({ title, drivers, isLoading, onSelect, onClose }) {
  const style = useS(styles);

  return (
    <CommonDialogWrapper size="large" fixedSize>
      <CommonDialogHeader title={title} onReject={onClose} />
      <CommonDialogBody noBodyPadding noOverflow>
        {isLoading && <Loader />}
        {!isLoading && <DriverSelector className={s(style, { driverSelector: true })} drivers={drivers} onSelect={onSelect} />}
      </CommonDialogBody>
    </CommonDialogWrapper>
  );
});
