${dbeaver-product}

${dbeaver-version}

README

Thank you for downloading ${dbeaver-product}!

Running server
========================
  1. View and modify server configuration before the first start.
     Validate init-data.conf - you won't be able to change these parameters after the first server start.
  2. Execute run-server.sh script in the root directory.

Command line parameters
========================

  -web-config <conf-file>
    Set path to the configuration file. It is in the local "conf" folder by default

  -nl locale
    Use specified locale instead of default one.
    Example: -nl en (use English locale).

  -vm <java vm path>
    Use Java VM installed in <java vm path> folder instead of default
    location.

  -vmargs <jvm parameters>
    Allows to pass any number of additional parameters to JVM.
    Additional parameters may be used to customize environment or
    3-rd party jdbc drivers.

License
==========================
  Apache License 2 (http://www.apache.org/licenses/LICENSE-2.0)

Web
==========
  Main web site: http://cloudbeaver.io
  Source code: https://github.com/dbeaver/cloudbeaver
  Issue tracker: https://github.com/dbeaver/cloudbeaver/issues

  Please use out issue tracker for technical support, feature suggestions and any other questions
