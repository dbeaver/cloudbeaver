/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ComponentStyle } from '@cloudbeaver/core-theming';

import type { IRouteParams } from './IRouteParams';

export enum AdministrationItemType {
  Default,
  Administration,
  ConfigurationWizard
}

export interface IAdministrationItemReplaceOptions {
  priority: number;
  condition?: (configurationWizard: boolean) => boolean;
}

export interface AdministrationItemDrawerProps {
  item: IAdministrationItem;
  configurationWizard: boolean;
  onSelect: (id: string) => void;
  style: ComponentStyle;
  disabled?: boolean;
}
export type AdministrationItemDrawerComponent = React.FunctionComponent<AdministrationItemDrawerProps>;

export interface AdministrationItemContentProps {
  item: IAdministrationItem;
  configurationWizard: boolean;
  sub?: IAdministrationItemSubItem;
  param?: string | null;
}
export type AdministrationItemContentComponent = React.FunctionComponent<AdministrationItemContentProps>;

export type AdministrationItemSubContentProps = AdministrationItemContentProps & {
  sub: IAdministrationItemSubItem;
  param: string | null;
};
export type AdministrationItemSubContentComponent = React.FunctionComponent<AdministrationItemSubContentProps>;

export type AdministrationItemEvent = (
  configurationWizard: boolean,
  outside: boolean,
  outsideAdminPage: boolean
) => Promise<void> | void;
export type AdministrationItemCanActivateEvent = (
  configurationWizard: boolean,
  administration: boolean
) => Promise<boolean> | boolean;
export type AdministrationItemSubEvent = (
  param: string | null,
  configurationWizard: boolean,
  outside: boolean
) => Promise<void> | void;
export type AdministrationItemSubCanActivateEvent = (
  param: string | null,
  configurationWizard: boolean
) => Promise<boolean> | boolean;

export interface IAdministrationItemSubItem {
  name: string;
  getComponent?: () => AdministrationItemSubContentComponent;
  onActivate?: AdministrationItemSubEvent;
  onDeActivate?: AdministrationItemSubEvent;
  canActivate?: AdministrationItemSubCanActivateEvent;
  canDeActivate?: AdministrationItemSubCanActivateEvent;
}

export interface IConfigurationWizardItemOptions {
  description: string;
  order?: number;
  defaultRoute?: IRouteParams;
  isDisabled?: () => boolean;
  isHidden?: () => boolean;
  isDone?: () => boolean;
  onLoad?: () => Promise<void> | void;
  onFinish?: () => Promise<boolean> | boolean;
  onConfigurationFinish?: () => Promise<any> | any;
}

export interface IAdministrationItemOptions {
  name: string;
  /** By default will be set to AdministrationItemType.Administration */
  type?: AdministrationItemType;
  configurationWizardOptions?: IConfigurationWizardItemOptions;
  order?: number;
  sub?: IAdministrationItemSubItem[];
  isHidden?: ((configurationWizard: boolean) => boolean) | boolean;
  isOnlyActive?: ((configurationWizard: boolean) => boolean) | boolean;
  replace?: IAdministrationItemReplaceOptions;
  defaultSub?: string;
  defaultParam?: string;
  getDrawerComponent: () => AdministrationItemDrawerComponent;
  getContentComponent: () => AdministrationItemContentComponent;
  onLoad?: AdministrationItemEvent;
  onActivate?: AdministrationItemEvent;
  onDeActivate?: AdministrationItemEvent;
  canActivate?: AdministrationItemCanActivateEvent;
  canDeActivate?: AdministrationItemCanActivateEvent;
}

export interface IAdministrationItem extends IAdministrationItemOptions {
  type: AdministrationItemType;
  order: number;
  sub: IAdministrationItemSubItem[];
}
