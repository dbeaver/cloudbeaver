CREATE TABLE {table_prefix}CB_TASKS
(
    TASK_ID                        VARCHAR(128) NOT NULL,
    CREATE_TIME                    TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    TIMEOUT                        INTEGER NOT NULL,

    PRIMARY KEY (TASK_ID)
);