/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { IconOrImage, useResource } from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';
import { TabsContext } from '@cloudbeaver/core-ui';

import { CONNECTION_FORM_CONNECTION_DETAILS_TAB_ID } from './ConnectionDetails/CONNECTION_FORM_CONNECTION_DETAILS_TAB_ID.js';

interface Props {
  name: string;
  driverId?: string;
}

export const ConnectionName = observer<Props>(function ConnectionName({ driverId, name }) {
  const tabsState = useContext(TabsContext);
  const driverResource = useResource(ConnectionName, DBDriverResource, driverId || null);
  const driver = driverResource.data;

  function openConnectionDetails() {
    tabsState?.open(CONNECTION_FORM_CONNECTION_DETAILS_TAB_ID);
  }

  return (
    <div className="tw:ml-6 tw:flex tw:min-w-0 tw:items-center tw:gap-2 tw:pr-2" title={name}>
      {driver?.icon && <IconOrImage className="tw:size-5 tw:min-w-5 tw:shrink-0" icon={driver.icon} />}
      <button
        type="button"
        className="tw:min-w-0 tw:cursor-pointer tw:truncate! tw:bg-transparent tw:p-0 tw:text-sm tw:font-medium tw:hover:underline tw:focus:underline"
        onClick={openConnectionDetails}
      >
        {name}
      </button>
    </div>
  );
});
