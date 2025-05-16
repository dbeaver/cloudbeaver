/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import 'reflect-metadata';

import { bootstrap } from '@cloudbeaver/core-bootstrap';
import type { PluginManifest } from '@cloudbeaver/core-di';
import administration from '@cloudbeaver/plugin-administration';
import appLogoPlugin from '@cloudbeaver/plugin-app-logo';
import appLogoPluginAdministration from '@cloudbeaver/plugin-app-logo-administration';
import authentication from '@cloudbeaver/plugin-authentication';
import authenticationAdministration from '@cloudbeaver/plugin-authentication-administration';
import { browserPlugin } from '@cloudbeaver/plugin-browser';
import connectionCustom from '@cloudbeaver/plugin-connection-custom';
import connectionSearch from '@cloudbeaver/plugin-connection-search';
import { objectViewerNavTreeLinkPlugin } from '@cloudbeaver/plugin-object-viewer-nav-tree-link';
import connectionPlugin from '@cloudbeaver/plugin-connections';
import connectionAdministration from '@cloudbeaver/plugin-connections-administration';
import { dataExportManifest } from '@cloudbeaver/plugin-data-export';
import { dataGridPlugin } from '@cloudbeaver/plugin-data-grid';
import { dataImportPluginManifest } from '@cloudbeaver/plugin-data-import';
import { dataSpreadsheetNewManifest } from '@cloudbeaver/plugin-data-spreadsheet-new';
import { dataViewerManifest } from '@cloudbeaver/plugin-data-viewer';
import { dvResultSetGroupingPlugin } from '@cloudbeaver/plugin-data-viewer-result-set-grouping';
import { dataViewerResultTraceDetailsPlugin } from '@cloudbeaver/plugin-data-viewer-result-trace-details';
import { datasourceContextSwitchPluginManifest } from '@cloudbeaver/plugin-datasource-context-switch';
import { datasourceTransactionManagerPlugin } from '@cloudbeaver/plugin-datasource-transaction-manager';
import ddlViewer from '@cloudbeaver/plugin-ddl-viewer';
import devTools from '@cloudbeaver/plugin-devtools';
import gisViewer from '@cloudbeaver/plugin-gis-viewer';
import help from '@cloudbeaver/plugin-help';
import holidaysPlugin from '@cloudbeaver/plugin-holidays';
import holidaysPluginAdministration from '@cloudbeaver/plugin-holidays-administration';
import localization from '@cloudbeaver/plugin-localization';
import logViewer from '@cloudbeaver/plugin-log-viewer';
import { navigationTabsPlugin } from '@cloudbeaver/plugin-navigation-tabs';
import { navigationTreePlugin } from '@cloudbeaver/plugin-navigation-tree';
import navigationTreeFilters from '@cloudbeaver/plugin-navigation-tree-filters';
import { navigationTreeRMPlugin } from '@cloudbeaver/plugin-navigation-tree-rm';
import { objectViewerManifest } from '@cloudbeaver/plugin-object-viewer';
import productPlugin from '@cloudbeaver/plugin-product';
import { productInformationPlugin } from '@cloudbeaver/plugin-product-information-administration';
import projects from '@cloudbeaver/plugin-projects';
import resourceManager from '@cloudbeaver/plugin-resource-manager';
import resourceManagerAdministration from '@cloudbeaver/plugin-resource-manager-administration';
import resourceManagerScripts from '@cloudbeaver/plugin-resource-manager-scripts';
import root from '@cloudbeaver/plugin-root';
import { sessionExpirationPlugin } from '@cloudbeaver/plugin-session-expiration';
import { settingsAdministrationPlugin } from '@cloudbeaver/plugin-settings-administration';
import settingsMenu from '@cloudbeaver/plugin-settings-menu';
import settingsMenuAdministration from '@cloudbeaver/plugin-settings-menu-administration';
import settingsPanelPlugin from '@cloudbeaver/plugin-settings-panel';
import sqlEditor from '@cloudbeaver/plugin-sql-editor';
import sqlEditorTab from '@cloudbeaver/plugin-sql-editor-navigation-tab';
import sqlEditorResource from '@cloudbeaver/plugin-sql-editor-navigation-tab-script';
import sqlEditorNew from '@cloudbeaver/plugin-sql-editor-new';
import sqlEditorScreen from '@cloudbeaver/plugin-sql-editor-screen';
import { sqlGeneratorPlugin } from '@cloudbeaver/plugin-sql-generator';
import { ssoPlugin } from '@cloudbeaver/plugin-sso';
import { taskManagerPluginManifest } from '@cloudbeaver/plugin-task-manager';
import theme from '@cloudbeaver/plugin-theme';
import toolsPanel from '@cloudbeaver/plugin-tools-panel';
import topAppBar from '@cloudbeaver/plugin-top-app-bar';
import { administrationTopAppBarPlugin } from '@cloudbeaver/plugin-top-app-bar-administration';
import userProfile from '@cloudbeaver/plugin-user-profile';
import userProfileAdministration from '@cloudbeaver/plugin-user-profile-administration';
import { userProfileSettingsPlugin } from '@cloudbeaver/plugin-user-profile-settings';
import version from '@cloudbeaver/plugin-version';
import versionUpdate from '@cloudbeaver/plugin-version-update-administration';
import { pluginSystemInformationAdministrationManifest } from '@cloudbeaver/plugin-system-information-administration';
import { pluginSettingsDefaultAdministrationManifest } from '@cloudbeaver/plugin-settings-default-administration';

import { defaultProductManifest } from './manifest.js';

const PLUGINS: PluginManifest[] = [
  ssoPlugin,
  devTools,
  productInformationPlugin,
  administration,
  dataSpreadsheetNewManifest,
  dataGridPlugin,
  authentication,
  authenticationAdministration,
  theme,
  localization,
  connectionCustom,
  connectionSearch,
  dataExportManifest,
  dataImportPluginManifest,
  dataViewerManifest,
  dataViewerResultTraceDetailsPlugin,
  dvResultSetGroupingPlugin,
  gisViewer,
  ddlViewer,
  objectViewerManifest,
  sqlEditor,
  sqlEditorTab,
  sqlEditorScreen,
  sqlEditorNew,
  sqlGeneratorPlugin,
  userProfile,
  userProfileAdministration,
  objectViewerNavTreeLinkPlugin,
  connectionPlugin,
  connectionAdministration,
  versionUpdate,
  productPlugin,
  settingsMenu,
  settingsMenuAdministration,
  settingsPanelPlugin,
  help,
  resourceManager,
  resourceManagerAdministration,
  resourceManagerScripts,
  sqlEditorResource,
  logViewer,
  navigationTreePlugin,
  navigationTreeRMPlugin,
  datasourceContextSwitchPluginManifest,
  topAppBar,
  administrationTopAppBarPlugin,
  version,
  navigationTabsPlugin,
  root,
  sessionExpirationPlugin,
  toolsPanel,
  datasourceTransactionManagerPlugin,
  projects,
  browserPlugin,
  navigationTreeFilters,
  taskManagerPluginManifest,
  settingsAdministrationPlugin,
  userProfileSettingsPlugin,
  holidaysPlugin,
  holidaysPluginAdministration,
  appLogoPlugin,
  appLogoPluginAdministration,
  pluginSystemInformationAdministrationManifest,
  pluginSettingsDefaultAdministrationManifest,
  // must be las one to override all
  defaultProductManifest,
];

bootstrap(PLUGINS);
