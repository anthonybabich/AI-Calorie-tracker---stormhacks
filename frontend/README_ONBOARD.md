# User Onboarding Integration Guide

This onboarding system adds user profile setup with personalized calorie goals to the existing calorie tracker.

## Files Updated/Added

- `index.html` - Updated with onboarding modal and profile sections
- `styles.css` - New comprehensive stylesheet for onboarding UI
- `app.js` - Enhanced with onboarding logic while preserving existing upload functionality
- `README_ONBOARD.md` - This integration guide

## Manual Testing Checklist

### First-Time User Flow
1. **Load page** - Onboarding modal should appear immediately
2. **Step 1 - Profile Setup:**
   - Try entering letters in Age field → Should be blocked
   - Try entering negative numbers → Should show error
   - Try age < 10 or > 120 → Should show error
   - Test height/weight with different units (cm/in, kg/lb)
   - Try submitting without selecting gender → Should show error
   - Complete valid form → Next button should enable and advance to Step 2

3. **Step 2 - Goal Selection:**
   - Try clicking Complete without selecting goal → Should show error
   - Select each goal option → Button should highlight
   - Click Complete → Should calculate calories and close modal

4. **Post-Onboarding:**
   - Calorie counter should appear in top-right corner
   - Profile summary card should show with correct data
   - Original upload functionality should still work

### Returning User Flow
1. **Reload page** - Should skip onboarding and show dashboard directly
2. **Click "Edit Profile"** - Should reopen modal with pre-filled data
3. **Modify and save** - Should update profile and calorie count

### Validation Testing
- **Age:** Only integers 10-120 allowed
- **Height/Weight:** Only positive decimals allowed
- **Unit conversion:** 
  - 70 inches = 177.8 cm
  - 150 lbs = 68.04 kg
- **BMR calculation:** Use online calculator to verify
- **Goal adjustments:**
  - Cutting: TDEE × 0.80
  - Maintaining: TDEE × 1.00  
  - Bulking: TDEE × 1.15

### Browser Storage
- Check `localStorage` for `calorie_tracker_profile` key
- Profile should persist across browser sessions
- Clear localStorage to test first-time flow again

## Integration Notes

- The existing upload form functionality is preserved and enhanced
- All original API calls and image processing remain unchanged
- Onboarding can be disabled by setting a profile in localStorage
- The system gracefully handles missing or corrupted profile data

## Troubleshooting

- **Modal not appearing:** Check for JavaScript errors in console
- **Validation not working:** Ensure event listeners are properly attached
- **Calculations incorrect:** Verify unit conversions and BMR formula implementation
- **Profile not saving:** Check localStorage permissions and quotas