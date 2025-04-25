/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.cloudbeaver.registry;

import org.eclipse.core.runtime.IConfigurationElement;
import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;
import org.jkiss.dbeaver.DBException;
import org.jkiss.dbeaver.Log;
import org.jkiss.dbeaver.model.DBPImage;
import org.jkiss.dbeaver.model.auth.AuthPropertyDescriptor;
import org.jkiss.dbeaver.model.auth.SMAuthProvider;
import org.jkiss.dbeaver.model.impl.AbstractDescriptor;
import org.jkiss.dbeaver.model.impl.PropertyDescriptor;
import org.jkiss.dbeaver.model.preferences.DBPPropertyDescriptor;
import org.jkiss.dbeaver.model.security.SMAuthCredentialsProfile;
import org.jkiss.dbeaver.model.security.SMAuthProviderDescriptor;
import org.jkiss.dbeaver.model.security.SMSubjectType;
import org.jkiss.utils.ArrayUtils;
import org.jkiss.utils.CommonUtils;

import java.util.*;

/**
 * Auth provider descriptor
 */
public class WebAuthProviderDescriptor extends AbstractDescriptor {

    public static final String EXTENSION_ID = "org.jkiss.dbeaver.auth.provider"; //$NON-NLS-1$
    private static final Log log = Log.getLog(WebAuthProviderDescriptor.class);

    private final IConfigurationElement cfg;

    private ObjectType implType;
    private final Map<SMSubjectType, List<DBPPropertyDescriptor>> metaParameters = new HashMap<>();
    private SMAuthProvider<?> instance;
    private final DBPImage icon;
    private final Map<String, WebAuthProviderProperty> configurationParameters = new LinkedHashMap<>();
    private final List<SMAuthCredentialsProfile> credentialProfiles = new ArrayList<>();
    private final boolean configurable;
    private final boolean trusted;
    private final boolean isPrivate;
    private final boolean isAuthHidden;
    private final boolean isCaseInsensitive;
    private final boolean serviceProvider;
    private final String[] requiredFeatures;
    private final boolean isRequired;
    private String[] types;

    public WebAuthProviderDescriptor(IConfigurationElement cfg) {
        super(cfg);
        this.cfg = cfg;
        this.implType = new ObjectType(cfg, WebRegistryConstant.ATTR_CLASS);
        this.icon = iconToImage(cfg.getAttribute(WebRegistryConstant.ATTR_ICON));
        this.configurable = CommonUtils.toBoolean(cfg.getAttribute(WebRegistryConstant.ATTR_CONFIGURABLE));
        this.trusted = CommonUtils.toBoolean(cfg.getAttribute(WebRegistryConstant.ATTR_TRUSTED));
        this.isPrivate = CommonUtils.toBoolean(cfg.getAttribute(WebRegistryConstant.ATTR_PRIVATE));
        this.isRequired = CommonUtils.toBoolean(cfg.getAttribute(WebRegistryConstant.ATTR_REQUIRED));
        this.isAuthHidden = CommonUtils.toBoolean(cfg.getAttribute(WebRegistryConstant.ATTR_AUTH_HIDDEN));
        this.isCaseInsensitive = CommonUtils.toBoolean(cfg.getAttribute(WebRegistryConstant.ATTR_CASE_INSENSITIVE));
        this.serviceProvider = CommonUtils.toBoolean(cfg.getAttribute(WebRegistryConstant.ATTR_SERVICE_PROVIDER));

        for (IConfigurationElement cfgElement : cfg.getChildren(WebRegistryConstant.TAG_CONFIGURATION)) {
            List<WebAuthProviderProperty> properties = WebAuthProviderRegistry.readProperties(cfgElement, getId());
            for (WebAuthProviderProperty property : properties) {
                configurationParameters.put(CommonUtils.toString(property.getId()), property);
            }
        }
        for (IConfigurationElement credElement : cfg.getChildren(WebRegistryConstant.TAG_CREDENTIALS)) {
            credentialProfiles.add(new SMAuthCredentialsProfile(credElement));
        }
        for (IConfigurationElement mpElement : cfg.getChildren(WebRegistryConstant.TAG_META_PARAMETERS)) {
            SMSubjectType subjectType = CommonUtils.valueOf(SMSubjectType.class, mpElement.getAttribute("type"), SMSubjectType.user);
            List<DBPPropertyDescriptor> metaProps = new ArrayList<>();
            for (IConfigurationElement propGroup : ArrayUtils.safeArray(mpElement.getChildren(PropertyDescriptor.TAG_PROPERTY_GROUP))) {
                metaProps.addAll(PropertyDescriptor.extractProperties(propGroup));
            }
            metaParameters.put(subjectType, metaProps);
        }

        String rfList = cfg.getAttribute(WebRegistryConstant.ATTR_REQUIRED_FEATURES);
        requiredFeatures = CommonUtils.isEmpty(rfList) ? null : rfList.split(",");

        String typesAttr = cfg.getAttribute(WebRegistryConstant.ATTR_CATEGORIES);
        this.types = CommonUtils.isEmpty(typesAttr) ? new String[0] : typesAttr.split(",");
    }

    @NotNull
    public String getId() {
        return cfg.getAttribute(WebRegistryConstant.ATTR_ID);
    }

    public String getLabel() {
        return cfg.getAttribute(WebRegistryConstant.ATTR_LABEL);
    }

    public String getDescription() {
        return cfg.getAttribute(WebRegistryConstant.ATTR_DESCRIPTION);
    }

    public DBPImage getIcon() {
        return icon;
    }

    public boolean isConfigurable() {
        return configurable;
    }

    public boolean isTrusted() {
        return trusted;
    }

    public boolean isPrivate() {
        return isPrivate;
    }

    public boolean isRequired() {
        return isRequired;
    }

    public boolean isAuthHidden() {
        return isAuthHidden;
    }

    public boolean isCaseInsensitive() {
        return isCaseInsensitive;
    }

    public List<WebAuthProviderProperty> getConfigurationParameters() {
        return new ArrayList<>(configurationParameters.values());
    }

    public List<SMAuthCredentialsProfile> getCredentialProfiles() {
        return new ArrayList<>(credentialProfiles);
    }

    public List<AuthPropertyDescriptor> getCredentialParameters(String[] propNames) {
        if (credentialProfiles.size() > 1) {
            for (SMAuthCredentialsProfile profile : credentialProfiles) {
                if (profile.getCredentialParameters().size() == propNames.length) {
                    boolean matches = true;
                    for (String paramName : propNames) {
                        if (profile.getCredentialParameter(paramName) == null) {
                            matches = false;
                            break;
                        }
                    }
                    if (matches) {
                        return profile.getCredentialParameters();
                    }
                }
            }
        }
        return credentialProfiles.get(0).getCredentialParameters();
    }

    @NotNull
    public SMAuthProvider<?> getInstance() {
        if (instance == null) {
            try {
                instance = implType.createInstance(SMAuthProvider.class);
            } catch (DBException e) {
                throw new IllegalStateException("Can not instantiate auth provider '" + implType.getImplName() + "'", e);
            }
        }
        return instance;
    }

    public String[] getRequiredFeatures() {
        return requiredFeatures;
    }

    @Override
    public String toString() {
        return getId();
    }

    public SMAuthProviderDescriptor createDescriptorBean() {
        SMAuthProviderDescriptor smInfo = new SMAuthProviderDescriptor();
        smInfo.setId(this.getId());
        smInfo.setLabel(this.getLabel());
        smInfo.setDescription(this.getDescription());
        smInfo.setCredentialProfiles(this.getCredentialProfiles());

        if (this.icon != null) {
            smInfo.setIcon(icon.getLocation());
        }

        return smInfo;
    }

    @Nullable
    public List<DBPPropertyDescriptor> getMetaParameters(SMSubjectType subjectType) {
        return metaParameters.get(subjectType);
    }

    public String[] getTypes() {
        return types;
    }

    public void loadExtraConfig(IConfigurationElement ext) {
        //todo read other props if it needs
        String typesAttr = ext.getAttribute(WebRegistryConstant.ATTR_CATEGORIES);
        this.types = CommonUtils.isEmpty(typesAttr) ? new String[0] : typesAttr.split(",");
        this.implType = new ObjectType(ext, WebRegistryConstant.ATTR_CLASS);
        for (IConfigurationElement cfgElement : ext.getChildren(WebRegistryConstant.TAG_CONFIGURATION)) {
            List<WebAuthProviderProperty> properties = WebAuthProviderRegistry.readProperties(cfgElement, getId());
            for (WebAuthProviderProperty property : properties) {
                configurationParameters.put(CommonUtils.toString(property.getId()), property);
            }
        }
        replaceContributor(ext.getContributor());
    }

    public boolean isServiceProvider() {
        return serviceProvider;
    }
}
