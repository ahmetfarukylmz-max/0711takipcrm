# Code Quality Analysis - Quick Reference

## Critical Issues (Fix Immediately)

1. **Hardcoded Firebase API Keys** - `/src/services/firebase.js:8-15`
   - Remove fallback API keys
   - Require environment variables only
   - Risk: Exposure of Firebase credentials

2. **Firestore Security Rules Catch-All** - `firestore.rules:55-58`
   - Replace `allow read, write: if isAdmin()` with explicit rules
   - Risk: Overly permissive access

## High Priority Issues

| Issue | Files | Lines | Impact |
|-------|-------|-------|--------|
| **Delete Handler Duplication** | App.jsx | 443-597 | 155 duplicated lines, hard to maintain |
| **Mega Components** | Balances.tsx | 1,352 | Too many responsibilities |
| | CustomerDetail.tsx | 1,047 | Should be split |
| | Customers.tsx | 826 | 13+ props, 10+ modals |
| **Missing Accessibility** | All UI Components | N/A | 0 aria-labels found |
| **Type Safety** | Multiple forms | Various | 10+ uses of `any` type |
| **Mixed JSX/TSX** | App.jsx, Auth, Dashboard | N/A | Inconsistent typing |

## Code Duplication Patterns

```
1. Six identical delete handlers → Extract to factory function
2. Form components pattern → Create base form framework  
3. Modal state management → Create useModalState hook
4. Input sanitization → Already good, keep as is
```

## Performance Issues

- **Missing memoization**: 100+ places where useMemo/useCallback needed
- **Dependency array issues**: JSON.stringify in useFirestore hook (line 160)
- **Inline functions**: Props like `onMarkAsPaid={(id) => {...}}` recreate on every render
- **setTimeout hardcoded**: Use requestAnimationFrame instead
- **No list virtualization**: Large lists could benefit from react-window

## Type Safety Recommendations

```typescript
// Current (BAD)
meetingType: (meeting as any)?.meetingType

// Recommended (GOOD)
interface MeetingFormPayload extends Meeting {
  meetingType: string;
}
```

Enable strict mode in tsconfig.json:
```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitAny": true,
  "strictNullChecks": true
}
```

## Error Handling Issues

- 26 catch blocks with inconsistent patterns
- Mix of: console.error, rethrow, silent fail, return false
- Need: Centralized error logging service
- Need: Custom FirestoreError class with recovery strategies

**Solution:**
```typescript
class FirestoreError extends Error {
  constructor(
    public code: string,
    public operation: string,
    message: string,
    public recoverable: boolean = false
  ) {
    super(message);
  }
}
```

## Security Status

### Good
- Input sanitization implemented (sanitizeText, sanitizePhone, sanitizeEmail)
- DOMPurify used for HTML sanitization
- No direct dangerouslySetInnerHTML usage

### Needs Fixing
- Hardcoded API keys in firebase.js
- Firestore rules catch-all clause
- Admin role check performs read on every request

## State Management

**Prop Drilling:** 13+ props passed to Orders page
- Solution: Move callbacks to Zustand store
- Keep only callbacks, not entire collections

**Data Duplication:** useFirestoreCollections + setCollections in store
- Currently necessary for performance
- Consider: Custom hook for direct access

## Bundle Optimization

**Strengths:**
- Good code splitting configuration
- PWA properly configured
- Lazy loading of pages

**Issues:**
- 3 console.logs left in code
- Consider: Switching moment → date-fns (smaller)
- Consider: Lazy load PDF generation (jspdf is heavy)
- Unused dependency: prop-types

## Accessibility Gaps

Missing:
- aria-label on icon buttons
- aria-expanded on collapsible items
- aria-live on dynamic content
- Focus management in modals
- Keyboard navigation for dropdowns

**Example Fix:**
```jsx
<button 
  onClick={handleDelete}
  aria-label="Müşteri sil"
  title="Müşteri sil"
>
  <TrashIcon />
</button>
```

## Quick Wins (Easy Fixes)

1. Remove hardcoded Firebase keys (30 min)
2. Fix Firestore rules catch-all (15 min)
3. Extract delete handler factory (45 min)
4. Add aria-labels to buttons (1-2 hours)
5. Enable strict TypeScript (30 min + fixes)
6. Remove console.logs (15 min)
7. Remove unused prop-types (30 min)
8. Extract magic numbers to constants (30 min)

## Implementation Priority

### Week 1 (URGENT)
- [ ] Remove hardcoded API keys
- [ ] Fix Firestore rules
- [ ] Enable strict TypeScript

### Week 2 (HIGH)
- [ ] Break down mega-components
- [ ] Extract duplicate delete handlers
- [ ] Add accessibility labels

### Week 3 (MEDIUM)
- [ ] Add useCallback/useMemo
- [ ] Standardize error handling
- [ ] Complete form framework

### Week 4 (LOW)
- [ ] Replace prop-types
- [ ] Convert moment to date-fns
- [ ] Add focus management

## Files Affected

**Critical:**
- `/src/services/firebase.js`
- `/firestore.rules`

**High Priority:**
- `/src/App.jsx` (858 lines)
- `/src/components/pages/Balances.tsx` (1,352 lines)
- `/src/components/pages/CustomerDetail.tsx` (1,047 lines)
- `/src/components/pages/Customers.tsx` (826 lines)

**Components (Refactoring):**
- `/src/components/forms/*` (10 form files)
- `/src/components/pages/*` (18 page files)

## Metrics Summary

- **Total Lines of Code:** 25,009
- **Any Type Usage:** 10+ instances
- **Catch Blocks:** 26 (inconsistent)
- **useCallback/useMemo:** Only 51 instances for entire codebase
- **Component Sizes:** 5 over 800 lines
- **Modal States per Component:** 10+
- **Props to Pages:** Up to 13
- **Console Statements:** 30+

---

**Last Updated:** 2024-11-19
**Analysis Tool:** Comprehensive Code Quality Scanner
**Report Location:** `/CODE_QUALITY_ANALYSIS.md`
