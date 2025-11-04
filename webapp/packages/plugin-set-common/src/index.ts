/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import coreAdministration from '@cloudbeaver/core-administration/module';
import coreApp from '@cloudbeaver/core-app/module';
import coreAuthentication from '@cloudbeaver/core-authentication/module';
import coreBlocks from '@cloudbeaver/core-blocks/module';
import coreBrowser from '@cloudbeaver/core-browser/module';
import coreBrowserCookies from '@cloudbeaver/core-browser-cookies/module';
import coreBrowserSettings from '@cloudbeaver/core-browser-settings/module';
import coreClientActivity from '@cloudbeaver/core-client-activity/module';
import coreConnections from '@cloudbeaver/core-connections/module';
import coreDialogs from '@cloudbeaver/core-dialogs/module';
import coreEvents from '@cloudbeaver/core-events/module';
import coreLocalization from '@cloudbeaver/core-localization/module';
import coreNavigationTree from '@cloudbeaver/core-navigation-tree/module';
import coreProduct from '@cloudbeaver/core-product/module';
import coreProjects from '@cloudbeaver/core-projects/module';
import coreResourceManager from '@cloudbeaver/core-resource-manager/module';
import coreRoot from '@cloudbeaver/core-root/module';
import coreRouting from '@cloudbeaver/core-routing/module';
import coreSdk from '@cloudbeaver/core-sdk/module';
import coreServerLocalization from '@cloudbeaver/core-server-localization/module';
import coreSessionLocalization from '@cloudbeaver/core-session-localization/module';
import coreSettings from '@cloudbeaver/core-settings/module';
import coreSettingsLocalization from '@cloudbeaver/core-settings-localization/module';
import coreSettingsUser from '@cloudbeaver/core-settings-user/module';
import coreStorage from '@cloudbeaver/core-storage/module';
import coreTaskManager from '@cloudbeaver/core-task-manager/module';
import coreTheming from '@cloudbeaver/core-theming/module';
import coreUi from '@cloudbeaver/core-ui/module';
import coreVersion from '@cloudbeaver/core-version/module';
import coreVersionUpdate from '@cloudbeaver/core-version-update/module';
import coreView from '@cloudbeaver/core-view/module';
import coreServerNotifications from '@cloudbeaver/core-server-notifications/module';

import pluginAdministration from '@cloudbeaver/plugin-administration/module';
import pluginAppLogo from '@cloudbeaver/plugin-app-logo/module';
import pluginAppLogoAdministration from '@cloudbeaver/plugin-app-logo-administration/module';
import pluginAuthentication from '@cloudbeaver/plugin-authentication/module';
import pluginAuthenticationAdministration from '@cloudbeaver/plugin-authentication-administration/module';
import pluginBrowser from '@cloudbeaver/plugin-browser/module';
import pluginConnectionCustom from '@cloudbeaver/plugin-connection-custom/module';
import pluginConnectionSearch from '@cloudbeaver/plugin-connection-search/module';
import pluginConnections from '@cloudbeaver/plugin-connections/module';
import pluginConnectionsAdministration from '@cloudbeaver/plugin-connections-administration/module';
import pluginDataExport from '@cloudbeaver/plugin-data-export/module';
import pluginDataGrid from '@cloudbeaver/plugin-data-grid/module';
import pluginDataImport from '@cloudbeaver/plugin-data-import/module';
import pluginDataSpreadSheetNew from '@cloudbeaver/plugin-data-spreadsheet-new/module';
import pluginObjectViewerNavTreeLink from '@cloudbeaver/plugin-object-viewer-nav-tree-link/module';
import pluginDataViewer from '@cloudbeaver/plugin-data-viewer/module';
import pluginDataViewerResultSetGrouping from '@cloudbeaver/plugin-data-viewer-result-set-grouping/module';
import pluginDataViewerResultTraceDetails from '@cloudbeaver/plugin-data-viewer-result-trace-details/module';
import pluginDatasourceContextSwitch from '@cloudbeaver/plugin-datasource-context-switch/module';
import pluginDatasourceTransactionManager from '@cloudbeaver/plugin-datasource-transaction-manager/module';
import pluginDdlViewer from '@cloudbeaver/plugin-ddl-viewer/module';
import pluginDevTools from '@cloudbeaver/plugin-devtools/module';
import pluginGisViewer from '@cloudbeaver/plugin-gis-viewer/module';
import pluginHelp from '@cloudbeaver/plugin-help/module';
import pluginHolidays from '@cloudbeaver/plugin-holidays/module';
import pluginHolidaysAdministration from '@cloudbeaver/plugin-holidays-administration/module';
import pluginLocalization from '@cloudbeaver/plugin-localization/module';
import pluginLogViewer from '@cloudbeaver/plugin-log-viewer/module';
import pluginNavigationTabs from '@cloudbeaver/plugin-navigation-tabs/module';
import pluginNavigationTree from '@cloudbeaver/plugin-navigation-tree/module';
import pluginNavigationTreeFilters from '@cloudbeaver/plugin-navigation-tree-filters/module';
import pluginNavigationTreeRm from '@cloudbeaver/plugin-navigation-tree-rm/module';
import pluginObjectViewer from '@cloudbeaver/plugin-object-viewer/module';
import pluginProduct from '@cloudbeaver/plugin-product/module';
import pluginProductInformationAdministration from '@cloudbeaver/plugin-product-information-administration/module';
import pluginProjects from '@cloudbeaver/plugin-projects/module';
import pluginResourceManager from '@cloudbeaver/plugin-resource-manager/module';
import pluginResourceManagerAdministration from '@cloudbeaver/plugin-resource-manager-administration/module';
import pluginResourceManagerScripts from '@cloudbeaver/plugin-resource-manager-scripts/module';
import pluginRoot from '@cloudbeaver/plugin-root/module';
import pluginSessionExpiration from '@cloudbeaver/plugin-session-expiration/module';
import pluginSettingsAdministration from '@cloudbeaver/plugin-settings-administration/module';
import pluginSettingsMenu from '@cloudbeaver/plugin-settings-menu/module';
import pluginSettingsMenuAdministration from '@cloudbeaver/plugin-settings-menu-administration/module';
import pluginSettingsPanel from '@cloudbeaver/plugin-settings-panel/module';
import pluginSqlEditor from '@cloudbeaver/plugin-sql-editor/module';
import pluginSqlEditorNavigationTab from '@cloudbeaver/plugin-sql-editor-navigation-tab/module';
import pluginSqlEditorNavigationTabScript from '@cloudbeaver/plugin-sql-editor-navigation-tab-script/module';
import pluginSqlEditorNew from '@cloudbeaver/plugin-sql-editor-new/module';
import pluginSqlEditorScreen from '@cloudbeaver/plugin-sql-editor-screen/module';
import pluginSqlGenerator from '@cloudbeaver/plugin-sql-generator/module';
import pluginTaskManager from '@cloudbeaver/plugin-task-manager/module';
import pluginTheme from '@cloudbeaver/plugin-theme/module';
import pluginToolsPanel from '@cloudbeaver/plugin-tools-panel/module';
import pluginTopAppBar from '@cloudbeaver/plugin-top-app-bar/module';
import pluginTopAppBarAdministration from '@cloudbeaver/plugin-top-app-bar-administration/module';
import pluginUserProfile from '@cloudbeaver/plugin-user-profile/module';
import pluginUserProfileAdministration from '@cloudbeaver/plugin-user-profile-administration/module';
import pluginUserProfileSettings from '@cloudbeaver/plugin-user-profile-settings/module';
import pluginVersion from '@cloudbeaver/plugin-version/module';
import pluginVersionUpdateAdministration from '@cloudbeaver/plugin-version-update-administration/module';
import pluginSystemInformationAdministration from '@cloudbeaver/plugin-system-information-administration/module';
import pluginSettingsDefaultAdministration from '@cloudbeaver/plugin-settings-default-administration/module';
import pluginCodemirror6 from '@cloudbeaver/plugin-codemirror6/module';
import pluginAsyncTaskConfirmation from '@cloudbeaver/plugin-async-task-confirmation/module';
import pluginSqlAsyncTaskConfirmation from '@cloudbeaver/plugin-sql-async-task-confirmation/module';
import pluginDataViewerConditionalFormatting from '@cloudbeaver/plugin-data-viewer-conditional-formatting/module';

const core = [
  coreRouting, // important, should be first because the router starts in load phase first after all plugins register phase
  coreBrowser,
  coreTheming,
  coreLocalization,
  coreSettingsLocalization,
  coreSessionLocalization,
  coreServerLocalization,
  coreBlocks,
  coreSettings,
  coreStorage,
  coreEvents,
  coreSdk,
  coreRoot,
  coreBrowserSettings,
  coreBrowserCookies,
  coreProduct,
  coreProjects,
  coreAuthentication,
  coreUi,
  coreView,
  coreVersion,
  coreVersionUpdate,
  coreConnections,
  coreAdministration,
  coreDialogs,
  coreResourceManager,
  coreApp,
  coreClientActivity,
  coreNavigationTree,
  coreSettingsUser,
  coreTaskManager,
  coreServerNotifications,
];

export const commonSet = [
  ...core,
  pluginDevTools,
  pluginProductInformationAdministration,
  pluginAdministration,
  pluginDataSpreadSheetNew,
  pluginDataGrid,
  pluginAuthentication,
  pluginAuthenticationAdministration,
  pluginTheme,
  pluginLocalization,
  pluginConnectionCustom,
  pluginConnectionSearch,
  pluginDataExport,
  pluginDataImport,
  pluginDataViewer,
  pluginDataViewerResultTraceDetails,
  pluginDataViewerResultSetGrouping,
  pluginGisViewer,
  pluginDdlViewer,
  pluginObjectViewer,
  pluginSqlEditor,
  pluginSqlEditorNavigationTab,
  pluginSqlEditorScreen,
  pluginSqlEditorNew,
  pluginSqlGenerator,
  pluginUserProfile,
  pluginUserProfileAdministration,
  pluginObjectViewerNavTreeLink,
  pluginConnections,
  pluginConnectionsAdministration,
  pluginVersionUpdateAdministration,
  pluginProduct,
  pluginSettingsMenu,
  pluginSettingsMenuAdministration,
  pluginSettingsPanel,
  pluginHelp,
  pluginResourceManager,
  pluginResourceManagerAdministration,
  pluginResourceManagerScripts,
  pluginSqlEditorNavigationTabScript,
  pluginLogViewer,
  pluginNavigationTree,
  pluginNavigationTreeRm,
  pluginDatasourceContextSwitch,
  pluginTopAppBar,
  pluginTopAppBarAdministration,
  pluginVersion,
  pluginNavigationTabs,
  pluginRoot,
  pluginSessionExpiration,
  pluginToolsPanel,
  pluginDatasourceTransactionManager,
  pluginProjects,
  pluginBrowser,
  pluginNavigationTreeFilters,
  pluginTaskManager,
  pluginSettingsAdministration,
  pluginUserProfileSettings,
  pluginHolidays,
  pluginHolidaysAdministration,
  pluginAppLogo,
  pluginAppLogoAdministration,
  pluginSystemInformationAdministration,
  pluginSettingsDefaultAdministration,
  pluginCodemirror6,
  pluginAsyncTaskConfirmation,
  pluginSqlAsyncTaskConfirmation,
  pluginDataViewerConditionalFormatting,
];
