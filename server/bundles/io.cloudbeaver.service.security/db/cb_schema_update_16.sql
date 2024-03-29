CREATE TABLE {table_prefix}CB_SUBJECT_SECRETS
(
    SUBJECT_ID                     VARCHAR(128) NOT NULL,
    SECRET_ID                      VARCHAR(255) NOT NULL,

    PROJECT_ID                     VARCHAR(128),
    OBJECT_TYPE                    VARCHAR(32),
    OBJECT_ID                      VARCHAR(128),

    SECRET_VALUE                   TEXT NOT NULL,

    ENCODING_TYPE                  VARCHAR(32) DEFAULT 'PLAINTEXT' NOT NULL,
    CREATE_TIME                    TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UPDATE_TIME                    TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    PRIMARY KEY (SUBJECT_ID, SECRET_ID),
    FOREIGN KEY (SUBJECT_ID) REFERENCES {table_prefix}CB_AUTH_SUBJECT (SUBJECT_ID) ON DELETE CASCADE
    );

CREATE INDEX IDX_SUBJECT_SECRETS_PROJECT ON {table_prefix}CB_SUBJECT_SECRETS (PROJECT_ID,SUBJECT_ID);
CREATE INDEX IDX_SUBJECT_SECRETS_OBJECT ON {table_prefix}CB_SUBJECT_SECRETS (PROJECT_ID,OBJECT_TYPE,OBJECT_ID);

INSERT INTO {table_prefix}CB_SUBJECT_SECRETS (SUBJECT_ID, SECRET_ID, SECRET_VALUE, ENCODING_TYPE, CREATE_TIME, UPDATE_TIME)
SELECT USER_ID, SECRET_ID, SECRET_VALUE, ENCODING_TYPE, UPDATE_TIME, UPDATE_TIME FROM {table_prefix}CB_USER_SECRETS;

DROP TABLE {table_prefix}CB_USER_SECRETS;

ALTER TABLE {table_prefix}CB_AUTH_SUBJECT
    ADD IS_SECRET_STORAGE CHAR(1) DEFAULT 'Y' NOT NULL;