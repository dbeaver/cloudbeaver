/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { Select, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';

import styles from './LanguageSelector.module.css';

export const LanguageSelector = observer(function LanguageSelector() {
  const localizationService = useService(LocalizationService);
  const notificationService = useService(NotificationService);
  const translate = useTranslate();
  const [changing, setChanging] = useState(false);

  async function changeLanguage(language: string) {
    if (changing || language === localizationService.currentLanguage) {
      return;
    }

    setChanging(true);

    try {
      await localizationService.changeLocale(language);
      notificationService.logSuccess({ title: 'plugin_localization_language_changed' });
    } catch (exception) {
      notificationService.logException(exception instanceof Error ? exception : new Error(String(exception)));
    } finally {
      setChanging(false);
    }
  }

  return (
    <Select
      className={styles['selector']}
      items={localizationService.supportedLanguages}
      value={localizationService.currentLanguage}
      keySelector={language => language.isoCode}
      valueSelector={language => language.nativeName ?? language.name}
      disabled={changing}
      aria-busy={changing}
      inline
      portal
      onSelect={changeLanguage}
    >
      {translate('core_settings_localization_settings_locale_label')}
    </Select>
  );
});
