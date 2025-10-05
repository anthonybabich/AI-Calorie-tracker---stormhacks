# Calorie Tracker UI Documentation

## Overview

This is a complete client-side calorie tracker application with a modern dashboard interface, profile management, and deterministic food estimation. The app features a responsive design with accessibility support and smooth animations.

## File Structure

```
frontend/
├── index.html          # Main dashboard page
├── styles.css          # Complete styling system
├── app.js             # Core app functionality
├── add_food.html      # Food estimation page
├── add_food.js        # Food estimation logic
└── README_UI.md       # This documentation
```

## How to Run Locally

### Option 1: Python HTTP Server
```bash
cd frontend
python -m http.server 8000
# Open http://localhost:8000
```

### Option 2: VS Code Live Server
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Option 3: Node.js HTTP Server
```bash
npx http-server frontend -p 8000
# Open http://localhost:8000
```

## Features

### Dashboard (index.html)
- **7-Day Date Row**: Navigate between days with completion percentages
- **Three-Card Layout**:
  - Calories Eaten (with Add Food button)
  - Completion Ring (with Check Food button)
  - Macro Progress Bars (Carbs, Protein, Fat)
- **Profile Banner**: Shows when no profile exists
- **Food Log**: Shows all entries for the selected day
- **Debug Panel**: Shows when `DEBUG = true` in app.js

### Food Estimation (add_food.html)
- **Dual Mode**: Add mode (persists entries) or Check mode (preview only)
- **File Upload**: Drag & drop or click to browse
- **Deterministic Estimation**: Keyword-based food recognition
- **Manual Entry**: For unknown foods with auto-calculation
- **Suggestions**: Alternative food options for low confidence

### Profile Management
- **BMR/TDEE Calculation**: Using Mifflin-St Jeor equation
- **Goal-Based Adjustments**: Cutting (-20%), Maintain (0%), Bulking (+15%)
- **Activity Level Mapping**: 0-7 days per week with multipliers
- **Unit Support**: Metric (kg/cm) and Imperial (lb/in)

## Data Storage

### Profile Storage
**Key**: `calorie_tracker_profile`
```json
{
  "age": 25,
  "height_cm": 175,
  "weight_kg": 70,
  "gender": "male",
  "activity_days": 3,
  "goal": "maintaining",
  "unitPrefs": {
    "height": "cm",
    "weight": "kg"
  },
  "createdAt": "2025-10-04T10:30:00.000Z"
}
```

### Daily Data Storage
**Key**: `calorie_tracker_day_YYYY-MM-DD`
```json
{
  "date": "2025-10-04",
  "eatenCalories": 350,
  "carbs_g": 33,
  "protein_g": 14,
  "fat_g": 20,
  "entries": [
    {
      "id": "1728000000000",
      "name": "Pepperoni pizza slice",
      "calories": 350,
      "carbs_g": 33,
      "protein_g": 14,
      "fat_g": 20,
      "time": "12:30"
    }
  ]
}
```

## Core Functions

### BMR/TDEE Calculations
```javascript
computeDailyTargets(profile) → {maxCalories, macroTargets}
```
- **BMR**: Mifflin-St Jeor equation
  - Male: `10*weight + 6.25*height - 5*age + 5`
  - Female: `10*weight + 6.25*height - 5*age - 161`
- **TDEE**: BMR × activity multiplier
  - 0-1 days: 1.2
  - 2-3 days: 1.375
  - 4-5 days: 1.55
  - 6-7 days: 1.725
- **Goals**: Cutting (×0.80), Maintain (×1.00), Bulking (×1.15)
- **Macros**: 50% carbs, 20% protein, 30% fat

### Data Management
```javascript
getDayKey(date) → 'calorie_tracker_day_YYYY-MM-DD'
loadDay(date) → dayObject
saveDay(dayObj) → void
addFoodEntry(dayKey, entry) → newEntry
```

### Food Estimation
```javascript
estimateFromImage(file) → Promise<foodObject>
```

**Built-in Food Database**:
- `pizza` → Pepperoni pizza slice (350 kcal)
- `apple` → Apple medium (95 kcal)
- `banana` → Banana medium (105 kcal)
- `croissant` → Croissant (260 kcal)
- `burger`/`hamburger` → Hamburger (550 kcal)
- `salad` → Side salad (150 kcal)

## Customization

### Adding New Foods
Edit the `foodDatabase` in both `app.js` and `add_food.js`:
```javascript
const foodDatabase = {
  sandwich: { 
    name: "Turkey sandwich", 
    calories: 300, 
    carbs_g: 35, 
    protein_g: 20, 
    fat_g: 8, 
    confidence: 0.80 
  }
};
```

### Replacing with Real API
Replace the `estimateFromImage` function:
```javascript
async function estimateFromImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch('/api/analyze-food', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
}
```

### Changing Macro Split
Modify the macro calculation in `computeDailyTargets`:
```javascript
// Current: 50% carbs, 20% protein, 30% fat
const carbsCalories = maxCalories * 0.4;    // 40%
const proteinCalories = maxCalories * 0.3;  // 30%
const fatCalories = maxCalories * 0.3;      // 30%
```

## Debug Mode

Set `DEBUG = true` in `app.js` to enable:
- Console logging of all operations
- Debug panel in bottom-right corner
- localStorage data viewer
- Reset day data button

### Debug Panel Features
- **Show/Hide Data**: Toggle JSON view of current state
- **Reset Day Data**: Clear today's food entries
- **Raw Data**: View profile and day data structures

## Accessibility Features

- **ARIA Attributes**: Progress bars, live regions, labels
- **Keyboard Navigation**: Tab order, Enter/Space activation
- **Focus Management**: Visible focus indicators
- **Screen Reader Support**: Meaningful text alternatives
- **High Contrast**: Supports `prefers-contrast: high`
- **Reduced Motion**: Respects `prefers-reduced-motion`

## Responsive Design

### Desktop (1200px+)
- Three-column dashboard layout
- Full-width date row
- Larger interactive elements

### Tablet (768px-1199px)
- Two-column layout where possible
- Adjusted spacing and sizing

### Mobile (320px-767px)
- Single-column stacked layout
- Touch-friendly button sizes
- Optimized date row scrolling

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Features Used**: CSS Grid, Flexbox, localStorage, Fetch API
- **Fallbacks**: Graceful degradation for older browsers

## Data Reset

### Clear All Data
```javascript
localStorage.clear();
location.reload();
```

### Clear Profile Only
```javascript
localStorage.removeItem('calorie_tracker_profile');
location.reload();
```

### Clear Specific Day
```javascript
const today = new Date();
const key = getDayKey(today);
localStorage.removeItem(key);
location.reload();
```

## Sample Data

### Example Profile
```javascript
localStorage.setItem('calorie_tracker_profile', JSON.stringify({
  age: 30,
  height_cm: 170,
  weight_kg: 65,
  gender: 'female',
  activity_days: 4,
  goal: 'cutting',
  unitPrefs: { height: 'cm', weight: 'kg' }
}));
```

### Example Day with Pizza Entry
```javascript
const dayData = {
  date: '2025-10-04',
  eatenCalories: 350,
  carbs_g: 33,
  protein_g: 14,
  fat_g: 20,
  entries: [{
    id: '1728000000000',
    name: 'Pepperoni pizza slice',
    calories: 350,
    carbs_g: 33,
    protein_g: 14,
    fat_g: 20,
    time: '12:30'
  }]
};
localStorage.setItem('calorie_tracker_day_2025-10-04', JSON.stringify(dayData));
```

## Performance Considerations

- **localStorage**: Suitable for small datasets (5-10MB limit)
- **Image Processing**: Client-side only, no server upload
- **Animations**: Hardware-accelerated CSS transitions
- **Memory**: Minimal DOM manipulation, efficient event handling

## Future Enhancements

1. **Barcode Scanning**: Use camera API for product lookup
2. **Meal Planning**: Weekly meal prep features
3. **Progress Tracking**: Weight and measurement logging
4. **Export Data**: CSV/JSON download functionality
5. **Sync**: Cloud storage integration
6. **Recipes**: Custom recipe calculator
7. **Social**: Share meals and progress

## Troubleshooting

### Common Issues

**App not loading**: Check browser console for JavaScript errors
**Profile not saving**: Verify localStorage is enabled
**Images not uploading**: Check file size and format (images only)
**Calculations wrong**: Verify profile data completeness

### Debug Steps
1. Open browser developer tools (F12)
2. Check Console tab for errors
3. Enable Debug mode (`DEBUG = true`)
4. Use Debug panel to inspect data
5. Clear localStorage if needed

## License

This is a demonstration project. Adapt and modify as needed for your use case.