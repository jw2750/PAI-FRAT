// Disclaimer popup functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Disclaimer script loaded');
    
    // Get references to elements
    const disclaimerOverlay = document.getElementById('disclaimerOverlay');
    const acceptBtn = document.getElementById('acceptDisclaimerBtn');
    
    // Check if user has already accepted the disclaimer
    if (localStorage.getItem('disclaimerAccepted') === 'true') {
        disclaimerOverlay.style.display = 'none';
    }
    
    // Add click event to the accept button
    if (acceptBtn) {
        acceptBtn.addEventListener('click', function() {
            console.log('Accept button clicked');
            disclaimerOverlay.style.display = 'none';
            localStorage.setItem('disclaimerAccepted', 'true');
        });
    } else {
        console.error('Accept button not found');
    }
});
