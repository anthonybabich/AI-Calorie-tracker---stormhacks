console.log('app.js loaded successfully');

// Profile data storage
let userProfile = {};
let selectedGender = '';
let selectedGoal = '';

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    
    // Initialize onboarding system
    initializeOnboarding();
    
    // Initialize existing upload functionality
    initializeUploadForm();
});

// ===== ONBOARDING SYSTEM =====

function initializeOnboarding() {
    const existingProfile = localStorage.getItem('calorie_tracker_profile');
    
    if (existingProfile) {
        userProfile = JSON.parse(existingProfile);
        hideOnboarding();
        showDashboard();
    } else {
        showOnboarding();
    }
    
    setupOnboardingEventListeners();
}

function setupOnboardingEventListeners() {
    setupInputValidation();
    setupGenderSelection();
    setupGoalSelection();
    
    document.getElementById('cancel-btn').addEventListener('click', cancelOnboarding);
    document.getElementById('profile-form').addEventListener('submit', handleStep1Submit);
    document.getElementById('back-btn').addEventListener('click', goToStep1);
    document.getElementById('complete-btn').addEventListener('click', completeOnboarding);
    document.getElementById('edit-profile-btn').addEventListener('click', editProfile);
}

function setupInputValidation() {
    const ageInput = document.getElementById('age');
    const heightInput = document.getElementById('height');
    const weightInput = document.getElementById('weight');
    const activitySelect = document.getElementById('activity-level');
    
    ageInput.addEventListener('input', () => validateAge());
    heightInput.addEventListener('input', () => validateHeight());
    weightInput.addEventListener('input', () => validateWeight());
    activitySelect.addEventListener('change', () => validateActivity());
    
    ageInput.addEventListener('keypress', (e) => allowOnlyIntegers(e));
    heightInput.addEventListener('keypress', (e) => allowOnlyDecimals(e));
    weightInput.addEventListener('keypress', (e) => allowOnlyDecimals(e));
}

function allowOnlyIntegers(e) {
    if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
        e.preventDefault();
    }
}

function allowOnlyDecimals(e) {
    if (!/[0-9.]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
        e.preventDefault();
    }
    
    if (e.key === '.' && e.target.value.includes('.')) {
        e.preventDefault();
    }
}

function sanitizeNumberInput(value, allowDecimals = true) {
    if (allowDecimals) {
        return value.replace(/[^0-9.]/g, '').replace(/(\..*?)\./g, '$1');
    } else {
        return value.replace(/[^0-9]/g, '');
    }
}

function validateAge() {
    const ageInput = document.getElementById('age');
    const errorDiv = document.getElementById('age-error');
    
    const sanitized = sanitizeNumberInput(ageInput.value, false);
    ageInput.value = sanitized;
    
    const age = parseInt(sanitized);
    
    if (!sanitized) {
        showError(errorDiv, 'Age is required');
        return false;
    } else if (age < 10 || age > 120) {
        showError(errorDiv, 'Age must be between 10 and 120');
        return false;
    } else {
        clearError(errorDiv);
        return true;
    }
}

function validateHeight() {
    const heightInput = document.getElementById('height');
    const errorDiv = document.getElementById('height-error');
    
    const sanitized = sanitizeNumberInput(heightInput.value, true);
    heightInput.value = sanitized;
    
    const height = parseFloat(sanitized);
    
    if (!sanitized) {
        showError(errorDiv, 'Height is required');
        return false;
    } else if (height <= 0) {
        showError(errorDiv, 'Height must be a positive number');
        return false;
    } else {
        clearError(errorDiv);
        return true;
    }
}

function validateWeight() {
    const weightInput = document.getElementById('weight');
    const errorDiv = document.getElementById('weight-error');
    
    const sanitized = sanitizeNumberInput(weightInput.value, true);
    weightInput.value = sanitized;
    
    const weight = parseFloat(sanitized);
    
    if (!sanitized) {
        showError(errorDiv, 'Weight is required');
        return false;
    } else if (weight <= 0) {
        showError(errorDiv, 'Weight must be a positive number');
        return false;
    } else {
        clearError(errorDiv);
        return true;
    }
}

function validateActivity() {
    const activitySelect = document.getElementById('activity-level');
    const errorDiv = document.getElementById('activity-error');
    
    if (!activitySelect.value) {
        showError(errorDiv, 'Please select your activity level');
        return false;
    } else {
        clearError(errorDiv);
        return true;
    }
}

function showError(errorDiv, message) {
    errorDiv.textContent = message;
}

function clearError(errorDiv) {
    errorDiv.textContent = '';
}

function setupGenderSelection() {
    const maleBtn = document.getElementById('male-btn');
    const femaleBtn = document.getElementById('female-btn');
    
    maleBtn.addEventListener('click', () => selectGender('male'));
    femaleBtn.addEventListener('click', () => selectGender('female'));
}

function selectGender(gender) {
    selectedGender = gender;
    
    const maleBtn = document.getElementById('male-btn');
    const femaleBtn = document.getElementById('female-btn');
    const errorDiv = document.getElementById('gender-error');
    
    maleBtn.classList.toggle('selected', gender === 'male');
    femaleBtn.classList.toggle('selected', gender === 'female');
    
    clearError(errorDiv);
    checkStep1Validity();
}

function setupGoalSelection() {
    const goalButtons = document.querySelectorAll('.goal-btn');
    
    goalButtons.forEach(button => {
        button.addEventListener('click', () => selectGoal(button.dataset.value));
    });
}

function selectGoal(goal) {
    selectedGoal = goal;
    
    const goalButtons = document.querySelectorAll('.goal-btn');
    const errorDiv = document.getElementById('goal-error');
    
    goalButtons.forEach(button => {
        button.classList.toggle('selected', button.dataset.value === goal);
    });
    
    clearError(errorDiv);
    document.getElementById('complete-btn').disabled = false;
}

function checkStep1Validity() {
    const isAgeValid = validateAge();
    const isHeightValid = validateHeight();
    const isWeightValid = validateWeight();
    const isActivityValid = validateActivity();
    const isGenderSelected = selectedGender !== '';
    
    const isValid = isAgeValid && isHeightValid && isWeightValid && isActivityValid && isGenderSelected;
    
    if (!isGenderSelected && document.getElementById('age').value) {
        showError(document.getElementById('gender-error'), 'Please select your gender');
    }
    
    document.getElementById('next-btn').disabled = !isValid;
    return isValid;
}

function handleStep1Submit(e) {
    e.preventDefault();
    
    if (checkStep1Validity()) {
        goToStep2();
    } else {
        focusFirstInvalidField();
    }
}

function focusFirstInvalidField() {
    const fields = ['activity-level', 'age', 'height', 'weight'];
    
    for (const fieldId of fields) {
        const field = document.getElementById(fieldId);
        if (!field.value || field.value <= 0) {
            field.focus();
            return;
        }
    }
    
    if (!selectedGender) {
        document.getElementById('male-btn').focus();
    }
}

function convertInToCm(inches) {
    return inches * 2.54;
}

function convertLbToKg(pounds) {
    return pounds * 0.453592;
}

function computeBMR(weightKg, heightCm, age, gender) {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return gender === 'male' ? base + 5 : base - 161;
}

function computeTDEE(bmr, activityDays) {
    let multiplier;
    
    if (activityDays <= 1) {
        multiplier = 1.2;
    } else if (activityDays <= 3) {
        multiplier = 1.375;
    } else if (activityDays <= 5) {
        multiplier = 1.55;
    } else {
        multiplier = 1.725;
    }
    
    return bmr * multiplier;
}

function goToStep2() {
    document.getElementById('step-1').classList.remove('active');
    document.getElementById('step-2').classList.add('active');
    document.getElementById('modal-title').textContent = 'Choose Your Goal';
}

function goToStep1() {
    document.getElementById('step-2').classList.remove('active');
    document.getElementById('step-1').classList.add('active');
    document.getElementById('modal-title').textContent = 'Set Up Your Profile';
}

function completeOnboarding() {
    if (!selectedGoal) {
        showError(document.getElementById('goal-error'), 'Please select your goal');
        return;
    }
    
    const age = parseInt(document.getElementById('age').value);
    const heightValue = parseFloat(document.getElementById('height').value);
    const heightUnit = document.getElementById('height-unit').value;
    const weightValue = parseFloat(document.getElementById('weight').value);
    const weightUnit = document.getElementById('weight-unit').value;
    const activityDays = parseInt(document.getElementById('activity-level').value);
    
    const heightCm = heightUnit === 'in' ? convertInToCm(heightValue) : heightValue;
    const weightKg = weightUnit === 'lb' ? convertLbToKg(weightValue) : weightValue;
    
    const bmr = computeBMR(weightKg, heightCm, age, selectedGender);
    const tdee = computeTDEE(bmr, activityDays);
    
    let calories;
    switch (selectedGoal) {
        case 'cutting':
            calories = Math.round(tdee * 0.80);
            break;
        case 'maintaining':
            calories = Math.round(tdee * 1.00);
            break;
        case 'bulking':
            calories = Math.round(tdee * 1.15);
            break;
    }
    
    userProfile = {
        age,
        height: heightValue,
        heightUnit,
        weight: weightValue,
        weightUnit,
        heightCm,
        weightKg,
        gender: selectedGender,
        activityDays,
        goal: selectedGoal,
        bmr,
        tdee,
        calories,
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('calorie_tracker_profile', JSON.stringify(userProfile));
    
    hideOnboarding();
    showDashboard();
}

function cancelOnboarding() {
    const existingProfile = localStorage.getItem('calorie_tracker_profile');
    
    if (!existingProfile) {
        userProfile = {
            calories: 2000,
            goal: 'maintaining',
            isDefault: true
        };
        localStorage.setItem('calorie_tracker_profile', JSON.stringify(userProfile));
    }
    
    hideOnboarding();
    showDashboard();
}

function editProfile() {
    if (userProfile.age) document.getElementById('age').value = userProfile.age;
    if (userProfile.height) document.getElementById('height').value = userProfile.height;
    if (userProfile.heightUnit) document.getElementById('height-unit').value = userProfile.heightUnit;
    if (userProfile.weight) document.getElementById('weight').value = userProfile.weight;
    if (userProfile.weightUnit) document.getElementById('weight-unit').value = userProfile.weightUnit;
    if (userProfile.activityDays !== undefined) document.getElementById('activity-level').value = userProfile.activityDays;
    
    if (userProfile.gender) {
        selectGender(userProfile.gender);
    }
    
    selectedGoal = userProfile.goal || '';
    
    showOnboarding();
}

function showOnboarding() {
    document.getElementById('onboarding-modal').style.display = 'flex';
    
    document.getElementById('step-2').classList.remove('active');
    document.getElementById('step-1').classList.add('active');
    document.getElementById('modal-title').textContent = 'Set Up Your Profile';
    
    selectedGender = userProfile.gender || '';
    selectedGoal = '';
    
    document.querySelectorAll('.select-btn').forEach(btn => btn.classList.remove('selected'));
    if (selectedGender) {
        document.getElementById(selectedGender + '-btn').classList.add('selected');
    }
    
    checkStep1Validity();
}

function hideOnboarding() {
    document.getElementById('onboarding-modal').style.display = 'none';
}

function showDashboard() {
    const calorieCounter = document.getElementById('calorie-counter');
    const dailyCalories = document.getElementById('daily-calories');
    
    dailyCalories.textContent = userProfile.calories || 2000;
    calorieCounter.classList.remove('hidden');
    
    if (!userProfile.isDefault) {
        const profileSummary = document.getElementById('profile-summary');
        const profileDetails = document.getElementById('profile-details');
        
        const goalText = {
            cutting: 'Cutting (Lose weight)',
            maintaining: 'Maintaining (Maintain weight)',
            bulking: 'Bulking (Gain weight)'
        };
        
        profileDetails.innerHTML = `
            <strong>Age:</strong> ${userProfile.age} years<br>
            <strong>Height:</strong> ${userProfile.height} ${userProfile.heightUnit}<br>
            <strong>Weight:</strong> ${userProfile.weight} ${userProfile.weightUnit}<br>
            <strong>Activity:</strong> ${userProfile.activityDays} days/week<br>
            <strong>Goal:</strong> ${goalText[userProfile.goal]}<br>
            <strong>Daily Calories:</strong> ${userProfile.calories} kcal
        `;
        
        profileSummary.classList.remove('hidden');
    }
}

// ===== EXISTING UPLOAD FUNCTIONALITY =====

function initializeUploadForm() {
    const form = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-input');
    const loader = document.getElementById('loader');
    const resultDiv = document.getElementById('result');
    const submitButton = form.querySelector('button');

    console.log('Elements found:', {
        form: !!form,
        fileInput: !!fileInput,
        loader: !!loader,
        resultDiv: !!resultDiv,
        submitButton: !!submitButton
    });

    form.addEventListener('submit', async (event) => {
        console.log('Form submitted');
        event.preventDefault();

        if (!fileInput.files.length) {
            displayError('Please select a file to upload.');
            return;
        }

        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);

        try {
            const API_URL = "/api/analyze";
            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            
            console.log('API Response:', data);
            console.log('Response ok status:', response.ok);
            console.log('Data ok property:', data.ok);

            if (!response.ok) {
                const errorMessage = data.detail || 'An unknown error occurred.';
                displayError(errorMessage);
            } else if (!data.ok) {
                displayError(data.message);
            } else {
                displayResult(data);
            }

        } catch (error) {
            console.error('Error uploading file:', error);
            displayError('Failed to connect to the server. Please try again.');
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        loader.style.display = isLoading ? 'block' : 'none';
        submitButton.disabled = isLoading;
        if (isLoading) {
            resultDiv.style.display = 'none';
        }
    }

    function displayError(message) {
        resultDiv.style.display = 'block';
        resultDiv.className = 'error';
        resultDiv.innerHTML = `<p><strong>Error:</strong> ${message}</p>`;
    }

    function displayResult(data) {
        console.log('displayResult called with data:', data);
        console.log('resultDiv element:', resultDiv);
        
        resultDiv.style.display = 'block';
        resultDiv.className = '';

        let html = `
            <h2>${capitalize(data.food)}</h2>
            <p><strong>Estimated Calories:</strong> ${data.calories_est}</p>
            <p><strong>Confidence:</strong> ${(data.confidence * 100).toFixed(0)}%</p>
        `;

        if (data.advice === 'low_confidence') {
            resultDiv.classList.add('low-confidence');
            html += `<p><em>Confidence is low. Try another photo for a better estimate.</em></p>`;
        }

        resultDiv.innerHTML = html;
        console.log('Result HTML set:', html);
    }

    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
