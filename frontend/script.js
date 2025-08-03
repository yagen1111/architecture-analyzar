console.log("Script loaded!");



const ownerInput = document.getElementById('owner');
const repoInput = document.getElementById('repo');
const analyzeBtn = document.getElementById('analyzeBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultsSection = document.getElementById('resultsSection');
const architectureDiagram = document.getElementById('architectureDiagram');
const errorMessage = document.getElementById('errorMessage');

console.log("Elements found:", { analyzeBtn, ownerInput, repoInput });

// Progress animation
function updateProgress(percentage, text) {
    progressFill.style.width = percentage + '%';
    progressText.textContent = text;
}

// Simulate progress while waiting for backend
function startProgressAnimation() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 5;
        if (progress >= 90) {
            clearInterval(interval);
            progress = 90;
        }
        updateProgress(progress, 'Processing repository...');
    }, 500);
    return interval;
}

// Main analysis function
analyzeBtn.addEventListener('click', async () => {
    console.log("Button clicked!");
    
    const owner = ownerInput.value.trim();
    const repo = repoInput.value.trim();
    console.log("Owner input:", owner);
    console.log("Repository input:", repo);

    if (!owner || !repo) {
        alert('Please enter both repository owner and repository name');
        return;
    }
    
    // Combine owner and repo for compatibility
    const fullRepoName = `${owner}/${repo}`;

    // Reset UI
    errorMessage.style.display = 'none';
    resultsSection.style.display = 'none';
    progressSection.style.display = 'block';
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';

    // Start progress animation
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        updateProgress(progress, `Analyzing ${fullRepoName}...`);
    }, 200);

    try {
        // Send owner and repo to your main.py backend
        const response = await fetch('http://localhost:5000/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                owner: owner,
                repo: repo
            })
        });
        
        const result = await response.json();
        
        clearInterval(progressInterval);
        
        if (result.success) {
            updateProgress(100, 'Analysis complete!');
            
            // Log the services array for debugging
            console.log("=== BACKEND RESPONSE DEBUG ===");
            console.log("Full result:", result);
            console.log("Services array received:", result.services_array);
            console.log("Services array type:", typeof result.services_array);
            console.log("Services array length:", result.services_array ? result.services_array.length : 'undefined');
            
            // Open message.html with repository input, backend response, and services array
            setTimeout(() => {
                const servicesParam = encodeURIComponent(JSON.stringify(result.services_array));
                console.log("Encoded services parameter:", servicesParam);
                
                const messageUrl = `message.html?repo=${encodeURIComponent(fullRepoName)}&response=${encodeURIComponent(result.analysis)}&services=${servicesParam}`;
                console.log("Opening:", messageUrl);
                window.location.href = messageUrl;
            }, 1000);
        } else {
            throw new Error(result.error || 'Analysis failed');
        }
        
    } catch (error) {
        clearInterval(progressInterval);
        console.error('Error calling backend:', error);
        
        // Show error message
        updateProgress(0, 'Analysis failed');
        errorMessage.textContent = `Error: ${error.message}. Make sure the backend server is running on port 5000.`;
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
        resultsSection.style.display = 'block';
    }

    // Reset button
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = '🔍 Analyze Architecture';
});

// Enter key support for both input fields
ownerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        analyzeBtn.click();
    }
});

repoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        analyzeBtn.click();
    }
});

console.log("Event listeners added!");