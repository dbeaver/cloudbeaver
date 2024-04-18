/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ConfigurationWizardService } from '@cloudbeaver/core-administration';
import { Button, s, useFocus, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import styles from './FinishPage.m.css';

export const FinishPage = observer(function FinishPage() {
  const translate = useTranslate();
  const service = useService(ConfigurationWizardService);
  const [focus] = useFocus<HTMLDivElement>({
    focusFirstChild: true,
  });
  const style = useS(styles);

  return (
    <div className={s(style, { layoutGrid: true })}>
      <div className={s(style, { layoutGridInner: true })}>
        <div ref={focus} className={s(style, { layoutGridCell: true })} data-span="12">
          <h3>{translate('administration_configuration_wizard_finish_title')}</h3>
          <p className={s(style, { message: true })}>{translate('administration_configuration_wizard_finish_message')}</p>

          <Button type="button" mod={['unelevated']} onClick={() => service.next()}>
            {translate('ui_stepper_finish')}
          </Button>
        </div>
      </div>
    </div>
  );
});
