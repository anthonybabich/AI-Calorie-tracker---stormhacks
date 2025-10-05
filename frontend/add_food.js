// ===== GLOBAL STATE =====
let currentMode = 'add'; // 'add' or 'check'
let selectedFile = null;
let currentEstimation = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initializeMode();
    setupEventListeners();
    setupDragAndDrop();
});

// ===== MODE MANAGEMENT =====
function initializeMode() {
    const urlParams = new URLSearchParams(window.location.search);
    currentMode = urlParams.get('mode') || 'add';
    
    const modeIndicator = document.getElementById('mode-indicator');
    const actionButton = document.getElementById('action-button');
    const backButton = document.getElementById('back-button');
    
    if (currentMode === 'check') {
        modeIndicator.textContent = 'Check Mode';
        modeIndicator.className = 'mode-indicator check';
        
        // Hide the back button completely in check mode
        if (backButton) {
            backButton.style.display = 'none';
        }
        
        // Make action button say "Go Back" and span full width
        if (actionButton) {
            actionButton.textContent = 'Go Back';
            actionButton.style.display = 'block';
            actionButton.style.width = '100%';
            actionButton.style.flex = '1';
            actionButton.disabled = false;
        }
        
        // Aggressively remove manual entry section in check mode
        setTimeout(() => {
            const manualEntry = document.getElementById('manual-entry');
            if (manualEntry) {
                console.log('Removing manual entry section in check mode');
                manualEntry.style.display = 'none';
                manualEntry.remove();
                manualEntry.parentNode?.removeChild(manualEntry);
            }
            
            // Also remove any elements with manual-entry class
            const manualElements = document.querySelectorAll('.manual-entry');
            manualElements.forEach(el => {
                el.style.display = 'none';
                el.remove();
            });
            
            console.log('Manual entry removal complete');
        }, 50);
        
        // Set up a continuous check to prevent manual entry from ever appearing
        setInterval(() => {
            if (currentMode === 'check') {
                const manualEntry = document.getElementById('manual-entry');
                if (manualEntry) {
                    manualEntry.style.display = 'none !important';
                    manualEntry.classList.remove('show');
                    manualEntry.remove();
                }
            }
        }, 100);
        
        document.body.classList.add('check-mode');
    } else {
        modeIndicator.textContent = 'Add Mode';
        modeIndicator.className = 'mode-indicator add';
        
        // Show both buttons in add mode
        if (backButton) {
            backButton.style.display = 'block';
            backButton.style.width = '';
            backButton.style.flex = '';
        }
        
        if (actionButton) {
            actionButton.textContent = 'Add to Log';
            actionButton.style.display = 'block';
            actionButton.style.width = '';
            actionButton.style.flex = '';
        }
        
        document.body.classList.add('add-mode');
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // File inputs (both camera and browse)
    document.getElementById('camera-input').addEventListener('change', handleFileSelection);
    document.getElementById('file-input').addEventListener('change', handleFileSelection);
    
    // Estimate button
    document.getElementById('estimate-button').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        estimateFood();
    });
    
    // Action buttons
    document.getElementById('back-button').addEventListener('click', goBack);
    document.getElementById('action-button').addEventListener('click', handleAction);
    
    // Manual entry inputs
    document.getElementById('manual-calories').addEventListener('input', updateManualEstimation);
    document.getElementById('manual-carbs').addEventListener('input', updateManualEstimation);
    document.getElementById('manual-protein').addEventListener('input', updateManualEstimation);
    document.getElementById('manual-fat').addEventListener('input', updateManualEstimation);
    document.getElementById('manual-name').addEventListener('input', updateManualEstimation);
}

// ===== DRAG AND DROP =====
function setupDragAndDrop() {
    const uploadSection = document.getElementById('upload-section');
    
    uploadSection.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadSection.classList.add('dragover');
    });
    
    uploadSection.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadSection.classList.remove('dragover');
    });
    
    uploadSection.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadSection.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            handleFile(files[0]);
        }
    });
}

// ===== FILE HANDLING =====
function handleFileSelection(event) {
    const file = event.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    selectedFile = file;
    
    // Show file preview
    const selectedFileDiv = document.getElementById('selected-file');
    const preview = document.getElementById('file-preview');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
        preview.src = e.target.result;
    };
    reader.readAsDataURL(file);
    
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    
    selectedFileDiv.classList.add('show');
    document.getElementById('estimate-button').disabled = false;
    
    // Hide previous results
    document.getElementById('estimation-result').classList.remove('show');
    document.getElementById('manual-entry').classList.remove('show');
    document.getElementById('action-button').disabled = true;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ===== FOOD ESTIMATION =====
async function estimateFood() {
    console.log('Starting food estimation...');
    
    if (!selectedFile) {
        console.error('No file selected');
        showToast('Please select a file first.', true);
        return;
    }
    
    console.log('Selected file:', selectedFile.name);
    showLoading(true);
    
    try {
        console.log('Calling estimateFromImage...');
        const estimation = await estimateFromImage(selectedFile);
        console.log('Estimation result:', estimation);
        
        currentEstimation = estimation;
        
        showEstimationResult(estimation);
        
        if (estimation.confidence < 0.6) {
            showManualEntry();
            showSuggestions();
        }
        
        document.getElementById('action-button').disabled = false;
        
    } catch (error) {
        console.error('Estimation error:', error);
        console.error('Error stack:', error.stack);
        showToast('Failed to estimate food. Error: ' + error.message, true);
    } finally {
        showLoading(false);
    }
}

// ===== ESTIMATION FUNCTIONS (same as app.js) =====
async function estimateFromImage(file) {
    console.log('Making API call to backend...');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('http://localhost:8000/api/analyze', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('API response:', result);
        
        if (!result.ok) {
            throw new Error(result.message || 'API returned error');
        }
        
        // Transform API response to match expected format
        return {
            name: result.food || 'Unknown food',
            calories: result.calories || 200,
            carbs_g: result.carbs_g || Math.round(result.calories * 0.5 / 4), // 50% carbs default
            protein_g: result.protein_g || Math.round(result.calories * 0.2 / 4), // 20% protein default  
            fat_g: result.fat_g || Math.round(result.calories * 0.3 / 9), // 30% fat default
            confidence: result.confidence || 0.5
        };
        
    } catch (error) {
        console.error('API call failed:', error);
        
        // Fallback to local estimation if API fails
        console.log('Falling back to local estimation...');
        return getLocalEstimation(file);
    }
}

function getLocalEstimation(file) {
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
            return food;
        }
    }
    
    // Unknown food - return default estimation
    return {
        name: "Unknown food item",
        calories: 200,
        carbs_g: 25,
        protein_g: 8,
        fat_g: 8,
        confidence: 0.4
    };
}

// ===== UI UPDATES =====
function showLoading(show) {
    document.getElementById('loading-spinner').style.display = show ? 'block' : 'none';
    document.getElementById('estimate-button').disabled = show;
}

function showEstimationResult(estimation) {
    // Debug the estimation object
    console.debug('Showing estimation result:', estimation);
    
    document.getElementById('result-food-name').textContent = estimation.name;
    document.getElementById('result-calories').textContent = estimation.calories;
    
    // Handle both possible property names for macros
    const carbs = estimation.carbs_g || estimation.carbs || 0;
    const protein = estimation.protein_g || estimation.protein || 0;
    const fat = estimation.fat_g || estimation.fat || 0;
    
    document.getElementById('result-carbs').textContent = Math.round(carbs * 10) / 10;
    document.getElementById('result-protein').textContent = Math.round(protein * 10) / 10;
    document.getElementById('result-fat').textContent = Math.round(fat * 10) / 10;
    
    console.debug('Displaying macros:', { carbs, protein, fat });
    
    // Update confidence badge
    const confidenceBadge = document.getElementById('confidence-badge');
    if (estimation.confidence >= 0.8) {
        confidenceBadge.textContent = 'High Confidence';
        confidenceBadge.className = 'confidence-badge confidence-high';
    } else if (estimation.confidence >= 0.6) {
        confidenceBadge.textContent = 'Medium Confidence';
        confidenceBadge.className = 'confidence-badge confidence-medium';
    } else {
        confidenceBadge.textContent = 'Low Confidence';
        confidenceBadge.className = 'confidence-badge confidence-low';
    }
    
    document.getElementById('estimation-result').classList.add('show');
}

function showManualEntry() {
    // Don't show manual entry in check mode
    if (currentMode === 'check') {
        return;
    }
    
    document.getElementById('manual-entry').classList.add('show');
    
    // Pre-fill with current estimation
    if (currentEstimation) {
        document.getElementById('manual-name').value = currentEstimation.name;
        document.getElementById('manual-calories').value = currentEstimation.calories;
        document.getElementById('manual-carbs').value = Math.round(currentEstimation.carbs_g * 10) / 10;
        document.getElementById('manual-protein').value = Math.round(currentEstimation.protein_g * 10) / 10;
        document.getElementById('manual-fat').value = Math.round(currentEstimation.fat_g * 10) / 10;
    }
}

function showSuggestions() {
    const suggestions = [
        { name: "Generic meal", calories: 400, carbs_g: 45, protein_g: 15, fat_g: 18 },
        { name: "Snack item", calories: 150, carbs_g: 20, protein_g: 3, fat_g: 6 },
        { name: "Beverage", calories: 100, carbs_g: 25, protein_g: 0, fat_g: 0 }
    ];
    
    const suggestionList = document.getElementById('suggestion-list');
    suggestionList.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-item" onclick="selectSuggestion(${JSON.stringify(suggestion).replace(/"/g, '&quot;')})">
            <span class="suggestion-name">${suggestion.name}</span>
            <span class="suggestion-calories">${suggestion.calories} kcal</span>
        </div>
    `).join('');
    
    document.getElementById('suggestions').style.display = 'block';
}

function selectSuggestion(suggestion) {
    currentEstimation = { ...suggestion, confidence: 0.5 };
    showEstimationResult(currentEstimation);
    
    // Update manual entry
    document.getElementById('manual-name').value = suggestion.name;
    document.getElementById('manual-calories').value = suggestion.calories;
    document.getElementById('manual-carbs').value = Math.round(suggestion.carbs_g * 10) / 10;
    document.getElementById('manual-protein').value = Math.round(suggestion.protein_g * 10) / 10;
    document.getElementById('manual-fat').value = Math.round(suggestion.fat_g * 10) / 10;
    
    document.getElementById('suggestions').style.display = 'none';
}

function updateManualEstimation() {
    const name = document.getElementById('manual-name').value;
    const calories = parseFloat(document.getElementById('manual-calories').value) || 0;
    const carbs = parseFloat(document.getElementById('manual-carbs').value) || 0;
    const protein = parseFloat(document.getElementById('manual-protein').value) || 0;
    const fat = parseFloat(document.getElementById('manual-fat').value) || 0;
    
    // Auto-calculate macros from calories if only calories entered
    if (calories > 0 && carbs === 0 && protein === 0 && fat === 0) {
        // Use default macro split: 50% carbs, 20% protein, 30% fat
        const calculatedCarbs = Math.round((calories * 0.5) / 4);
        const calculatedProtein = Math.round((calories * 0.2) / 4);
        const calculatedFat = Math.round((calories * 0.3) / 9);
        
        document.getElementById('manual-carbs').value = calculatedCarbs;
        document.getElementById('manual-protein').value = calculatedProtein;
        document.getElementById('manual-fat').value = calculatedFat;
    }
    
    if (name && calories > 0) {
        currentEstimation = {
            name: name,
            calories: calories,
            carbs_g: carbs,
            protein_g: protein,
            fat_g: fat,
            confidence: 0.5
        };
        
        showEstimationResult(currentEstimation);
        document.getElementById('action-button').disabled = false;
    }
}

// ===== ACTIONS =====
function handleAction() {
    if (currentMode === 'add') {
        addToLog();
    } else {
        goBack();
    }
}

function addToLog() {
    if (!currentEstimation) return;
    
    try {
        // Get today's date key
        const today = new Date();
        const dayKey = getDayKey(today);
        
        // Get existing day data or create new one (matching app.js structure)
        const storedData = localStorage.getItem(dayKey);
        let dayData;
        
        if (storedData) {
            dayData = JSON.parse(storedData);
        } else {
            dayData = {
                date: today.toISOString().split('T')[0],
                eatenCalories: 0,
                carbs_g: 0,
                protein_g: 0,
                fat_g: 0,
                entries: []
            };
        }
        
        // Create food entry
        const entry = {
            id: Date.now(),
            name: currentEstimation.name || 'Food Item',
            calories: parseFloat(currentEstimation.calories) || 0,
            carbs_g: parseFloat(currentEstimation.carbs || currentEstimation.carbs_g) || 0,
            protein_g: parseFloat(currentEstimation.protein || currentEstimation.protein_g) || 0,
            fat_g: parseFloat(currentEstimation.fat || currentEstimation.fat_g) || 0,
            timestamp: new Date().toISOString()
        };
        
        // Debug logging
        console.debug('Current estimation:', currentEstimation);
        console.debug('Created entry:', entry);
        
        // Add to entries array
        dayData.entries.push(entry);
        
        // Update totals
        dayData.eatenCalories += entry.calories;
        dayData.carbs_g += entry.carbs_g;
        dayData.protein_g += entry.protein_g;
        dayData.fat_g += entry.fat_g;
        
        // Debug final day data
        console.debug('Final day data before saving:', dayData);
        
        // Save back to localStorage using the same key format as app.js
        localStorage.setItem(dayKey, JSON.stringify(dayData));
        
        showToast(`Added ${entry.calories} kcal - ${entry.name}`);
        
        // Navigate back to dashboard after a short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error adding food:', error);
        showToast('Failed to add food to log. Please try again.', true);
    }
}

function goBack() {
    window.location.href = 'index.html';
}

// ===== UTILITY FUNCTIONS =====
function getDayKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `calorie_tracker_day_${year}-${month}-${day}`;
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
    
    return newEntry;
}

function loadDay(date) {
    const key = getDayKey(date);
    const stored = localStorage.getItem(key);
    
    if (stored) {
        return JSON.parse(stored);
    }
    
    // Return default day structure
    return {
        date: date.toISOString().split('T')[0],
        eatenCalories: 0,
        carbs_g: 0,
        protein_g: 0,
        fat_g: 0,
        entries: []
    };
}

function saveDay(dayObj) {
    const date = new Date(dayObj.date);
    const key = getDayKey(date);
    localStorage.setItem(key, JSON.stringify(dayObj));
}

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

// ===== WINDOW FUNCTIONS (for global access) =====
window.selectSuggestion = selectSuggestion;