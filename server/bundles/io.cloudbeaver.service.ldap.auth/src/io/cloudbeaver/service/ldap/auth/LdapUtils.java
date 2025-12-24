package io.cloudbeaver.service.ldap.auth;

import org.jkiss.code.Nullable;

import javax.naming.InvalidNameException;
import javax.naming.ldap.LdapName;
import javax.naming.ldap.Rdn;

public class LdapUtils {

    public static boolean isFullDN(@Nullable String value) {
        if (value == null) {
            return false;
        }
        String s = value.trim();
        if (s.isEmpty()) {
            return false;
        }

        try {
            LdapName dn = new LdapName(s);
            if (dn.isEmpty()) {
                return false;
            }
            Rdn last = dn.getRdn(0);
            return "dc".equalsIgnoreCase(last.getType());
        } catch (InvalidNameException e) {
            return false;
        }
    }
}
