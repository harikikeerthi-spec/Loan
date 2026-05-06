import re
import os

with open('web/onboarding.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract CSS
css_match = re.search(r'<style>(.*?)</style>', html, re.DOTALL)
css = css_match.group(1) if css_match else ''

# Extract JS
scripts = re.findall(r'<script>(.*?)</script>', html, re.DOTALL)
js = scripts[-1] if scripts else ''

# Extract Body content
body_match = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL)
body = body_match.group(1) if body_match else ''

# Remove script tags from body
body = re.sub(r'<script.*?</script>', '', body, flags=re.DOTALL)

# Convert HTML to JSX
body = body.replace('class=', 'className=')
body = body.replace('for=', 'htmlFor=')
body = body.replace('<!--', '{/*')
body = body.replace('-->', '*/}')
body = re.sub(r'<img([^>]+)>', r'<img\1 />', body)
body = re.sub(r'<input([^>]+)>', r'<input\1 />', body)
body = re.sub(r'<br([^>]*)>', r'<br\1 />', body)
body = re.sub(r'<hr([^>]*)>', r'<hr\1 />', body)
body = body.replace('style="width: 0%"', 'style={{ width: "0%" }}')
body = body.replace('style="display: none;"', 'style={{ display: "none" }}')
body = body.replace('onclick=', 'onClick=')

# Write to a new file to inspect
with open('frontend/app/(public)/onboarding/page.tsx.new', 'w', encoding='utf-8') as f:
    f.write('\"use client\";\n')
    f.write('import { useEffect } from "react";\n')
    f.write('import "./onboarding.css";\n\n')
    f.write('export default function OnboardingPage() {\n')
    f.write('    useEffect(() => {\n')
    f.write(js)
    f.write('    }, []);\n\n')
    f.write('    return (\n')
    f.write('        <div className="onboarding-container">\n')
    f.write(body)
    f.write('        </div>\n')
    f.write('    );\n')
    f.write('}\n')

with open('frontend/app/(public)/onboarding/onboarding.css', 'w', encoding='utf-8') as f:
    f.write(css)

print('Done')
