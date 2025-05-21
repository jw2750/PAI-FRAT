document.addEventListener('DOMContentLoaded', function() {
    // Get references to elements
    const riskScoreTable = document.getElementById('riskScoreTable');
    const backBtn = document.getElementById('backBtn');
    const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');
    const saveBtn = document.getElementById('saveBtn');
    
    // Default risk scores by category and factor
    const defaultRiskScores = {
        pilot: {
            "Less than 50 Hours in Aircraft or Avionics Type": 5,
            "Less than 15 hours in the last 90 days": 3,
            "Flight will occur after work": 4,
            "Less than 8 hours sleep prior to flight": 5,
            "Dual Instruction Received in last 90 days": -1,
            "WINGS Phase Completion in last 6 months": -3,
            "Instrument Rating current and proficient": -3
        },
        conditions: {
            "Twilight or Night": 5,
            "Surface wind greater than 15 Knots": 4,
            "Cross wind greater than 7 Knots": 4,
            "Mountainous Terrain": 4
        },
        airport: {
            "Non-towered Airport or tower closed at ETD or ETA": 5,
            "Runway length less than 3,000 Feet": 3,
            "Wet or soft field Runway": 3,
            "Obstacles on Approach and/or departure": 3
        },
        vfr: {
            "Ceiling less than 3,000 feet AGL": 2,
            "Visibility less than 5 SM": 2,
            "No Weather Reporting at destination": 4,
            "Flight Plan filed and activated": -2,
            "ATC Flight Following used": -3
        },
        ifr: {
            "Ceiling less than 1000 feet AGL": 2,
            "Visibility less than 3 SM": 2,
            "No Weather Reporting at destination": 4
        },
        approach: {
            "Precision Approach": -2,
            "Non-precision Approach": 3,
            "No Instrument Approach": 4,
            "Circling Approach": 7
        }
    };
    
    // Category display names for better readability
    const categoryDisplayNames = {
        pilot: "Pilot",
        conditions: "Flight Conditions",
        airport: "Airport",
        vfr: "VFR Flight Plan",
        ifr: "IFR Flight Plan",
        approach: "Approaches"
    };
    
    // Load risk scores from localStorage or use defaults
    let currentRiskScores = JSON.parse(localStorage.getItem('riskScores')) || JSON.parse(JSON.stringify(defaultRiskScores));
    
    // Function to populate the table with risk factors and scores
    function populateRiskScoreTable() {
        const tbody = riskScoreTable.querySelector('tbody');
        tbody.innerHTML = ''; // Clear existing content
        
        // Loop through each category
        Object.keys(currentRiskScores).forEach(category => {
            // Add category header row
            const categoryRow = document.createElement('tr');
            categoryRow.className = 'category-header';
            categoryRow.innerHTML = `
                <td colspan="3">${categoryDisplayNames[category] || category}</td>
            `;
            tbody.appendChild(categoryRow);
            
            // Add rows for each risk factor in this category
            Object.entries(currentRiskScores[category]).forEach(([factor, score]) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${categoryDisplayNames[category] || category}</td>
                    <td>${factor}</td>
                    <td>
                        <input type="number" 
                               class="risk-score-input ${score < 0 ? 'negative-score' : 'positive-score'}" 
                               data-category="${category}" 
                               data-factor="${factor}" 
                               value="${score}">
                    </td>
                `;
                tbody.appendChild(row);
            });
        });
        
        // Add event listeners to inputs to update color based on value
        document.querySelectorAll('.risk-score-input').forEach(input => {
            input.addEventListener('input', function() {
                const value = parseInt(this.value) || 0;
                this.className = `risk-score-input ${value < 0 ? 'negative-score' : 'positive-score'}`;
            });
        });
    }
    
    // Function to save the updated risk scores
    function saveRiskScores() {
        // Create a new object to store the updated scores
        const updatedScores = JSON.parse(JSON.stringify(currentRiskScores));
        
        // Update with values from the inputs
        document.querySelectorAll('.risk-score-input').forEach(input => {
            const category = input.getAttribute('data-category');
            const factor = input.getAttribute('data-factor');
            const score = parseInt(input.value) || 0;
            
            updatedScores[category][factor] = score;
        });
        
        // Save to localStorage
        localStorage.setItem('riskScores', JSON.stringify(updatedScores));
        currentRiskScores = updatedScores;
        
        // Log to console for debugging
        console.log('Risk scores saved to localStorage:', updatedScores);
        
        // Show confirmation
        alert('Risk score values have been saved successfully.');
    }
    
    // Function to reset to default values
    function resetToDefaults() {
        if (confirm('Are you sure you want to reset all risk scores to their default values?')) {
            currentRiskScores = JSON.parse(JSON.stringify(defaultRiskScores));
            localStorage.setItem('riskScores', JSON.stringify(currentRiskScores));
            populateRiskScoreTable();
            alert('Risk scores have been reset to default values.');
        }
    }
    
    // Add event listeners to buttons
    backBtn.addEventListener('click', function() {
        // Navigate back to the main page
        window.location.href = 'index-original.html';
    });
    
    resetDefaultsBtn.addEventListener('click', resetToDefaults);
    
    saveBtn.addEventListener('click', saveRiskScores);
    
    // Initialize the table
    populateRiskScoreTable();
});
