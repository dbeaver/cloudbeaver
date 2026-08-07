/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Combobox, Container, FieldCheckbox, Link, useTranslate } from '@cloudbeaver/core-blocks';
import type { DataTransferImportSettings } from '@cloudbeaver/core-sdk';

import type { IDataImportDriverConfiguration } from '../DataImportDriverConfigurationResource.js';

interface Props {
  settings: DataTransferImportSettings;
  driverConfiguration: IDataImportDriverConfiguration;
}

export const ImportSettingsForm = observer<Props>(function ImportSettingsForm({ settings, driverConfiguration }) {
  const translate = useTranslate();
  const { supportedInsertReplaceMethods, supportsBulkLoad, supportsTransactions, defaultOpenNewConnection } = driverConfiguration;

  return (
    <Container gap parent>
      {supportedInsertReplaceMethods.length > 0 && (
        <div>
          <Combobox
            name="onDuplicateKeyMethod"
            state={settings}
            items={supportedInsertReplaceMethods}
            keySelector={method => method.id}
            valueSelector={method => method.name}
            titleSelector={method => method.description ?? undefined}
            placeholder={translate('plugin_data_import_settings_on_duplicate_key_placeholder')}
          >
            {translate('plugin_data_import_settings_on_duplicate_key')}
          </Combobox>
          <Link className="tw:text-xs" href="https://dbeaver.com/docs/cloudbeaver/Data-Import-and-Replace/" target="_blank">
            {translate('plugin_data_import_settings_on_duplicate_key_help')}
          </Link>
        </div>
      )}
      {(supportsBulkLoad || supportsTransactions) && (
        <Container vertical>
          {supportsBulkLoad && (
            <FieldCheckbox name="useBulkLoad" state={settings}>
              {translate('plugin_data_import_settings_use_bulk_load')}
            </FieldCheckbox>
          )}
          {supportsTransactions && (
            <FieldCheckbox name="useTransactions" state={settings}>
              {translate('plugin_data_import_settings_use_transactions')}
            </FieldCheckbox>
          )}
          {defaultOpenNewConnection && (
            <FieldCheckbox name="openNewConnection" state={settings}>
              {translate('plugin_data_import_settings_open_new_connection')}
            </FieldCheckbox>
          )}
        </Container>
      )}
    </Container>
  );
});
