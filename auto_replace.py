import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Matches class prefix and the color variable syntax
    # e.g., text-(--color-xuanpaper) -> text-xuanpaper
    # e.g., border-(--color-gold-line) -> border-gold-line
    # e.g., hover:bg-(--color-xuangray) -> hover:bg-xuangray
    new_content = re.sub(r'([a-z:]*-)\(--color-([a-zA-Z0-9-]+)\)', r'\1\2', content)
    
    # Also handle bare --color- values that might be inside focus:border-(--color-gold-light)
    new_content = re.sub(r'focus:border-\(--color-([a-zA-Z0-9-]+)\)', r'focus:border-\1', new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('src'):
    for f in files:
        if f.endswith(('.tsx', '.ts')):
            process_file(os.path.join(root, f))
print('Processing complete.')
