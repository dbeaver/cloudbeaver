/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { useAppVersion } from '@cloudbeaver/core-app';
import { BASE_CONTAINERS_STYLES, Button, ColoredContainer, FormFieldDescriptionNew, Group, IconOrImage, Link, TextPlaceholder } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogWrapper, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { ThemeService, useStyles } from '@cloudbeaver/core-theming';

const productInfoDialogStyles = css`
    CommonDialogWrapper {
      min-width: 600px;
    }
    controls {
      display: flex;
      flex: 1;
      height: 100%;
      align-items: center;
      justify-content: flex-end;
    }
    contacts-info {
      display: flex;
      white-space: pre-wrap;
    }
    FormFieldDescriptionNew {
      white-space: pre-wrap;
    }
    IconOrImage {
      max-width: 154px;
      height: 32px;
      border-radius: 2px;
    }
`;

export const ProductInfoDialog: React.FC<DialogComponentProps<null>> = observer(
  function ProductInfoDialog(props) {
    const translate = useTranslate();
    const styles = useStyles(BASE_CONTAINERS_STYLES, productInfoDialogStyles);
    const serverConfigResource = useService(ServerConfigResource);
    const themeService = useService(ThemeService);

    const version = useAppVersion();

    const productInfo = serverConfigResource.data?.productInfo;
    const logoIcon = themeService.currentThemeId === 'light' ? '/icons/product-logo_light.svg' : '/icons/product-logo_dark.svg';

    return styled(styles)(
      <CommonDialogWrapper
        title={translate('app_product_info')}
        footer={(
          <controls as='div'>
            <Button type="button" mod={['outlined']} onClick={props.rejectDialog}>
              {translate('ui_processing_ok')}
            </Button>
          </controls>
        )}
        onReject={props.rejectDialog}
      >
        <ColoredContainer>
          <Group gap>
            {!productInfo ? (
              <TextPlaceholder>{translate('app_product_info_placeholder')}</TextPlaceholder>
            ) : (
              <>
                <IconOrImage icon={logoIcon} />
                <FormFieldDescriptionNew label={translate('app_product_info_name')}>
                  {productInfo.name}
                </FormFieldDescriptionNew>
                <FormFieldDescriptionNew label={translate('app_product_info_description')}>
                  {productInfo.description}
                </FormFieldDescriptionNew>
                {productInfo.licenseInfo && (
                  <FormFieldDescriptionNew label={translate('app_product_info_license_info')}>
                    {productInfo.licenseInfo}
                  </FormFieldDescriptionNew>
                )}
                <FormFieldDescriptionNew label={translate('app_product_info_build_time')}>
                  {productInfo.buildTime}
                </FormFieldDescriptionNew>
                <FormFieldDescriptionNew label="Backend version">
                  {productInfo.version}
                </FormFieldDescriptionNew>
                <FormFieldDescriptionNew label="Frontend version">
                  {version.frontendVersion}
                </FormFieldDescriptionNew>
                <FormFieldDescriptionNew label={translate('app_product_info_contacts')}>
                  <contacts-info as='div'>You can contact us via our
                    <Link href="https://cloudbeaver.io/contact/" target='_blank' rel='noopener noreferrer'> Site </Link>
                    or
                    <Link href="https://github.com/dbeaver/cloudbeaver" target='_blank' rel='noopener noreferrer'> Github</Link>
                  </contacts-info>
                </FormFieldDescriptionNew>
              </>
            )}
          </Group>
        </ColoredContainer>
      </CommonDialogWrapper>
    );
  }
);
