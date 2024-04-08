#!/bin/bash

validate_missed_license() {
    local TEXT="$1"
    local FILES_PATH="$2"
    TEXT=$(echo "$TEXT" | tr '\n' '\0' | xargs -0 -n1)
    STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep -E "$FILES_PATH" || true)
    HAS_FILES_WITHOUT_LICENSE=false

    for FILE in $STAGED_FILES; do
        if ! grep -Fxq "$TEXT" "$FILE"; then
            HAS_FILES_WITHOUT_LICENSE=true
            git restore --staged "$FILE"
        fi
    done

    if [ "$HAS_FILES_WITHOUT_LICENSE" = true ]; then
        echo "Found files without license header. Please add license to all unstaged files."
        exit 1
    fi
}