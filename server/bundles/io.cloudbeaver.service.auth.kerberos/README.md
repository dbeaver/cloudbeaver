# Kerberos constrained delegation for Oracle

This bundle adds the `oracle_kerberos_delegated` authentication model. A connection that uses it
runs in the database as the signed-in CloudBeaver user, without storing any database credentials:

1. CloudBeaver logs in to Kerberos with its own service principal and keytab.
2. On every connection it obtains a ticket for the signed-in user through S4U2Self
   (`com.sun.security.jgss.ExtendedGSSCredential#impersonate`).
3. The Oracle thin driver receives that credential through `OracleConnectionBuilder.gssCredential`
   and performs S4U2Proxy to the database service principal while opening the connection.

Steps 2 and 3 are implemented by the JDK and the Oracle driver. The bundle only maps the
web user to a Kerberos principal and wires the credential into the connection.

## Server configuration

Add a `kerberos-delegation` entry under `app.plugins` in `cloudbeaver.conf`:

```
app: {
    plugins: {
        "kerberos-delegation": {
            servicePrincipal: "HTTP/cloudbeaver.corp.example.com@CORP.EXAMPLE.COM",
            keytab: "/opt/cloudbeaver/conf/cloudbeaver.keytab",
            krb5Conf: "/opt/cloudbeaver/conf/krb5.conf",
            realm: "CORP.EXAMPLE.COM",
            userPrincipalTemplate: "${userLocalPart}@${realm}"
        }
    }
}
```

| Property | Required | Meaning |
| --- | --- | --- |
| `servicePrincipal` | yes | Kerberos principal of the CloudBeaver service account. |
| `keytab` | yes | Keytab file with that principal's key, readable by the server process. |
| `krb5Conf` | no | Kerberos configuration file. Sets `java.security.krb5.conf` for the server JVM. |
| `realm` | no | Realm of user principals. Defaults to the realm of `servicePrincipal`. |
| `userPrincipalTemplate` | no | How the CloudBeaver user id becomes a principal. Placeholders: `${userId}`, `${userLocalPart}` (user id without `DOMAIN\` prefix or `@domain` suffix), `${realm}`. Default `${userLocalPart}@${realm}`. |
| `userPrincipalMetaParameter` | no | Name of a user meta parameter that already holds the principal (for example one filled from LDAP `userPrincipalName`). Takes precedence over the template. |
| `debug` | no | Enables `Krb5LoginModule` debug output. |

The principal is always derived from the authenticated session and this configuration.
Users cannot choose the principal in the connection dialog.

## Active Directory prerequisites

* Register the service principal name on the CloudBeaver service account and export its keytab
  (`setspn`, `ktpass`).
* Enable protocol transition for the service account: *Trust this user for delegation to specified
  services only* with *Use any authentication protocol*, and list the Oracle service principal
  (`oracle/<db-host>@<REALM>`) in `msDS-AllowedToDelegateTo`.
* Database users must not be marked *Account is sensitive and cannot be delegated* and must not be
  members of *Protected Users*.

## Oracle prerequisites

* Oracle JDBC thin driver 19c or newer (the bundled driver qualifies).
* Database configured for Kerberos with an Active Directory KDC:
  `SQLNET.AUTHENTICATION_SERVICES=(BEQ,KERBEROS5)`, `SQLNET.KERBEROS5_CONF_MIT=TRUE`,
  a keytab created with `okcreate`, and externally identified users
  (`CREATE USER ... IDENTIFIED EXTERNALLY AS 'jdoe@CORP.EXAMPLE.COM'`).
* TCPS works as usual: use URL mode with `jdbc:oracle:thin:@tcps://host:2484/service` and the
  trust store or wallet driver properties. Kerberos authenticates the user, TLS protects the transport.

## Verifying a deployment

Connect once with the model and check `V$SESSION`:

```sql
SELECT username, authentication_type, osuser FROM v$session WHERE sid = SYS_CONTEXT('USERENV', 'SID');
```

`authentication_type` must be `KERBEROS` and `username` the delegated user. If the server reports
*Kerberos service login failed*, check the keytab and `krb5Conf`. If it reports
*Cannot obtain delegated Kerberos credentials*, check the delegation settings on the service account.
