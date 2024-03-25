#!/bin/bash

add_missed_license() {
    local TEXT="$1"
    local FILES_PATH="$2"
    TEXT=$(echo "$TEXT" | tr '\n' '\0' | xargs -0 -n1)
    FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E "$FILES_PATH" || true)


    for FILE in $FILES; do
        if ! grep -Fxq "$TEXT" "$FILE"; then
            echo "$TEXT\n\n$(cat "$FILE")" > "$FILE"
            git add "$FILE"
        fi
    done
}