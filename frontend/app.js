// ===== DEBUG CONFIGURATION =====
const DEBUG = true;

// ===== GLOBAL STATE =====
let currentProfile = null;
let currentDate = new Date();
let currentDayData = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('App initialized - DOM loaded');
    
    currentProfile = loadProfile();
    // Force reload current day data to ensure latest updates
    currentDayData = loadDay(currentDate);
    
    initializeUI();
    initializeDebugPanel();
    setupEventListeners();
    
    if (DEBUG) {
        console.debug('Profile:', currentProfile);
        console.debug('Day data:', currentDayData);
    }
});

// Add visibility change listener to refresh when returning to page
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Page became visible, refresh data
        currentDayData = loadDay(currentDate);
        updateDashboard();
        console.debug('Page visible - refreshed data');
    }
});

// Add window focus event to refresh when returning to dashboard
window.addEventListener('focus', () => {
    currentDayData = loadDay(currentDate);
    updateDashboard();
    console.debug('Window focused - refreshed data');
});

// Debug helper function - add to window for testing
window.debugClearToday = function() {
    const key = getDayKey(new Date());
    localStorage.removeItem(key);
    console.log('Cleared today\'s data');
    location.reload();
};

// Debug helper function - add test entry
window.debugAddTestEntry = function() {
    const today = new Date();
    const dayKey = getDayKey(today);
    
    const testData = {
        date: today.toISOString().split('T')[0],
        eatenCalories: 200,
        carbs_g: 25,
        protein_g: 8,
        fat_g: 8,
        entries: [{
            id: Date.now(),
            name: 'Test Food',
            calories: 200,
            carbs_g: 25,
            protein_g: 8,
            fat_g: 8,
            timestamp: new Date().toISOString()
        }]
    };
    
    localStorage.setItem(dayKey, JSON.stringify(testData));
    console.log('Added test entry:', testData);
    location.reload();
};

// ===== CORE DATA FUNCTIONS =====

function computeDailyTargets(profile) {
    if (!profile || !profile.age || !profile.height_cm || !profile.weight_kg || !profile.gender) {
        // Default targets if no profile
        return {
            maxCalories: 2000,
            macroTargets: {
                carbs_g: 250,  // 50% of 2000 kcal / 4 kcal/g
                protein_g: 100, // 20% of 2000 kcal / 4 kcal/g
                fat_g: 67      // 30% of 2000 kcal / 9 kcal/g
            }
        };
    }

    // BMR calculation using Mifflin-St Jeor equation
    const bmr = profile.gender === 'male' 
        ? 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age + 5
        : 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age - 161;

    // Activity multiplier
    let activityMultiplier;
    if (profile.activity_days <= 1) activityMultiplier = 1.2;
    else if (profile.activity_days <= 3) activityMultiplier = 1.375;
    else if (profile.activity_days <= 5) activityMultiplier = 1.55;
    else activityMultiplier = 1.725;

    const tdee = bmr * activityMultiplier;

    // Goal adjustment
    let goalMultiplier = 1.0;
    if (profile.goal === 'cutting') goalMultiplier = 0.80;
    else if (profile.goal === 'bulking') goalMultiplier = 1.15;

    const maxCalories = Math.round(tdee * goalMultiplier);

    // Macro targets (50% carbs, 20% protein, 30% fat)
    const carbsCalories = maxCalories * 0.5;
    const proteinCalories = maxCalories * 0.2;
    const fatCalories = maxCalories * 0.3;

    return {
        maxCalories,
        macroTargets: {
            carbs_g: Math.round(carbsCalories / 4),
            protein_g: Math.round(proteinCalories / 4),
            fat_g: Math.round(fatCalories / 9)
        }
    };
}

function getDayKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `calorie_tracker_day_${year}-${month}-${day}`;
}

function loadDay(date) {
    const key = getDayKey(date);
    const stored = localStorage.getItem(key);
    
    if (DEBUG) {
        console.debug('Loading day with key:', key);
        console.debug('Stored data:', stored);
    }
    
    if (stored) {
        const dayData = JSON.parse(stored);
        if (DEBUG) {
            console.debug('Parsed day data:', dayData);
        }
        return dayData;
    }
    
    // Return default day structure
    const defaultDay = {
        date: date.toISOString().split('T')[0],
        eatenCalories: 0,
        carbs_g: 0,
        protein_g: 0,
        fat_g: 0,
        entries: []
    };
    
    if (DEBUG) {
        console.debug('Returning default day:', defaultDay);
    }
    
    return defaultDay;
}

function saveDay(dayObj) {
    const date = new Date(dayObj.date);
    const key = getDayKey(date);
    localStorage.setItem(key, JSON.stringify(dayObj));
    
    if (DEBUG) {
        console.debug('Saved day data:', key, dayObj);
    }
}

function addFoodEntry(dayKey, entry) {
    const date = new Date(dayKey.replace('calorie_tracker_day_', ''));
    const dayData = loadDay(date);
    
    // Add entry with timestamp
    const newEntry = {
        ...entry,
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    dayData.entries.push(newEntry);
    
    // Update totals
    dayData.eatenCalories += entry.calories;
    dayData.carbs_g += entry.carbs_g;
    dayData.protein_g += entry.protein_g;
    dayData.fat_g += entry.fat_g;
    
    saveDay(dayData);
    
    // Update current day data if it's today
    if (date.toDateString() === currentDate.toDateString()) {
        currentDayData = dayData;
        updateDashboard();
    }
    
    return newEntry;
}

function loadProfile() {
    const stored = localStorage.getItem('calorie_tracker_profile');
    return stored ? JSON.parse(stored) : null;
}

// ===== FOOD ESTIMATION =====
function estimateFromImage(file) {
    // Deterministic food estimation based on filename and keywords
    const filename = file.name.toLowerCase();
    
    const foodDatabase = {
        pizza: { name: "Pepperoni pizza slice", calories: 350, carbs_g: 33, protein_g: 14, fat_g: 20, confidence: 0.85 },
        apple: { name: "Apple (medium)", calories: 95, carbs_g: 25, protein_g: 0.5, fat_g: 0.3, confidence: 0.90 },
        banana: { name: "Banana (medium)", calories: 105, carbs_g: 27, protein_g: 1.3, fat_g: 0.4, confidence: 0.88 },
        croissant: { name: "Croissant", calories: 260, carbs_g: 30, protein_g: 6, fat_g: 12, confidence: 0.82 },
        burger: { name: "Hamburger", calories: 550, carbs_g: 40, protein_g: 25, fat_g: 32, confidence: 0.80 },
        hamburger: { name: "Hamburger", calories: 550, carbs_g: 40, protein_g: 25, fat_g: 32, confidence: 0.80 },
        salad: { name: "Side salad", calories: 150, carbs_g: 10, protein_g: 3, fat_g: 10, confidence: 0.75 }
    };
    
    // Check filename for keywords
    for (const [keyword, food] of Object.entries(foodDatabase)) {
        if (filename.includes(keyword)) {
            return Promise.resolve(food);
        }
    }
    
    // Unknown food - return default estimation
    return Promise.resolve({
        name: "Unknown food item",
        calories: 200,
        carbs_g: 25,
        protein_g: 8,
        fat_g: 8,
        confidence: 0.4
    });
}

// ===== UI INITIALIZATION =====
function initializeUI() {
    setupDateRow();
    updateDashboard();
}

function setupDateRow() {
    const container = document.getElementById('date-container');
    const today = new Date();
    
    // Generate 7 days centered on today
    for (let i = -3; i <= 3; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        const dayData = loadDay(date);
        const targets = computeDailyTargets(currentProfile);
        const completionPercent = Math.round((dayData.eatenCalories / targets.maxCalories) * 100);
        
        const cell = document.createElement('div');
        cell.className = 'date-cell';
        cell.setAttribute('role', 'tab');
        cell.setAttribute('tabindex', i === 0 ? '0' : '-1');
        cell.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
        
        if (i === 0) {
            cell.classList.add('active');
        }
        
        cell.innerHTML = `
            <div class="day-name">${date.toLocaleDateString('en', { weekday: 'short' })}</div>
            <div class="day-number">${date.getDate()}</div>
            <div class="completion-percent">${completionPercent}%</div>
        `;
        
        cell.addEventListener('click', () => selectDate(date));
        cell.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectDate(date);
            }
        });
        
        container.appendChild(cell);
    }
}

function selectDate(date) {
    currentDate = new Date(date);
    currentDayData = loadDay(currentDate);
    
    // Update active state
    document.querySelectorAll('.date-cell').forEach((cell, index) => {
        cell.classList.toggle('active', index === 3); // Middle cell
        cell.setAttribute('aria-selected', index === 3 ? 'true' : 'false');
        cell.setAttribute('tabindex', index === 3 ? '0' : '-1');
    });
    
    updateDashboard();
    updateFoodLog();
}

function updateDashboard() {
    const targets = computeDailyTargets(currentProfile);
    
    // Update calories eaten
    animateNumber(document.getElementById('calories-eaten'), currentDayData.eatenCalories);
    
    // Update calories remaining
    const remaining = Math.max(0, targets.maxCalories - currentDayData.eatenCalories);
    animateNumber(document.getElementById('calories-remaining'), remaining);
    
    // Update max calories displays
    document.getElementById('max-calories-display').textContent = targets.maxCalories;
    document.getElementById('max-calories-center').textContent = targets.maxCalories;
    
    // Update completion ring
    const completionPercent = Math.min(100, (currentDayData.eatenCalories / targets.maxCalories) * 100);
    updateCompletionRing(completionPercent);
    
    // Debug macro values
    if (DEBUG) {
        console.debug('Current day data:', currentDayData);
        console.debug('Macro values:', {
            carbs: currentDayData.carbs_g,
            protein: currentDayData.protein_g,
            fat: currentDayData.fat_g
        });
        console.debug('Macro targets:', targets.macroTargets);
    }
    
    // Update macro bars - ensure values are not undefined
    updateMacroBar('carbs', currentDayData.carbs_g || 0, targets.macroTargets.carbs_g, currentDayData.eatenCalories);
    updateMacroBar('protein', currentDayData.protein_g || 0, targets.macroTargets.protein_g, currentDayData.eatenCalories);
    updateMacroBar('fat', currentDayData.fat_g || 0, targets.macroTargets.fat_g, currentDayData.eatenCalories);
    
    updateFoodLog();
}

function animateNumber(element, targetValue) {
    const currentValue = parseInt(element.textContent) || 0;
    const duration = 300;
    const steps = 20;
    const stepValue = (targetValue - currentValue) / steps;
    const stepDuration = duration / steps;
    
    let step = 0;
    const timer = setInterval(() => {
        step++;
        const newValue = Math.round(currentValue + (stepValue * step));
        element.textContent = step === steps ? targetValue : newValue;
        element.classList.add('animate-count');
        
        if (step >= steps) {
            clearInterval(timer);
            setTimeout(() => element.classList.remove('animate-count'), 300);
        }
    }, stepDuration);
}

function updateCompletionRing(percent) {
    const ring = document.getElementById('ring-progress');
    const circumference = 2 * Math.PI * 85; // r = 85
    const offset = circumference - (percent / 100) * circumference;
    
    ring.style.strokeDashoffset = offset;
    ring.setAttribute('aria-valuenow', Math.round(percent));
}

function updateMacroBar(macro, eaten, target, totalCalories = 0) {
    // Update grams consumed
    document.getElementById(`${macro}-eaten`).textContent = Math.round(eaten);
    
    // Calculate calories from this macro
    let caloriesFromMacro = 0;
    if (macro === 'carbs') {
        caloriesFromMacro = eaten * 4; // 4 calories per gram of carbs
    } else if (macro === 'protein') {
        caloriesFromMacro = eaten * 4; // 4 calories per gram of protein
    } else if (macro === 'fat') {
        caloriesFromMacro = eaten * 9; // 9 calories per gram of fat
    }
    
    // Calculate percentage of consumed calories (should total 100% across all macros)
    const percentOfConsumedCalories = totalCalories > 0 ? Math.round((caloriesFromMacro / totalCalories) * 100) : 0;
    document.getElementById(`${macro}-percentage`).textContent = `${percentOfConsumedCalories}%`;
    
    // Update progress bar to match the percentage display (calorie distribution)
    const progressBar = document.getElementById(`${macro}-progress`);
    progressBar.style.width = `${percentOfConsumedCalories}%`;
    progressBar.setAttribute('aria-valuenow', percentOfConsumedCalories);
}

function updateFoodLog() {
    const container = document.getElementById('food-entries');
    
    if (currentDayData.entries.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">No food entries for this day</p>';
        return;
    }
    
    container.innerHTML = currentDayData.entries.map(entry => `
        <div class="food-entry">
            <div class="food-entry-left">
                <div class="food-name">${entry.name}</div>
                <div class="food-time">${entry.time}</div>
            </div>
            <div class="food-nutrients">
                <span class="nutrient calories">${entry.calories} kcal</span>
                <span class="nutrient">C: ${Math.round(entry.carbs_g)}g</span>
                <span class="nutrient">P: ${Math.round(entry.protein_g)}g</span>
                <span class="nutrient">F: ${Math.round(entry.fat_g)}g</span>
            </div>
        </div>
    `).join('');
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Direct button approach - wait a moment for DOM to be fully ready
    setTimeout(() => {
        const profileBtn = document.getElementById('setup-profile-btn');
        const addFoodBtn = document.getElementById('add-food-btn');
        const checkFoodBtn = document.getElementById('check-food-btn');
        
        console.log('Found buttons:', {
            profile: !!profileBtn,
            addFood: !!addFoodBtn,
            checkFood: !!checkFoodBtn
        });
        
        if (profileBtn) {
            profileBtn.onclick = function() {
                console.log('Profile button clicked');
                showOnboarding();
            };
        }
        
        if (addFoodBtn) {
            addFoodBtn.onclick = function() {
                console.log('Add Food button clicked');
                window.location.href = 'add_food.html?mode=add';
            };
        }
        
        if (checkFoodBtn) {
            checkFoodBtn.onclick = function() {
                console.log('Check Food button clicked');
                window.location.href = 'add_food.html?mode=check';
            };
        }
    }, 100);
    
    // Onboarding (keeping existing functionality)
    setupOnboardingEventListeners();
}

// ===== ONBOARDING (EXISTING FUNCTIONALITY) =====
function showOnboarding() {
    // Reset form state
    selectedGender = '';
    selectedGoal = '';
    
    // Clear all selected states
    document.querySelectorAll('.select-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelectorAll('.goal-btn').forEach(btn => btn.classList.remove('selected'));
    
    // Reset to step 1
    document.getElementById('step-2')?.classList.remove('active');
    document.getElementById('step-1')?.classList.add('active');
    document.getElementById('modal-title').textContent = 'Set Up Your Profile';
    
    // Disable buttons
    const nextBtn = document.getElementById('next-btn');
    const completeBtn = document.getElementById('complete-btn');
    if (nextBtn) nextBtn.disabled = true;
    if (completeBtn) completeBtn.disabled = true;
    
    // Show modal
    document.getElementById('onboarding-modal').classList.remove('hidden');
}

function setupOnboardingEventListeners() {
    // Input validation
    setupInputValidation();
    setupGenderSelection();
    setupGoalSelection();
    
    // Modal buttons
    const cancelBtn = document.getElementById('cancel-btn');
    const completeBtn = document.getElementById('complete-profile');
    const nextBtn = document.getElementById('next-step-1');
    const backBtn = document.getElementById('back-step-2');
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            document.getElementById('onboarding-modal').classList.add('hidden');
        });
    }
    
    if (completeBtn) {
        completeBtn.addEventListener('click', completeProfileSetup);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (validateStep1()) {
                goToStep2();
            }
        });
    }
    
    if (backBtn) {
        backBtn.addEventListener('click', goToStep1);
    }
    
    // Form submission
    const form = document.getElementById('profile-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validateStep1()) {
                goToStep2();
            }
        });
    }
}

function setupInputValidation() {
    const ageInput = document.getElementById('age');
    const heightInput = document.getElementById('height');
    const weightInput = document.getElementById('weight');
    const activitySelect = document.getElementById('activity');
    
    if (ageInput) ageInput.addEventListener('input', validateStep2);
    if (heightInput) heightInput.addEventListener('input', validateStep2);
    if (weightInput) weightInput.addEventListener('input', validateStep2);
    if (activitySelect) activitySelect.addEventListener('change', validateStep1);
}

let selectedGender = '';
let selectedGoal = '';

function setupGenderSelection() {
    const genderButtons = document.querySelectorAll('[data-gender]');
    
    genderButtons.forEach(btn => {
        btn.addEventListener('click', () => selectGender(btn.dataset.gender));
    });
}

function selectGender(gender) {
    selectedGender = gender;
    
    const genderButtons = document.querySelectorAll('[data-gender]');
    genderButtons.forEach(btn => {
        btn.style.borderColor = btn.dataset.gender === gender ? '#007bff' : '#e1e5e9';
        btn.style.background = btn.dataset.gender === gender ? '#f0f8ff' : 'white';
    });
    
    validateStep2();
}

function setupGoalSelection() {
    const goalButtons = document.querySelectorAll('[data-goal]');
    
    goalButtons.forEach(button => {
        button.addEventListener('click', () => selectGoal(button.dataset.goal));
    });
}

function selectGoal(goal) {
    selectedGoal = goal;
    
    const goalButtons = document.querySelectorAll('[data-goal]');
    goalButtons.forEach(btn => {
        btn.style.borderColor = btn.dataset.goal === goal ? '#007bff' : '#e1e5e9';
        btn.style.background = btn.dataset.goal === goal ? '#f0f8ff' : 'white';
    });
    
    validateStep2();
}

function validateStep1() {
    const activity = document.getElementById('activity')?.value;
    
    const isValid = activity;
    
    const nextBtn = document.getElementById('next-step-1');
    if (nextBtn) {
        nextBtn.disabled = !isValid;
        nextBtn.style.background = isValid ? '#007bff' : '#ccc';
        nextBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';
    }
    
    return isValid;
}

function validateStep2() {
    const age = document.getElementById('age')?.value;
    const height = document.getElementById('height')?.value;
    const weight = document.getElementById('weight')?.value;
    
    const isValid = age && height && weight && selectedGender && selectedGoal;
    
    const completeBtn = document.getElementById('complete-profile');
    if (completeBtn) {
        completeBtn.disabled = !isValid;
        completeBtn.style.background = isValid ? '#007bff' : '#ccc';
        completeBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';
    }
    
    return isValid;
}

function goToStep2() {
    document.getElementById('step-1').style.display = 'none';
    document.getElementById('step-2').style.display = 'block';
}

function goToStep1() {
    document.getElementById('step-2').style.display = 'none';
    document.getElementById('step-1').style.display = 'block';
}

function completeProfileSetup() {
    if (!selectedGoal) {
        showToast('Please select your goal', true);
        return;
    }
    
    // Extract profile data from form
    const age = parseInt(document.getElementById('age').value);
    const heightValue = parseFloat(document.getElementById('height').value);
    const heightUnit = document.getElementById('height-unit').value;
    const weightValue = parseFloat(document.getElementById('weight').value);
    const weightUnit = document.getElementById('weight-unit').value;
    const activityDays = parseInt(document.getElementById('activity').value);
    
    // Convert to metric
    const height_cm = heightUnit === 'in' ? heightValue * 2.54 : heightValue;
    const weight_kg = weightUnit === 'lb' ? weightValue * 0.453592 : weightValue;
    
    const profile = {
        age,
        height_cm,
        weight_kg,
        gender: selectedGender,
        activity_days: activityDays,
        goal: selectedGoal,
        unitPrefs: { height: heightUnit, weight: weightUnit },
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('calorie_tracker_profile', JSON.stringify(profile));
    currentProfile = profile;
    
    document.getElementById('onboarding-modal').classList.add('hidden');
    updateDashboard();
    
    showToast('Profile saved successfully!');
}

// ===== UTILITIES =====
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    const messageEl = document.getElementById('toast-message');
    
    messageEl.textContent = message;
    toast.className = `toast ${isError ? 'error' : ''}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 2500);
}

// ===== DEBUG PANEL =====
function initializeDebugPanel() {
    if (!DEBUG) {
        document.getElementById('debug-panel').remove();
        return;
    }
    
    document.getElementById('debug-panel').classList.remove('hidden');
    
    document.getElementById('debug-toggle').addEventListener('click', toggleDebugContent);
    document.getElementById('debug-reset').addEventListener('click', resetDayData);
    
    updateDebugContent();
}

function toggleDebugContent() {
    const content = document.getElementById('debug-content');
    content.classList.toggle('hidden');
    updateDebugContent();
}

function updateDebugContent() {
    if (DEBUG) {
        const content = document.getElementById('debug-content');
        const debugData = {
            profile: currentProfile,
            currentDay: currentDayData,
            targets: computeDailyTargets(currentProfile),
            localStorage: {
                profile: localStorage.getItem('calorie_tracker_profile'),
                currentDayKey: getDayKey(currentDate)
            }
        };
        
        content.textContent = JSON.stringify(debugData, null, 2);
    }
}

function resetDayData() {
    const key = getDayKey(currentDate);
    localStorage.removeItem(key);
    currentDayData = loadDay(currentDate);
    updateDashboard();
    updateDebugContent();
    showToast('Day data reset');
}

// ===== SAMPLE DATA (for testing) =====
if (DEBUG) {
    console.debug('Sample day data with pizza entry:', {
        date: "2025-10-04",
        eatenCalories: 350,
        carbs_g: 33,
        protein_g: 14,
        fat_g: 20,
        entries: [
            {
                id: "1728000000000",
                name: "Pepperoni pizza slice",
                calories: 350,
                carbs_g: 33,
                protein_g: 14,
                fat_g: 20,
                time: "12:30"
            }
        ]
    });
}
