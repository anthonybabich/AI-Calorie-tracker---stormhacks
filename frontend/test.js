// Simple test file
alert('Test JavaScript file loaded successfully!');

document.addEventListener('DOMContentLoaded', function() {
    alert('DOM loaded - setting up simple button test');
    
    // Test direct button clicks
    const addFoodBtn = document.getElementById('add-food-btn');
    const checkFoodBtn = document.getElementById('check-food-btn');
    const profileBtn = document.getElementById('setup-profile-btn');
    
    if (addFoodBtn) {
        addFoodBtn.addEventListener('click', function() {
            alert('Add Food button works! Navigating...');
            window.location.href = 'add_food.html?mode=add';
        });
    }
    
    if (checkFoodBtn) {
        checkFoodBtn.addEventListener('click', function() {
            alert('Check Food button works! Navigating...');
            window.location.href = 'add_food.html?mode=check';
        });
    }
    
    if (profileBtn) {
        profileBtn.addEventListener('click', function() {
            alert('Profile button works! (Modal functionality not included in test)');
        });
    }
});