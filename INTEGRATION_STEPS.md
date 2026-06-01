# Quick Integration Guide - University Evaluation Feature

## How to Add to Your Onboarding Flow

### Option A: Add as Quick Evaluate Route (Recommended)

**Step 1**: Create a new route file:
```bash
touch frontend/app/(onboarding)/onboarding/evaluate/page.tsx
```

**Step 2**: Add the following content:
```tsx
"use client";

import UniversityEvaluatorFlow from "@/components/UniversityEvaluatorFlow";

export default function EvaluatePage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #fff 0%, #f8fafc 100%)',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <UniversityEvaluatorFlow />
    </div>
  );
}
```

**Step 3**: Navigate to: `http://localhost:3000/onboarding/evaluate`

---

### Option B: Add to Goal Selection (In Main Onboarding)

**Step 1**: Edit `frontend/app/(onboarding)/onboarding/page.tsx`

**Step 2**: Find the `goal` step (around line 250):
```tsx
{
    id: 'goal',
    header: "Looking for answers to your masters abroad questions?",
    q: "How can we support you with your master's?",
    type: 'goal_grid',
    options: [
        { value: 'loan', label: 'Need help with an education loan', icon: 'payments', iconClass: 'icon-green', emoji: '🏦' },
        { value: 'plan', label: 'Help me find the right university', icon: 'school', iconClass: 'icon-purple', emoji: '🎓' },
        { value: 'compare', label: 'Evaluate my shortlisted universities', icon: 'compare_arrows', iconClass: 'icon-yellow', emoji: '📊' },
    ]
}
```

**Step 3**: Add new option:
```tsx
{ value: 'evaluate', label: 'Quick evaluate 3-5 universities', icon: 'assessment', iconClass: 'icon-blue', emoji: '⚡' },
```

**Step 4**: Find the rendering section and add case for 'evaluate':
```tsx
if (answers.goal?.value === 'evaluate') {
    return <UniversityEvaluatorFlow />;
}
```

**Step 5**: Import the component at top:
```tsx
import UniversityEvaluatorFlow from "@/components/UniversityEvaluatorFlow";
```

---

### Option C: Add as Floating Action Button

Add this to any page:
```tsx
import { useState } from 'react';
import UniversityEvaluatorFlow from "@/components/UniversityEvaluatorFlow";

export default function YourPage() {
  const [showEvaluator, setShowEvaluator] = useState(false);

  return (
    <>
      {/* Your existing content */}
      
      {/* FAB Button */}
      <button
        onClick={() => setShowEvaluator(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6605c7, #7c3aed)',
          color: '#fff',
          border: 'none',
          fontSize: 24,
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(102, 5, 199, 0.4)',
          zIndex: 999,
        }}
      >
        📊
      </button>

      {/* Modal */}
      {showEvaluator && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            maxWidth: 700,
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
          }}>
            <button
              onClick={() => setShowEvaluator(false)}
              style={{
                position: 'sticky',
                top: 12,
                right: 12,
                float: 'right',
                background: 'none',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
                zIndex: 10,
              }}
            >
              ✕
            </button>
            <UniversityEvaluatorFlow />
          </div>
        </div>
      )}
    </>
  );
}
```

---

## File Structure

After integration, your structure will be:
```
frontend/
├── components/
│   ├── UniversityEvaluatorFlow.tsx          ← New
│   └── ... existing components
├── lib/
│   ├── universityEvaluationEngine.ts        ← New
│   ├── api.ts
│   └── ... existing libs
└── app/
    └── (onboarding)/
        └── onboarding/
            ├── page.tsx                      ← Modified if Option B
            └── evaluate/
                └── page.tsx                  ← New if Option A
```

---

## Testing the Integration

### Test 1: Direct URL Test
```
Navigate to: http://localhost:3000/onboarding/evaluate
Expected: University evaluation form loads
```

### Test 2: Input Test
```
1. Enter universities: MIT, Stanford, Harvard, Carnegie Mellon, UC Berkeley
2. Expected: Shows "5 universities detected"
3. Click Continue
```

### Test 3: Profile Test
```
1. Fill profile:
   - Undergrad: B.Tech Computer Science
   - Master's: MS Computer Science
   - CGPA: 8.5
   - Experience: 12 months
   - Budget: Above ₹40 Lakhs
2. Click Evaluate Universities
3. Expected: Results load with MIT likely top recommendation
```

### Test 4: Results Display
```
1. Verify top recommendation highlighted
2. Check all 5 universities ranked
3. Verify expansion on click shows detailed factors
4. Check recommended next steps appear
```

---

## Key Features to Test

- ✓ Input validation (min 3, max 5 universities)
- ✓ Profile form submission
- ✓ API call to `/ai/compare-shortlist`
- ✓ Results ranking
- ✓ Factor breakdown accuracy
- ✓ Recommendation text displays correctly
- ✓ Mobile responsiveness
- ✓ Error handling (API failures)
- ✓ Back button navigation
- ✓ Accessibility (keyboard navigation, screen readers)

---

## Environment Setup

No additional environment variables needed. The component uses existing:
- `HTTP_API_PREFIX` for API calls
- `useAuth()` context for authentication
- Existing `aiApi.compareShortlist` endpoint

---

## Performance Notes

- Component lazy-loads: Use `dynamic()` for route-based integration
- API call timeouts: Set to 30 seconds (configurable in `aiApi`)
- Large university databases: Search optimized with client-side filtering
- Mobile-friendly: Works on devices from 320px+ width

---

## Customization Examples

### Example 1: Change Budget Tiers
```tsx
const budgetOptions = [
  { value: 'budget_1', label: '< ₹10 Lakhs' },
  { value: 'budget_2', label: '₹10-20 Lakhs' },
  { value: 'budget_3', label: '₹20-35 Lakhs' },
  { value: 'budget_4', label: '> ₹35 Lakhs' },
];
```

### Example 2: Change Max Universities
```tsx
const MAX_UNIVERSITIES = 7; // Instead of 5
```

### Example 3: Add Language Support
```tsx
const translations = {
  en: { header: 'Evaluate Your Universities', ... },
  hi: { header: 'अपने विश्वविद्यालयों का मूल्यांकन करें', ... },
};
```

---

## Troubleshooting Common Issues

### Issue: "Failed to evaluate universities"
- Ensure user is logged in (token present)
- Check university names are in database
- Verify API endpoint is `/ai/compare-shortlist`

### Issue: Low evaluation scores for good universities
- Check GPA scale (4.0 vs 10.0)
- Verify budget tier matches cost
- Ensure course name matches available programs

### Issue: Component not rendering
- Verify import path is correct
- Check `UniversityEvaluatorFlow.tsx` exists
- Ensure no TypeScript errors

### Issue: Styling looks broken
- Clear `.next/` folder: `rm -rf .next`
- Rebuild: `npm run build`
- Check no conflicting CSS

---

## Support & Feedback

For issues or feature requests:
1. Check browser console for errors
2. Review API response in Network tab
3. Verify test cases from section above
4. Create issue with error logs

---

**Version**: 1.0.0  
**Last Updated**: May 2026  
**Compatibility**: Next.js 14+, React 18+
