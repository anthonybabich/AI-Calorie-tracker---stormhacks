console.log('app.js loaded successfully');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    
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

        // --- UI updates for loading state ---
        setLoading(true);

        try {
            const API_URL = "/api/analyze";
            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            
            // Debug: Log the response data
            console.log('API Response:', data);
            console.log('Response ok status:', response.ok);
            console.log('Data ok property:', data.ok);

            if (!response.ok) {
                // Handle HTTP errors (e.g., 400, 500)
                const errorMessage = data.detail || 'An unknown error occurred.';
                displayError(errorMessage);
            } else if (!data.ok) {
                // Handle application-specific errors (e.g., blurry image)
                displayError(data.message);
            } else {
                // Display success result
                displayResult(data);
            }

        } catch (error) {
            console.error('Error uploading file:', error);
            displayError('Failed to connect to the server. Please try again.');
        } finally {
            // --- UI updates to end loading state ---
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        loader.style.display = isLoading ? 'block' : 'none';
        submitButton.disabled = isLoading;
        if (isLoading) {
            resultDiv.style.display = 'none'; // Only hide when starting to load
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
});
