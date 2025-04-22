/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Combobox, usePermission, useResource } from '@cloudbeaver/core-blocks';
import { DatabaseAuthModelsResource } from '@cloudbeaver/core-connections';
import { CachedResourceListEmptyKey, resourceKeyList } from '@cloudbeaver/core-resource';
import { EAdminPermission } from '@cloudbeaver/core-root';
import { isNotNullDefined } from '@dbeaver/js-helpers';

interface Props {
  authModelCredentialsState: { authModelId?: string };
  applicableAuthModels: string[];
  readonlyAuthModelId?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  onAuthModelChange?: (authModelId: string | undefined) => void;
}

export const ConnectionAuthModelSelector = observer<Props>(function ConnectionAuthModelSelector({
  authModelCredentialsState,
  applicableAuthModels,
  onAuthModelChange,
  readonlyAuthModelId,
  readonly,
  disabled,
}) {
  const adminPermission = usePermission(EAdminPermission.admin);

  const authModelsLoader = useResource(
    ConnectionAuthModelSelector,
    DatabaseAuthModelsResource,
    applicableAuthModels.length ? resourceKeyList(applicableAuthModels) : CachedResourceListEmptyKey,
  );

  const availableAuthModels = authModelsLoader.data.filter(isNotNullDefined).filter(model => adminPermission || !model.requiresLocalConfiguration);

  if (availableAuthModels.length <= 1) {
    return null;
  }

  return (
    <Combobox
      value={authModelCredentialsState.authModelId}
      items={availableAuthModels}
      keySelector={model => model.id}
      valueSelector={model => model.displayName}
      titleSelector={model => model.description}
      searchable={availableAuthModels.length > 10}
      readOnly={readonly || readonlyAuthModelId}
      disabled={disabled}
      tiny
      fill
      onSelect={onAuthModelChange}
    />
  );
});
