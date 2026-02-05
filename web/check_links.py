
import os
import re

directory = r'c:\Projects\Sun Glade\Loan\web'

missing_css = []

for filename in os.listdir(directory):
    if filename.endswith(".html"):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if "main.css" not in content and "components/" not in filename: # skip component partials if they don't need css (usually they are injected into pages that have css)
             missing_css.append(filename)

print("Files missing main.css:")
for f in missing_css:
    print(f)
