ALTER TABLE {table_prefix}CB_USER_SECRETS
    ADD ENCODING_TYPE VARCHAR(32) DEFAULT 'PLAINTEXT' NOT NULL;