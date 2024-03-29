/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  Button,
  ColoredContainer,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  FormFieldDescription,
  Group,
  IconOrImage,
  Link,
  s,
  TextPlaceholder,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { ThemeService } from '@cloudbeaver/core-theming';
import { useAppVersion } from '@cloudbeaver/core-version';

import ProductInfoDialogStyles from './ProductInfoDialog.m.css';

export const ProductInfoDialog = observer<DialogComponentProps<null>>(function ProductInfoDialog(props) {
  const translate = useTranslate();
  const serverConfigResource = useService(ServerConfigResource);
  const themeService = useService(ThemeService);

  const version = useAppVersion();

  const productInfo = serverConfigResource.data?.productInfo;
  const logoIcon = themeService.themeId === 'light' ? '/icons/product-logo_light.svg' : '/icons/product-logo_dark.svg';

  const styles = useS(ProductInfoDialogStyles);

  return (
    <CommonDialogWrapper size="large">
      <CommonDialogHeader title="app_product_info" onReject={props.rejectDialog} />
      <CommonDialogBody>
        <ColoredContainer>
          <Group gap compact box>
            {!productInfo ? (
              <TextPlaceholder>{translate('app_product_info_placeholder')}</TextPlaceholder>
            ) : (
              <>
                <IconOrImage className={s(styles, { iconOrImage: true })} icon={logoIcon} />
                <FormFieldDescription className={s(styles, { formFieldDescription: true })} label={translate('app_product_info_name')}>
                  {productInfo.name}
                </FormFieldDescription>
                <FormFieldDescription className={s(styles, { formFieldDescription: true })} label={translate('app_product_info_description')}>
                  {productInfo.description}
                </FormFieldDescription>
                {productInfo.licenseInfo && (
                  <FormFieldDescription className={s(styles, { formFieldDescription: true })} label={translate('app_product_info_license_info')}>
                    {productInfo.licenseInfo}
                  </FormFieldDescription>
                )}
                <FormFieldDescription className={s(styles, { formFieldDescription: true })} label={translate('app_product_info_build_time')}>
                  {productInfo.buildTime}
                </FormFieldDescription>
                <FormFieldDescription className={s(styles, { formFieldDescription: true })} label="Backend version">
                  {productInfo.version}
                </FormFieldDescription>
                <FormFieldDescription className={s(styles, { formFieldDescription: true })} label="Frontend version">
                  {version.frontendVersion}
                </FormFieldDescription>
                <FormFieldDescription className={s(styles, { formFieldDescription: true })} label={translate('app_product_info_contacts')}>
                  <div className={s(styles, { contactsInfo: true })}>
                    You can contact us via our
                    <Link href="https://dbeaver.com/company/contact/" target="_blank" rel="noopener noreferrer">
                      {' '}
                      Site{' '}
                    </Link>
                    or
                    <Link href="https://github.com/dbeaver/cloudbeaver" target="_blank" rel="noopener noreferrer">
                      {' '}
                      Github
                    </Link>
                  </div>
                </FormFieldDescription>
              </>
            )}
          </Group>
        </ColoredContainer>
      </CommonDialogBody>
      <CommonDialogFooter className={s(styles, { commonDialogFooter: true })}>
        <Button type="button" mod={['outlined']} onClick={props.rejectDialog}>
          {translate('ui_processing_ok')}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
