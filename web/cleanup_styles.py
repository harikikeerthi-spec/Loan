
import os
import re

directory = r'c:\Projects\Sun Glade\Loan\web'

# CSS block to remove (approximate content for Dropdown Styles)
# We will match from "/* Dropdown Navigation Styles */" down to the end of the toggle style.
dropdown_regex = re.compile(r'\s*/\* Dropdown Navigation Styles \*/[\s\S]*?\.nav-dropdown:hover \.nav-dropdown-toggle \.material-symbols-outlined \{\s*transform: rotate\(180deg\);\s*\}\s*', re.MULTILINE)

# CSS block for dropFromTop animation
drop_animation_regex = re.compile(r'\s*/\* Drop from top animation[\s\S]*?\.drop-from-top \{\s*animation:.*\}\s*', re.MULTILINE)

# CSS block for glass-card (exact match of the common version)
glass_card_regex = re.compile(r'\s*\.glass-card \{\s*background: rgba\(255, 255, 255, 0.8\);[\s\S]*?\.dark \.glass-card \{\s*background: rgba\(25, 15, 35, 0.7\);[\s\S]*?\}\s*', re.MULTILINE)

# CSS block for nav-scrolled (simple version)
nav_scrolled_regex = re.compile(r'\s*\.nav-scrolled \{\s*background: rgba\(17, 8, 26, 0.95\) !important;[\s\S]*?\.dark \.nav-scrolled \{\s*background: rgba\(17, 8, 26, 0.8\) !important;\s*\}\s*', re.MULTILINE)

count = 0

for filename in os.listdir(directory):
    if filename.endswith(".html"):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Remove Dropdown Styles
        if "/* Dropdown Navigation Styles */" in content:
            content = dropdown_regex.sub('\n', content)
            
        # Remove Drop Animation
        if "/* Drop from top animation" in content:
            content = drop_animation_regex.sub('\n', content)
            
        # Remove Glass Card
        if ".glass-card {" in content:
            content = glass_card_regex.sub('\n', content)
            
        # Remove Nav Scrolled (base)
        if ".nav-scrolled {" in content:
             content = nav_scrolled_regex.sub('\n', content)

        if content != original_content:
            print(f"Updating {filename}")
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            count += 1

print(f"Updated {count} files.")
