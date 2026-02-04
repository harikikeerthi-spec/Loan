# Quick Reference Guide

## AI Verification Tool Quick Facts

### What is it?
The AI Verification Tool is an intelligent eligibility checker that evaluates loan applications in real-time and provides personalized feedback to borrowers.

### Location
- **JavaScript**: [web/assets/js/ai-tools.js](web/assets/js/ai-tools.js)
- **Full Documentation**: [AI_VERIFICATION_TOOL.md](AI_VERIFICATION_TOOL.md)

### Key Statistics
- **Score Range**: 0-100
- **Evaluation Factors**: 7 major categories
- **Recommendation Limit**: Up to 4 personalized tips
- **Processing**: Instantaneous (client-side only)

### Three Eligibility Levels
| Level | Score | Coverage | Rate Range |
|-------|-------|----------|------------|
| Likely Eligible | 70-100 | Up to 95% | 8.5% - 10.9% |
| Borderline | 50-69 | Up to 80% | 10.5% - 13.5% |
| Not Likely | 0-49 | Up to 60% | 12.5% - 16.5% |

### Scoring Breakdown
```
Max Points: 100
├─ Age (18-60): 15 points
├─ Credit Score (750+): 25 points
├─ Income-to-Loan Ratio (1.5x+): 20 points
├─ Employment Status (Full-time): 10 points
├─ Collateral: 10 points
├─ Education Level (Doctoral): 7 points
└─ Co-Applicant: 8 points
```

### Affordability Ratio
- **Formula**: Annual Income ÷ Loan Amount
- **Excellent**: 1.5x or higher
- **Good**: 1.0x to 1.49x
- **Moderate**: 0.6x to 0.99x
- **Tight**: Below 0.6x

---

## Navigation Bar Information

### Where It Appears
✓ All 31+ pages in the web directory
- Main pages (index.html, login.html, etc.)
- Test pages (test-*.html)
- Debug pages (debug-*.html)
- API pages (api-test.html)

### Navigation Links
1. **Home**: index.html
2. **About**: about-us.html
3. **How It Works**: how-it-works.html
4. **EMI Calculator**: emi.html
5. **Blog**: blog.html
6. **FAQ**: faq.html
7. **Contact**: contact.html

### User Menu (When Logged In)
- Profile
- Dashboard
- My Applications
- Document Vault
- Help & Support
- Logout

### Styling
- **Primary Color**: #6605c7 (Purple)
- **Framework**: Tailwind CSS
- **Icons**: Material Symbols Outlined
- **Dark Mode**: Fully supported
- **Responsive**: Mobile-friendly

### Navigation HTML Structure
```html
<nav id="mainNav" class="fixed top-0 w-full px-6 py-6 z-50">
  <!-- Logo -->
  <!-- Main Links (hidden on mobile) -->
  <!-- Auth Section (Login/User Profile) -->
</nav>
```

---

## File Locations Reference

### Documentation Files
- [AI_VERIFICATION_TOOL.md](AI_VERIFICATION_TOOL.md) - Complete AI tool guide
- [DOCUMENTATION_SUMMARY.md](DOCUMENTATION_SUMMARY.md) - Overview of all changes
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - This file

### Web Pages (with Navigation)
```
web/
├── index.html (Home)
├── login.html (Login)
├── signup.html (Sign Up)
├── about-us.html
├── how-it-works.html
├── emi.html
├── blog.html
├── faq.html
├── contact.html
├── dashboard.html
├── profile.html
├── my-applications.html
├── vault.html
├── help.html
├── Test & Debug Pages
│   ├── test-comments.html ✓ Updated
│   ├── test-comment-display.html ✓ Updated
│   ├── test-dropdown.html
│   ├── test-sync.html ✓ Updated
│   ├── debug-dropdown.html ✓ Updated
│   ├── debug-comments.html ✓ Updated
│   ├── api-test.html ✓ Updated
│   └── video-test.html
└── assets/
    ├── css/
    │   └── main.css
    └── js/
        ├── ai-tools.js (AI Tool Logic)
        ├── app.js
        ├── auth.js
        ├── blog-api.js
        └── [other utility scripts]
```

---

## Common Tasks

### Adding Navigation to a New Page
1. Copy the `<nav>` element from any existing page
2. Paste it at the beginning of the `<body>` tag
3. Wrap page content in a `<main>` tag
4. Ensure `tailwind.config` is included in the page's `<script>`

### Modifying Navigation Links
1. Edit the `<a>` tags inside the `<nav>` element
2. Update `href` attributes to point to correct pages
3. Modify link text as needed

### Changing AI Tool Scoring
1. Open [web/assets/js/ai-tools.js](web/assets/js/ai-tools.js)
2. Find the `calculateScore()` function
3. Adjust point values for different factors
4. Test with various inputs to verify calculations

### Adding Dark Mode Support
- Navigation already supports dark mode via Tailwind classes
- For custom elements, add `dark:` prefixed classes
- Example: `bg-white dark:bg-zinc-900`

---

## Browser Compatibility

### Supported Browsers
- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Required Features
- ES6 JavaScript support
- CSS Grid & Flexbox
- Fetch API
- LocalStorage (for auth state)

---

## Performance Tips

### Navigation
- Navigation is lightweight and doesn't impact page load
- Uses CSS for styling (no heavy JavaScript)
- Icons load from Google Fonts (cached)

### AI Tool
- All calculations are client-side (no server request)
- Instant feedback (< 100ms)
- Can handle rapid input changes
- No database access needed for basic calculations

---

## Troubleshooting

### Navigation Not Appearing
- Check if `<nav>` element is present in HTML
- Verify `z-index: 50` is applied
- Clear browser cache if styling seems wrong
- Check browser console for JavaScript errors

### AI Tool Not Working
- Verify form input IDs match the script's expectations
- Check if Tailwind CSS is loaded
- Ensure JavaScript is enabled
- Verify all required input elements are present

### Dark Mode Not Working
- Check if dark mode toggle script is loaded
- Verify `dark:` classes are present on elements
- Ensure `darkMode: "class"` in Tailwind config
- Clear browser cache and refresh

---

## Support & Contact

For questions or issues:
1. Check the relevant documentation file
2. Review inline code comments
3. Check browser console for error messages
4. Verify file paths and element IDs
5. Test in incognito/private mode to rule out cache issues

---

## Version History

### Latest Updates (February 4, 2026)
- ✓ Created comprehensive AI Verification Tool documentation
- ✓ Added navigation bars to 7 test/debug pages
- ✓ Updated HTML structure for consistency
- ✓ Added Tailwind CSS styling to all pages
- ✓ Implemented dark mode support

### Total Pages Updated: 7
### Total Pages with Navigation: 31+
### Documentation Files Created: 3
