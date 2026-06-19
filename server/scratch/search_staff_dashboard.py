import re

file_path = r"c:\Projects\Sun Glade\Loan\frontend\app\staff\dashboard\page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Let's find occurrences of "chat" or similar
matches = []
for i, line in enumerate(content.splitlines(), 1):
    if "chat" in line.lower() or "activeTab" in line:
        matches.append((i, line.strip()))

print(f"Total matches: {len(matches)}")
for idx, line in matches[:100]:
    print(f"L{idx}: {line}")
