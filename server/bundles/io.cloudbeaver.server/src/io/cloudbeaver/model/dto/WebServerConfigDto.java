package io.cloudbeaver.model.dto;

import io.cloudbeaver.model.WebProductInfo;
import io.cloudbeaver.model.WebServerConfig;
import io.cloudbeaver.model.WebServerLanguage;
import io.cloudbeaver.model.WebServiceConfig;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.model.meta.Property;
import org.jkiss.dbeaver.model.navigator.DBNBrowseSettings;

import java.util.Map;

public class WebServerConfigDto {

    private final String name;
    private final String version;
    private final String workspaceId;
    private final boolean anonymousAccessEnabled;
    private final boolean supportsCustomConnections;
    private final boolean publicCredentialsSaveEnabled;
    private final boolean adminCredentialsSaveEnabled;
    private final boolean licenseRequired;
    private Boolean licenseValid;
    private String licenseStatus;
    private final boolean configurationMode;
    private final boolean developmentMode;
    private final boolean resourceManagerEnabled;
    private final boolean secretManagerEnabled;
    private final String[] enabledFeatures;
    @Nullable
    private final String[] disabledBetaFeatures;
    @NotNull
    private final String[] serverFeatures;
    private final WebServerLanguage[] supportedLanguages;
    private final WebServiceConfig[] services;
    private final Map<String, Object> productConfiguration;
    private final DBNBrowseSettings defaultNavigatorSettings;
    private final Map<String, Object> resourceQuotas;
    private WebProductInfo productInfo;
    private String[] disabledDrivers;
    private final Boolean distributed;

    public WebServerConfigDto(WebServerConfig config) {
        this.name = config.getName();
        this.version = config.getVersion();
        this.workspaceId = config.getWorkspaceId();
        this.anonymousAccessEnabled = config.isAnonymousAccessEnabled();
        this.supportsCustomConnections = config.isSupportsCustomConnections();
        this.publicCredentialsSaveEnabled = config.isPublicCredentialsSaveEnabled();
        this.adminCredentialsSaveEnabled = config.isAdminCredentialsSaveEnabled();
        this.licenseRequired = config.isLicenseRequired();
        this.licenseValid = config.isLicenseValid();
        this.licenseStatus = config.getLicenseStatus();
        this.configurationMode = config.isConfigurationMode();
        this.developmentMode = config.isDevelopmentMode();
        this.resourceManagerEnabled = config.isResourceManagerEnabled();
        this.secretManagerEnabled = config.isSecretManagerEnabled();
        this.enabledFeatures = config.getEnabledFeatures();
        this.disabledBetaFeatures = config.getDisabledBetaFeatures();
        this.serverFeatures = config.getServerFeatures();
        this.supportedLanguages = config.getSupportedLanguages();
        this.services = config.getServices();
        this.productConfiguration = config.getProductConfiguration();
        this.defaultNavigatorSettings = config.getDefaultNavigatorSettings();
        this.resourceQuotas = config.getResourceQuotas();
        this.productInfo = config.getProductInfo();
        this.disabledDrivers = config.getDisabledDrivers();
        this.distributed = config.isDistributed();
    }

    @Property
    public String getName() {
        return name;
    }

    @Property
    public String getVersion() {
        return version;
    }

    @Property
    public String getWorkspaceId() {
        return workspaceId;
    }

    @Property
    public boolean isAnonymousAccessEnabled() {
        return anonymousAccessEnabled;
    }

    @Property
    public boolean isSupportsCustomConnections() {
        return supportsCustomConnections;
    }

    @Property
    public boolean isPublicCredentialsSaveEnabled() {
        return publicCredentialsSaveEnabled;
    }

    @Property
    public boolean isAdminCredentialsSaveEnabled() {
        return adminCredentialsSaveEnabled;
    }

    @Property
    public boolean isLicenseRequired() {
        return licenseRequired;
    }

    @Property
    public Boolean isLicenseValid() {
        return licenseValid;
    }

    @Property
    public String getLicenseStatus() {
        return licenseStatus;
    }

    @Property
    public boolean isConfigurationMode() {
        return configurationMode;
    }

    @Property
    public boolean isDevelopmentMode() {
        return developmentMode;
    }

    @Property
    public boolean isResourceManagerEnabled() {
        return resourceManagerEnabled;
    }

    @Property
    public boolean isSecretManagerEnabled() {
        return secretManagerEnabled;
    }

    @Property
    public String[] getEnabledFeatures() {
        return enabledFeatures;
    }

    @Property
    @Nullable
    public String[] getDisabledBetaFeatures() {
        return disabledBetaFeatures;
    }

    @Property
    @NotNull
    public String[] getServerFeatures() {
        return serverFeatures;
    }

    @Property
    public WebServerLanguage[] getSupportedLanguages() {
        return supportedLanguages;
    }

    @Property
    public WebServiceConfig[] getServices() {
        return services;
    }

    @Property
    public Map<String, Object> getProductConfiguration() {
        return productConfiguration;
    }

    @Property
    public DBNBrowseSettings getDefaultNavigatorSettings() {
        return defaultNavigatorSettings;
    }

    @Property
    public Map<String, Object> getResourceQuotas() {
        return resourceQuotas;
    }

    @Property
    public WebProductInfo getProductInfo() {
        return productInfo;
    }

    @Property
    public String[] getDisabledDrivers() {
        return disabledDrivers;
    }

    @Property
    public Boolean isDistributed() {
        return distributed;
    }

    public void setDisabledDrivers(String[] disabledDrivers) {
        this.disabledDrivers = disabledDrivers;
    }

    public void setLicenseStatus(String licenseStatus) {
        this.licenseStatus = licenseStatus;
    }

    public void setLicenseValid(Boolean licenseValid) {
        this.licenseValid = licenseValid;
    }

    public void setProductInfo(WebProductInfo productInfo){
        this.productInfo = productInfo;
    }

}
