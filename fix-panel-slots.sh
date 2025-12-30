#!/bin/bash

# Fix panel slots from Vue 2 to Vue 3 syntax
# This script handles the most common patterns

cd src

echo "Converting panel slots..."

# Find all .vue files and process them
find . -name "*.vue" -type f | while read file; do
    # Pattern 1: <div slot="content" ...> -> <template #content><div ...>
    # Using perl for multi-line replacements
    perl -i -pe 's/<div slot="content"([^>]*)>/<template #content>\n\t\t\t<div$1>/g' "$file"

    # Pattern 2: </div> after content slot -> </div></template>
    # This is tricky - we need to be careful

    # Pattern 3: <chat slot="content" -> <template #content><chat
    perl -i -pe 's/<chat slot="content"([^>]*)>/<template #content>\n\t\t\t<chat$1>/g' "$file"

    # Pattern 4: Any other tag with slot="content"
    perl -i -pe 's/<(\w+) slot="content"([^>]*)>/<template #content>\n\t\t\t<$1$2>/g' "$file"

    # Pattern 5: Fix closing tags - find </panel> and add </template> before if needed
    # This requires more complex logic - skip for now
done

echo "Done! Please review the changes."
