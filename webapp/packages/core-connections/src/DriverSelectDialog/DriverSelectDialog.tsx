/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { observer } from 'mobx-react';
import { useEffect, useMemo } from 'react';
import styled, { css } from 'reshadow';

import { Loader } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogWrapper, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';

import { DBDriverResource } from '../DBDriverResource';
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

export const DriverSelectDialog = observer(function DriverSelectDialog({
  resolveDialog,
  rejectDialog,
}: DialogComponentProps<null, string>) {
  const dbDriverResource = useService(DBDriverResource);
  const title = useTranslate('connections_administration_new_connection');

  useEffect(() => { dbDriverResource.loadAll(); }, []);
  const isLoading = dbDriverResource.isLoading();
  const drivers = useMemo(() => computed(() => Array.from(dbDriverResource.data.values())), [dbDriverResource.data]);

  return styled(styles)(
    <CommonDialogWrapper
      title={title}
      noBodyPadding
      onReject={rejectDialog}
    >
      {isLoading && <Loader />}
      {!isLoading && <DriverSelector drivers={drivers.get()} onSelect={resolveDialog}/>}
    </CommonDialogWrapper>
  );
});
