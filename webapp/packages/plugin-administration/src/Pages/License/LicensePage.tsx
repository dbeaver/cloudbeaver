/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import styled, { use, css } from 'reshadow';

import { AdministrationItemContentComponent, ConfigurationWizardService } from '@cloudbeaver/core-administration';
import { FormBox, FormBoxElement, FormGroup, Loader, SubmittingForm, Textarea, useFocus } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useFormValidator } from '@cloudbeaver/core-executor';
import { Translate, useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { AdministrationLicensePageService } from './AdministrationLicensePageService';

const styles = composes(
  css`
    layout-grid-cell {
      composes: theme-background-surface theme-text-on-surface from global;
    }

    layout-grid-cell, message-box {
      composes: theme-border-color-background from global;
    }
  `,
  css`
    layout-grid {
      width: 100%;
      flex: 1;
    }

    layout-grid-inner {
      min-height: 100%;
    }

    layout-grid-cell {
      position: relative;
      border: solid 1px;
      padding: 16px 24px
    }

    message-box {
      border-bottom: solid 1px;
    }

    message-box, SubmittingForm {
      padding: 16px 24px;
    }

    SubmittingForm {
      flex: 1;
      display: flex;
      overflow: auto;
      flex-direction: column;
    }

    FormBox {
      flex: 0;
    }

    p {
      line-height: 2;
    }
  `
);

export const LicensePage: AdministrationItemContentComponent = observer(function LicensePage({
  configurationWizard,
}) {
  const translate = useTranslate();
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });
  const licensePageService = useService(AdministrationLicensePageService);
  const configurationWizardService = useService(ConfigurationWizardService);

  const handleSave = useCallback(async () => {
    if (configurationWizard) {
      await configurationWizardService.next();
    } else {
      await licensePageService.save();
    }
  }, []);

  useFormValidator(licensePageService.validationTask, focusedRef);

  return styled(useStyles(styles))(
    <layout-grid as="div">
      <layout-grid-inner as="div">
        <layout-grid-cell as='div' {...use({ span: 12 })}>
          <message-box as='div'>
            <h3><Translate token='administration_configuration_wizard_welcome_title' /></h3>
            <p><Translate token='administration_configuration_wizard_welcome_message' /></p>
          </message-box>

          {configurationWizard && (
            <SubmittingForm ref={focusedRef} name='license' onSubmit={handleSave}>
              {licensePageService.loading ? (
                <Loader />
              ) : (
                <>
                  <FormBox>
                    <FormBoxElement>
                      <FormGroup>
                        <Textarea
                          name="license"
                          rows={7}
                          state={licensePageService.state}
                          mod='surface'
                          minLength={6}
                          required
                          long
                        >
                          {translate('administration_configuration_wizard_license_key')}
                        </Textarea>
                      </FormGroup>
                    </FormBoxElement>
                    <FormBoxElement />
                    <FormBoxElement />
                  </FormBox>
                </>
              )}
            </SubmittingForm>
          )}
        </layout-grid-cell>
      </layout-grid-inner>
    </layout-grid>
  );
});
