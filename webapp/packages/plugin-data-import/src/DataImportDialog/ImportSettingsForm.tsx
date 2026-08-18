/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import { Combobox, Container, FieldCheckbox, Link, useTranslate } from '@cloudbeaver/core-blocks';
import type { DataTransferImportSettings } from '@cloudbeaver/core-sdk';

import type { IDataImportDriverConfiguration } from '../DataImportDriverConfigurationResource.js';

interface Props {
  settings: DataTransferImportSettings;
  driverConfiguration: IDataImportDriverConfiguration;
}

export const ImportSettingsForm = observer<Props>(function ImportSettingsForm({ settings, driverConfiguration }) {
  const translate = useTranslate();
  const { supportedInsertReplaceMethods, supportsBulkLoad, supportsTransactions } = driverConfiguration;

  useEffect(() => {
    if (settings.useBulkLoad) {
      settings.onDuplicateKeyMethod = undefined;
    }
  }, [settings.useBulkLoad]);

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
            disabled={settings.useBulkLoad}
            title={translate('plugin_data_import_settings_on_duplicate_key_title')}
            placeholder={translate('plugin_data_import_settings_on_duplicate_key_placeholder')}
            allowClear
          >
            {translate('plugin_data_import_settings_on_duplicate_key')}
          </Combobox>
          <Link className="tw:text-xs" href="https://dbeaver.com/docs/cloudbeaver/Data-Import-and-Replace/" target="_blank">
            {translate('plugin_data_import_settings_on_duplicate_key_help')}
          </Link>
        </div>
      )}

      <Container vertical>
        {supportsBulkLoad && (
          <FieldCheckbox title={translate('plugin_data_import_settings_use_bulk_load_title')} name="useBulkLoad" state={settings}>
            {translate('plugin_data_import_settings_use_bulk_load')}
          </FieldCheckbox>
        )}
        {supportsTransactions && (
          <FieldCheckbox title={translate('plugin_data_import_settings_use_transactions_title')} name="useTransactions" state={settings}>
            {translate('plugin_data_import_settings_use_transactions')}
          </FieldCheckbox>
        )}
        <FieldCheckbox title={translate('plugin_data_import_settings_open_new_connection_title')} name="openNewConnection" state={settings}>
          {translate('plugin_data_import_settings_open_new_connection')}
        </FieldCheckbox>
      </Container>
    </Container>
  );
});
