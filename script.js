document.addEventListener('DOMContentLoaded', function() {
    // Get references to elements
    const riskCells = document.querySelectorAll('.col-checkbox-score');
    const totalRiskScoreElement = document.getElementById('totalRiskScore');
    const clearBtn = document.getElementById('clearBtn');
    const showLogBtn = document.getElementById('showLogBtn');
    const transferBtn = document.getElementById('transferBtn');
    const adjustRiskScoresBtn = document.getElementById('adjustRiskScoresBtn');
    const flightplanTypeRadios = document.querySelectorAll('input[name="flightplanType"]');
    const vfrSection = document.querySelector('.vfr-section');
    const ifrSection = document.querySelector('.ifr-section');
    const approachSection = document.querySelector('.approach-section');
    const pilotExperienceInput = document.getElementById('pilotExperience');
    const sections = document.querySelectorAll('.section');
    
    // For testing mobile view - uncomment this line to force mobile view
    // window.innerWidth = 500; // Force mobile view for testing
    
    // Check if we're on a mobile device
    const isMobile = window.innerWidth <= 576;
    
    // Load risk scores from localStorage or use the default scores in data-score attributes
    loadRiskScores();
    
    // Check if there's a saved flight plan type in localStorage
    const savedFlightPlanType = localStorage.getItem('selectedFlightPlanType');
    if (savedFlightPlanType) {
        // Update the radio button selection based on the saved value
        document.getElementById('ifr').checked = (savedFlightPlanType === 'IFR');
        document.getElementById('vfr').checked = (savedFlightPlanType === 'VFR');
        console.log('Loaded flight plan type from localStorage:', savedFlightPlanType);
    } else {
        // No saved flight plan type, default to IFR
        document.getElementById('ifr').checked = true;
        console.log('No saved flight plan type found, defaulting to IFR');
    }
    
    // Initialize the flight plan sections visibility
    updateFlightPlanSections();
    
    // Show IFR currency popup if IFR is selected by default and user hasn't seen it before
    if (document.getElementById('ifr').checked) {
        // Check if user has already acknowledged the IFR popup
        const hasAcknowledgedIfrPopup = localStorage.getItem('hasAcknowledgedIfrPopup') === 'true';
        if (!hasAcknowledgedIfrPopup) {
            showIfrCurrencyPopup();
        }
    }
    
    // Make sections collapsible on mobile
    if (isMobile) {
        setupMobileCollapsibleSections();
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        const newIsMobile = window.innerWidth <= 576;
        if (newIsMobile !== isMobile) {
            location.reload(); // Refresh the page to apply correct layout
        }
    });
    
    // Add event listeners to flight plan type radios
    flightplanTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const newValue = this.value;
            
            // Show IFR currency popup if changing to IFR
            if (newValue === 'IFR' && this.checked) {
                showIfrCurrencyPopup();
            }
            
            // Save the selected flight plan type to localStorage
            localStorage.setItem('selectedFlightPlanType', newValue);
            console.log('Saved flight plan type to localStorage:', newValue);
            
            updateFlightPlanSections();
        });
    });
    
    // Function to show IFR currency popup
    function showIfrCurrencyPopup() {
        // Create popup elements
        const popupOverlay = document.createElement('div');
        popupOverlay.className = 'popup-overlay';
        popupOverlay.style.position = 'fixed';
        popupOverlay.style.top = '0';
        popupOverlay.style.left = '0';
        popupOverlay.style.width = '100%';
        popupOverlay.style.height = '100%';
        popupOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        popupOverlay.style.display = 'flex';
        popupOverlay.style.justifyContent = 'center';
        popupOverlay.style.alignItems = 'center';
        popupOverlay.style.zIndex = '1000';
        
        const popupContent = document.createElement('div');
        popupContent.className = 'popup-content';
        popupContent.style.backgroundColor = 'white';
        popupContent.style.padding = '20px';
        popupContent.style.borderRadius = '5px';
        popupContent.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
        popupContent.style.maxWidth = '500px';
        popupContent.style.width = '90%';
        
        const popupTitle = document.createElement('h3');
        popupTitle.textContent = 'IFR Currency';
        popupTitle.style.marginTop = '0';
        popupTitle.style.borderBottom = '1px solid #ddd';
        popupTitle.style.paddingBottom = '10px';
        
        const popupMessage = document.createElement('p');
        popupMessage.textContent = 'By selecting IFR you are stating that you are in compliance with 14 CFR 61.57(c), Instrument Experience Requirements.';
        
        const popupButton = document.createElement('button');
        popupButton.textContent = 'I Understand';
        popupButton.style.padding = '8px 16px';
        popupButton.style.backgroundColor = '#4CAF50';
        popupButton.style.color = 'white';
        popupButton.style.border = 'none';
        popupButton.style.borderRadius = '4px';
        popupButton.style.cursor = 'pointer';
        popupButton.style.float = 'right';
        popupButton.style.marginTop = '10px';
        
        // Add click event to close the popup and mark as acknowledged
        popupButton.addEventListener('click', function() {
            // Set flag in localStorage to indicate user has seen the popup
            localStorage.setItem('hasAcknowledgedIfrPopup', 'true');
            document.body.removeChild(popupOverlay);
        });
        
        // Assemble popup
        popupContent.appendChild(popupTitle);
        popupContent.appendChild(popupMessage);
        popupContent.appendChild(popupButton);
        popupOverlay.appendChild(popupContent);
        
        // Add popup to the document
        document.body.appendChild(popupOverlay);
    }
    
    // Add event listeners to risk cells
    riskCells.forEach(cell => {
        // Only add click event to cells that have a data-score attribute
        if (cell.hasAttribute('data-score')) {
            cell.addEventListener('click', function() {
                toggleRiskCell(this);
                calculateTotalRiskScore();
            });
        }
    });
    
    // Add event listener to pilot experience input
    pilotExperienceInput.addEventListener('input', updateRiskAssessment);
    
    // Add event listeners to buttons
    clearBtn.addEventListener('click', clearInputCells);
    showLogBtn.addEventListener('click', showHistoricLog);
    transferBtn.addEventListener('click', transferToHistoricLog);
    adjustRiskScoresBtn.addEventListener('click', function() {
        window.location.href = 'risk-scores.html';
    });
    
    // Function to update flight plan sections visibility based on selected radio
    function updateFlightPlanSections() {
        const flightplanType = document.querySelector('input[name="flightplanType"]:checked').value;
        
        if (flightplanType === 'VFR') {
            vfrSection.style.display = 'block';
            ifrSection.style.display = 'none';
            // Hide the Approaches section for VFR
            if (approachSection) {
                approachSection.style.display = 'none';
            }
        } else {
            vfrSection.style.display = 'none';
            ifrSection.style.display = 'block';
            // Show the Approaches section for IFR
            if (approachSection) {
                approachSection.style.display = 'block';
            }
        }
        
        calculateTotalRiskScore();
    }
    
    // Function to load risk scores from localStorage
    function loadRiskScores() {
        const storedScores = JSON.parse(localStorage.getItem('riskScores'));
        if (storedScores) {
            // Update data-score attributes with stored values
            riskCells.forEach(cell => {
                if (cell.hasAttribute('data-score') && cell.hasAttribute('data-category')) {
                    const category = cell.getAttribute('data-category');
                    const riskRow = cell.closest('.risk-row');
                    const riskFactor = riskRow.querySelector('.col-risk-factor').textContent.trim();
                    
                    // Check if this risk factor exists in stored scores
                    if (storedScores[category] && storedScores[category][riskFactor] !== undefined) {
                        cell.setAttribute('data-score', storedScores[category][riskFactor]);
                        
                        // If the cell is already selected, update the displayed score
                        if (cell.classList.contains('selected')) {
                            const scoreDisplay = cell.querySelector('.score-display');
                            const score = parseInt(cell.getAttribute('data-score'));
                            scoreDisplay.textContent = score > 0 ? '+' + score : score;
                        }
                    }
                }
            });
        }
        
        // Log to console for debugging
        console.log('Risk scores loaded from localStorage:', storedScores);
    }
    
    // Function to toggle risk cell selection
    function toggleRiskCell(cell) {
        const scoreDisplay = cell.querySelector('.score-display');
        const score = parseInt(cell.getAttribute('data-score'));
        
        // Toggle the selected state
        if (cell.classList.contains('selected')) {
            // Deselect
            cell.classList.remove('selected', 'low-risk', 'high-risk');
            scoreDisplay.textContent = '';
        } else {
            // Select
            cell.classList.add('selected');
            scoreDisplay.textContent = score > 0 ? '+' + score : score;
            
            // Add color coding: green for negative, red for positive
            if (score < 0) {
                cell.classList.add('low-risk'); // Green for negative values
            } else if (score > 0) {
                cell.classList.add('high-risk'); // Red for positive values
            }
        }
    }
    
    // Function to calculate total risk score
    function calculateTotalRiskScore() {
        let totalScore = 0;
        const flightplanType = document.querySelector('input[name="flightplanType"]:checked').value;
        
        document.querySelectorAll('.col-checkbox-score.selected').forEach(cell => {
            if (cell.hasAttribute('data-score')) {
                // Get the category of the risk cell
                const category = cell.getAttribute('data-category');
                
                // Skip VFR section scores when IFR is selected
                if (flightplanType === 'IFR' && category === 'vfr') {
                    return;
                }
                
                // Skip IFR section scores when VFR is selected
                if (flightplanType === 'VFR' && category === 'ifr') {
                    return;
                }
                
                // Skip Approach section scores when VFR is selected
                if (flightplanType === 'VFR' && category === 'approach') {
                    return;
                }
                
                totalScore += parseInt(cell.getAttribute('data-score'));
            }
        });
        
        totalRiskScoreElement.textContent = totalScore;
        
        // Update risk assessment based on new score
        updateRiskAssessment();
    }
    
    // Function to update risk assessment based on score and pilot experience
    function updateRiskAssessment() {
        const totalScore = parseInt(totalRiskScoreElement.textContent) || 0;
        const flightplanType = document.querySelector('input[name="flightplanType"]:checked').value;
        const pilotExperience = parseInt(pilotExperienceInput.value) || 0;
        const isOver100Hours = pilotExperience > 100;
        
        // Set the risk level class on the total score element
        totalRiskScoreElement.className = 'col-checkbox-score';
        
        if (flightplanType === 'IFR') {
            if (isOver100Hours) {
                // IFR > 100 Hours
                if (totalScore >= 35) {
                    totalRiskScoreElement.classList.add('high-risk');
                } else if (totalScore >= 30) {
                    totalRiskScoreElement.classList.add('moderate-risk');
                } else if (totalScore >= 25) {
                    totalRiskScoreElement.classList.add('low-risk');
                }
            } else {
                // IFR < 100 Hours
                if (totalScore > 30) {
                    totalRiskScoreElement.classList.add('high-risk');
                } else if (totalScore >= 25) {
                    totalRiskScoreElement.classList.add('moderate-risk');
                } else if (totalScore >= 20) {
                    totalRiskScoreElement.classList.add('low-risk');
                }
            }
        } else { // VFR
            if (isOver100Hours) {
                // VFR > 100 Hours
                if (totalScore > 25) {
                    totalRiskScoreElement.classList.add('high-risk');
                } else if (totalScore >= 20) {
                    totalRiskScoreElement.classList.add('moderate-risk');
                } else if (totalScore >= 15) {
                    totalRiskScoreElement.classList.add('low-risk');
                }
            } else {
                // VFR < 100 Hours
                if (totalScore > 20) {
                    totalRiskScoreElement.classList.add('high-risk');
                } else if (totalScore >= 15) {
                    totalRiskScoreElement.classList.add('moderate-risk');
                } else if (totalScore >= 5) {
                    totalRiskScoreElement.classList.add('low-risk');
                }
            }
        }
    }
    
    // Function to clear all input cells
    function clearInputCells() {
        // Clear all selected cells and their individual scores
        document.querySelectorAll('.col-checkbox-score.selected').forEach(cell => {
            cell.classList.remove('selected', 'low-risk', 'high-risk');
            const scoreDisplay = cell.querySelector('.score-display');
            if (scoreDisplay) {
                scoreDisplay.textContent = '';
            }
        });
        
        // Clear all notes inputs
        document.querySelectorAll('.notes-input').forEach(input => {
            input.value = '';
        });
        
        // Clear date and text inputs
        document.getElementById('date').value = '';
        document.getElementById('flightId').value = '';
        document.getElementById('departureAirport').value = '';
        document.getElementById('arrivalAirport').value = '';
        document.getElementById('pilotExperience').value = '';
        
        // Keep the current flight plan type selection
        const currentFlightPlanType = document.querySelector('input[name="flightplanType"]:checked').value;
        document.getElementById('ifr').checked = (currentFlightPlanType === 'IFR');
        document.getElementById('vfr').checked = (currentFlightPlanType === 'VFR');
        
        // Update flight plan sections
        updateFlightPlanSections();
        
        // Recalculate total risk score
        calculateTotalRiskScore();
    }
    
    // No longer needed as we're using the HTML default
    
    // Function to show historic log
    function showHistoricLog() {
        window.location.href = 'historic-log.html';
    }
    
    // Function to transfer to historic log
    async function transferToHistoricLog() {
        try {
            // Get all the form data
            const date = document.getElementById('date').value;
            const flightId = document.getElementById('flightId').value;
            const departureAirport = document.getElementById('departureAirport').value;
            const arrivalAirport = document.getElementById('arrivalAirport').value;
            const flightplanType = document.querySelector('input[name="flightplanType"]:checked').value;
            const pilotExperience = document.getElementById('pilotExperience').value;
            const totalScore = totalRiskScoreElement.textContent;
            
            // Create log entry
            const logEntry = {
                date,
                flightId,
                departureAirport,
                arrivalAirport,
                flightplanType,
                pilotExperience,
                totalScore,
                timestamp: new Date().toISOString(),
                riskFactors: []
            };
            
            // Add selected risk factors to the log
            document.querySelectorAll('.col-checkbox-score.selected').forEach(cell => {
                if (cell.hasAttribute('data-score')) {
                    const category = cell.getAttribute('data-category');
                    const score = cell.getAttribute('data-score');
                    const riskRow = cell.closest('.risk-row');
                    const riskFactor = riskRow.querySelector('.col-risk-factor').textContent.trim();
                    const notes = riskRow.querySelector('.notes-input') ? riskRow.querySelector('.notes-input').value : '';
                    
                    logEntry.riskFactors.push({
                        category,
                        riskFactor,
                        score,
                        notes
                    });
                }
            });
            
            // Add pilot experience notes if any
            const pilotExperienceNotes = document.querySelector('.section:nth-last-child(2) .notes-input');
            if (pilotExperienceNotes && pilotExperienceNotes.value) {
                logEntry.pilotExperienceNotes = pilotExperienceNotes.value;
            }
            
            // Save to IndexedDB
            await addHistoricLogEntry(logEntry);
            
            // Show confirmation
            alert('Flight risk assessment has been transferred to the historic log.');
        } catch (error) {
            console.error('Error transferring to historic log:', error);
            alert('An error occurred while transferring to the historic log. Please try again.');
        }
    }
    
    // Initialize the risk assessment and clear any displayed scores
    updateRiskAssessment();
    
    // Clear any individual risk scores on page load
    document.querySelectorAll('.col-checkbox-score').forEach(cell => {
        if (cell.hasAttribute('data-score')) {
            const scoreDisplay = cell.querySelector('.score-display');
            if (scoreDisplay) {
                scoreDisplay.textContent = '';
            }
            cell.classList.remove('selected', 'low-risk', 'high-risk');
        }
    });
    
    // Clear the IFR popup acknowledgment flag when the page loads
    // This ensures the popup will show each time the user selects IFR
    localStorage.removeItem('hasAcknowledgedIfrPopup');
    
    // Function to set up collapsible sections for mobile
    function setupMobileCollapsibleSections() {
        sections.forEach(section => {
            // Skip the total risk section
            if (section.querySelector('.total-risk')) {
                return;
            }
            
            const sectionHeader = section.querySelector('.section-header');
            const sectionContent = Array.from(section.children).filter(el => !el.classList.contains('section-header'));
            
            // Add toggle icon to section header
            const toggleIcon = document.createElement('i');
            toggleIcon.className = 'fas fa-chevron-down mobile-section-toggle';
            toggleIcon.style.display = 'block';
            toggleIcon.style.marginLeft = 'auto';
            toggleIcon.style.marginRight = '10px';
            toggleIcon.style.fontSize = '16px';
            toggleIcon.style.color = '#666';
            sectionHeader.querySelector('.col-risk-factor').appendChild(toggleIcon);
            
            // Initially hide all section content except the first section
            if (section !== sections[0] && !section.classList.contains('ifr-section') && !section.classList.contains('vfr-section')) {
                sectionContent.forEach(el => {
                    el.style.display = 'none';
                });
                toggleIcon.className = 'fas fa-chevron-right mobile-section-toggle';
            }
            
            // Add click event to section header
            sectionHeader.style.cursor = 'pointer';
            sectionHeader.addEventListener('click', function() {
                const isCollapsed = sectionContent[0].style.display === 'none';
                
                // Toggle content visibility
                sectionContent.forEach(el => {
                    el.style.display = isCollapsed ? 'flex' : 'none';
                });
                
                // Toggle icon
                toggleIcon.className = isCollapsed 
                    ? 'fas fa-chevron-down mobile-section-toggle' 
                    : 'fas fa-chevron-right mobile-section-toggle';
            });
        });
        
        // Add fastclick to improve touch response
        document.querySelectorAll('.col-checkbox-score[data-score]').forEach(cell => {
            cell.addEventListener('touchstart', function(e) {
                // Prevent default to avoid delay
                e.preventDefault();
                toggleRiskCell(this);
                calculateTotalRiskScore();
            });
        });
    }
});
