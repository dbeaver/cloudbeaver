package io.cloudbeaver.service.ldap.auth;

import org.jkiss.code.NotNull;
import org.jkiss.code.Nullable;

import javax.naming.InvalidNameException;
import javax.naming.ldap.LdapName;

public class LdapUtils {

    public static boolean isFullDN(@Nullable String dn, @NotNull String baseDN) {
        if (dn == null) {
            return false;
        }
        String dnTrimmed = dn.trim();
        if (dnTrimmed.isEmpty()) {
            return false;
        }
        String baseTrimmed = baseDN.trim();

        try {
            LdapName dnName = new LdapName(dnTrimmed);
            LdapName baseName = new LdapName(baseTrimmed);
            return dnName.startsWith(baseName);
        } catch (InvalidNameException e) {
            return false;
        }
    }
}
