
import os

directory = r'c:\Projects\Sun Glade\Loan\web'

files_to_update = [
    "admin-vs-user.html",
    "api-test.html",
    "contact.html",
    "cookies.html",
    "debug-comments.html",
    "debug-dropdown.html",
    "eligibility.html",
    "faq.html",
    "privacy-policy.html",
    "signup.html",
    "terms-conditions.html",
    "test-admin-system.html",
    "test-comment-display.html",
    "test-comments.html",
    "test-dropdown.html",
    "test-sync.html",
    "video-test.html"
]

link_tag = '    <link href="assets/css/main.css" rel="stylesheet" />\n'

for filename in files_to_update:
    filepath = os.path.join(directory, filename)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if "</head>" in content and "assets/css/main.css" not in content:
            new_content = content.replace("</head>", link_tag + "</head>")
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filename}")
        else:
             print(f"Skipped {filename} (no head tag or already has link)")
