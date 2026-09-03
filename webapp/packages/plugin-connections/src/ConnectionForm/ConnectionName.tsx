/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { IconOrImage, useResource } from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';

interface Props {
  name: string;
  driverId?: string;
}

export const ConnectionName = observer<Props>(function ConnectionName({ driverId, name }) {
  const driverResource = useResource(ConnectionName, DBDriverResource, driverId || null);
  const driver = driverResource.data;

  return (
    <div className="tw:ml-6 tw:flex tw:max-w-60 tw:min-w-0 tw:items-center tw:gap-2" title={name}>
      {driver?.icon && <IconOrImage className="tw:size-5 tw:shrink-0" icon={driver.icon} />}
      <span className="tw:truncate tw:text-sm tw:font-medium">{name}</span>
    </div>
  );
});
