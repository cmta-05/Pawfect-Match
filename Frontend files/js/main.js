// Authentication state
let isLoggedIn = false;

// Update UI based on authentication status
function updateAuthUI(isLoggedIn) {
    const loginLinks = document.querySelectorAll('a[href="login.html"]');
    const logoutBtn = document.getElementById('logoutBtn');
    const addPetBtn = document.getElementById('showAddPetForm');
    const myPetsLink = document.querySelector('a[href="my-pets.html"]');
    const userProfileContainer = document.getElementById('userProfileContainer');

    if (isLoggedIn) {
        loginLinks.forEach(link => link.style.display = 'none');
        if (userProfileContainer) {
            const userName = localStorage.getItem('userName') || localStorage.getItem('userEmail') || 'User';
            // Get unread match requests count
            const matchRequests = JSON.parse(localStorage.getItem('matchRequests') || '[]');
            const unreadCount = matchRequests.filter(req => !req.read).length;
            const notificationBadge = unreadCount > 0 ? `<span class="badge rounded-pill bg-danger ms-2">${unreadCount}</span>` : '';
            userProfileContainer.innerHTML = `
                <div class="dropdown">
                    <a href="#" class="nav-link dropdown-toggle d-flex align-items-center gap-2" data-bs-toggle="dropdown">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=FFB031&color=012312&size=32" 
                            alt="Profile" 
                            class="rounded-circle"
                            style="width: 32px; height: 32px;">
                        <span class="d-none d-md-inline" style="color: #FFB031;">${userName}</span>
                        ${unreadCount > 0 ? `<span class="badge rounded-pill bg-danger">${unreadCount}</span>` : ''}
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="my-pets.html"><i class="fas fa-paw me-2"></i>My Pets</a></li>
                        <li><a class="dropdown-item" href="#" onclick="showMatchRequests()">
                            <i class="fas fa-heart me-2"></i>Match Requests${notificationBadge}
                        </a></li>
                        <li><a class="dropdown-item" href="#" onclick="showFavorites()"><i class="fas fa-star me-2"></i>My Favorites</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" onclick="handleLogout()"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
                    </ul>
                </div>
            `;
            userProfileContainer.style.display = 'block';
        }
        if (addPetBtn) addPetBtn.style.display = 'block';
        if (myPetsLink) myPetsLink.style.display = 'block';
    } else {
        loginLinks.forEach(link => link.style.display = 'block');
        if (userProfileContainer) userProfileContainer.style.display = 'none';
        if (addPetBtn) addPetBtn.style.display = 'none';
        if (myPetsLink) myPetsLink.style.display = 'none';
    }
}

// Handle logout
function handleLogout() {
    // Clear all authentication-related data
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('token');
    localStorage.removeItem('matchRequests');
    isLoggedIn = false;
    
    // Update UI
    updateAuthUI(false);
    
    // Redirect to home page
    window.location.href = 'index.html';
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    // Verify authentication state
    if (isLoggedIn && !localStorage.getItem('userId')) {
        // Invalid state - clear authentication
        handleLogout();
        return;
    }
    
    updateAuthUI(isLoggedIn);

    // Get current page
    const currentPage = window.location.pathname.split('/').pop();

    // Initialize features based on current page
    if (currentPage === 'browse.html') {
        initializePetModal();
        initializeSearchAndFilter();
    }

    // Add authentication check for protected pages
    const protectedPages = ['my-pets.html'];
    if (protectedPages.includes(currentPage) && !isLoggedIn) {
        window.location.href = 'login.html?redirect=' + currentPage;
        return;
    }
});

// Handle login form submission
const loginForm = document.querySelector('#loginModal form');
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (email && password) {
            // Set authentication state
            localStorage.setItem('isLoggedIn', 'true');
            // Fetch user by email to get MongoDB _id
            try {
                const response = await fetch(`/users/email/${encodeURIComponent(email)}`);
                if (!response.ok) throw new Error('User not found');
                const user = await response.json();
                localStorage.setItem('userId', user._id);
                localStorage.setItem('userName', user.name);
                localStorage.setItem('userEmail', user.email);
            } catch (err) {
                alert('Login failed: ' + err.message);
                return;
            }
            isLoggedIn = true;
            // Initialize empty match requests if not exists
            if (!localStorage.getItem('matchRequests')) {
                localStorage.setItem('matchRequests', '[]');
            }
            updateAuthUI(true);
            const modal = document.getElementById('loginModal');
            if (modal) {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) {
                    bsModal.hide();
                }
            }
            loginForm.reset();
            // Check for redirect parameter
            const urlParams = new URLSearchParams(window.location.search);
            const redirect = urlParams.get('redirect');
            if (redirect) {
                window.location.href = redirect;
            } else if (window.location.pathname.includes('login.html')) {
                window.location.href = 'my-pets.html';
            }
        }
    });
}

// Initialize pet modal functionality
function initializePetModal() {
    // This function should be refactored to fetch pet data from the backend or use the data already loaded on the page.
    // Remove or comment out any code that references a global pets array.
}

// Initialize search and filter functionality
function initializeSearchAndFilter() {
    const searchInput = document.querySelector('input[type="text"]');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const petCards = document.querySelectorAll('.card');
            
            petCards.forEach(card => {
                const petName = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
                const petBreed = card.querySelector('.card-text')?.textContent.toLowerCase() || '';
                
                if (petName.includes(searchTerm) || petBreed.includes(searchTerm)) {
                    card.closest('.col').style.display = '';
                } else {
                    card.closest('.col').style.display = 'none';
                }
            });
        });
    }

    const breedFilter = document.querySelector('select:first-of-type');
    if (breedFilter) {
        breedFilter.addEventListener('change', function() {
            const selectedBreed = this.value.toLowerCase();
            const petCards = document.querySelectorAll('.card');
            
            petCards.forEach(card => {
                const petBreed = card.querySelector('.card-text')?.textContent.toLowerCase() || '';
                
                if (selectedBreed === 'filter by breed' || petBreed.includes(selectedBreed)) {
                    card.closest('.col').style.display = '';
                } else {
                    card.closest('.col').style.display = 'none';
                }
            });
        });
    }
}

// Update the pet modal with pet data
function updatePetModal(pet) {
    const mainImage = document.querySelector('.main-pet-image');
    if (mainImage) mainImage.src = pet.images[0];

    const thumbnails = document.querySelectorAll('.pet-thumbnail');
    pet.images.forEach((img, index) => {
        if (thumbnails[index]) {
            thumbnails[index].src = img;
        }
    });

    const elements = {
        name: document.querySelector('.pet-name'),
        type: document.querySelector('.pet-type'),
        age: document.querySelector('.pet-age'),
        location: document.querySelector('.pet-location'),
        description: document.querySelector('.pet-description')
    };

    if (elements.name) elements.name.textContent = pet.name;
    if (elements.type) elements.type.innerHTML = `<i class="fas fa-dog me-2"></i>${pet.breed}`;
    if (elements.age) elements.age.innerHTML = `<i class="fas fa-birthday-cake me-2"></i>${pet.age}`;
    if (elements.location) elements.location.innerHTML = `<i class="fas fa-map-marker-alt me-2"></i>${pet.location}`;
    if (elements.description) elements.description.textContent = pet.description;

    const actionButtons = document.querySelector('.modal-footer');
    if (!actionButtons) return;

    if (!isLoggedIn) {
        actionButtons.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-warning mb-3" role="alert">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    You need to be logged in to interact with pets!
                </div>
                <div class="d-flex justify-content-center gap-3">
                    <a href="login.html" class="btn" style="background-color: #012312; color: white;">
                        <i class="fas fa-sign-in-alt me-2"></i>Login
                    </a>
                    <a href="login.html#register" class="btn" style="background-color: #FFB031; color: #012312;">
                        <i class="fas fa-user-plus me-2"></i>Register
                    </a>
                </div>
            </div>
        `;
    } else {
        actionButtons.innerHTML = `
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn" style="background-color: #012312; color: white;" onclick="sendMatchRequest(${pet.id})">
                <i class="fas fa-heart me-2"></i>Send Match Request
            </button>
            <button type="button" class="btn" style="background-color: #FFB031; color: #012312;" onclick="favoritePet(${pet.id})">
                <i class="fas fa-star me-2"></i>Favorite
            </button>
        `;
    }
}

// Handle match request
function sendMatchRequest(petId) {
    if (!isLoggedIn) {
        return;
    }
    // Set the selected pet globally
    window.selectedPetId = petId;
    // Show the match request form (if exists)
    const form = document.getElementById('matchRequestForm');
    if (form) {
        form.style.display = 'block';
        form.style.opacity = '1';
        form.style.transform = 'translateY(0)';
        // Optionally focus the first input
        const select = document.getElementById('userPetSelect');
        if (select) select.focus();
    } else {
        alert('Match request form not found on this page.');
    }
}

// Handle favorite pet
function favoritePet(petId) {
    if (!isLoggedIn) {
        return;
    }
    // Get user's favorites from localStorage
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (!favorites.includes(petId)) {
        favorites.push(petId);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        alert('Pet added to favorites!');
    } else {
        alert('This pet is already in your favorites!');
    }
}

// Handle sort functionality
const sortSelect = document.querySelector('select:last-of-type');
if (sortSelect) {
    sortSelect.addEventListener('change', function() {
        const sortBy = this.value;
        const petContainer = document.querySelector('.row.row-cols-1');
        const petCards = Array.from(petContainer.querySelectorAll('.col'));
        
        petCards.sort((a, b) => {
            const aName = a.querySelector('.card-title').textContent;
            const bName = b.querySelector('.card-title').textContent;
            
            // Extract age values properly
            const aAgeText = a.querySelector('.card-text').textContent;
            const bAgeText = b.querySelector('.card-text').textContent;
            
            // Extract numeric age values using regex
            const aAgeMatch = aAgeText.match(/(\d+(?:\.\d+)?)\s*years?/);
            const bAgeMatch = bAgeText.match(/(\d+(?:\.\d+)?)\s*years?/);
            
            const aAge = aAgeMatch ? parseFloat(aAgeMatch[1]) : 0;
            const bAge = bAgeMatch ? parseFloat(bAgeMatch[1]) : 0;
            
            // Extract location values
            const aLocation = a.querySelector('.card-text:nth-child(3)')?.textContent.replace(/.*marker-alt me-2">/, '').trim() || '';
            const bLocation = b.querySelector('.card-text:nth-child(3)')?.textContent.replace(/.*marker-alt me-2">/, '').trim() || '';
            
            switch(sortBy) {
                case 'Name':
                    return aName.localeCompare(bName);
                case 'Age':
                    return aAge - bAge;
                case 'Location':
                    return aLocation.localeCompare(bLocation);
                default:
                    return 0;
            }
        });
        
        petCards.forEach(card => petContainer.appendChild(card));
    });
}

// Function to show favorites modal
function showFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const modalHtml = `
        <div class="modal fade" id="favoritesModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">My Favorite Pets</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${favorites.length === 0 ? `
                            <div class="text-center py-5">
                                <i class="fas fa-heart text-muted mb-3" style="font-size: 3rem;"></i>
                                <p class="lead">You haven't favorited any pets yet.</p>
                                <a href="browse.html" class="btn" style="background-color: #012312; color: white;">
                                    Browse Pets
                                </a>
                            </div>
                        ` : `
                            <div class="row">
                                ${favorites.map(pet => `
                                    <div class="col-md-6 mb-4">
                                        <div class="card h-100">
                                            <div style="position: relative; padding-top: 100%; overflow: hidden;">
                                                <img src="${pet.profileImage || pet.images?.[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(pet.name)}&background=012312&color=ffffff`}" 
                                                    class="card-img-top position-absolute top-0 start-0 w-100 h-100" 
                                                    alt="${pet.name}"
                                                    style="object-fit: cover;">
                                            </div>
                                            <div class="card-body">
                                                <h5 class="card-title">${pet.name}</h5>
                                                <p class="card-text">
                                                    <i class="fas fa-dog me-2"></i>${pet.breed}<br>
                                                    <i class="fas fa-birthday-cake me-2"></i>${pet.age}<br>
                                                    <i class="fas fa-map-marker-alt me-2"></i>${pet.location}
                                                </p>
                                            </div>
                                            <div class="card-footer">
                                                <button class="btn btn-sm" style="background-color: #012312; color: white;" 
                                                    onclick="window.location.href='browse.html?pet=${pet.id}'">
                                                    <i class="fas fa-eye me-2"></i>View Details
                                                </button>
                                                <button class="btn btn-sm btn-danger" onclick="removeFromFavorites(${pet.id})">
                                                    <i class="fas fa-heart-broken me-2"></i>Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('favoritesModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add new modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('favoritesModal'));
    modal.show();
}

// Function to remove pet from favorites
function removeFromFavorites(petId) {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    favorites = favorites.filter(pet => pet.id !== petId);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    showFavorites(); // Refresh the modal
}

// Function to add pet to favorites
function toggleFavorite(petId) {
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }

    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const pet = pets.find(p => p.id === petId);
    
    if (!pet) return;

    const isFavorite = favorites.some(fav => fav.id === petId);
    if (isFavorite) {
        favorites = favorites.filter(fav => fav.id !== petId);
    } else {
        favorites.push(pet);
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));
    const btn = document.querySelector(`button[onclick="toggleFavorite(${petId})"]`);
    if (btn) {
        btn.innerHTML = `<i class="fas fa-star me-2"></i>${isFavorite ? 'Favorite' : 'Unfavorite'}`;
        btn.classList.toggle('active');
    }
}

// --- MATCH REQUEST BACKEND INTEGRATION ---
async function submitMatchRequest() {
    const userPetId = document.getElementById('userPetSelect').value;
    const message = document.getElementById('matchMessage').value;
    const submitBtn = document.getElementById('submitMatchBtn');

    if (!userPetId) {
        alert('Please select one of your pets to send a match request.');
        return;
    }

    // Find sender (current user) and senderPet
    const userId = localStorage.getItem('userId'); // This should be MongoDB _id
    const userPets = JSON.parse(localStorage.getItem('userPets') || '[]');
    const senderPet = userPets.find(p => p._id === userPetId || p.id === userPetId);
    if (!senderPet) {
        alert('Could not find your selected pet.');
        return;
    }

    // Find receiverPet and receiver (target pet and its owner)
    const allPets = JSON.parse(localStorage.getItem('pets') || '[]');
    const receiverPet = allPets.find(p => p._id === window.selectedPetId || p.id === window.selectedPetId);
    if (!receiverPet) {
        alert('Could not find the target pet.');
        return;
    }
    const receiverId = receiverPet.userId;

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Sending...';

    // Prepare payload
    const payload = {
        sender: userId,
        senderPet: senderPet._id || senderPet.id,
        receiver: receiverId,
        receiverPet: receiverPet._id || receiverPet.id,
        message
    };
    console.log('Submitting match request payload:', payload);

    // Send to backend
    try {
        const response = await fetch('/api/match-requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        console.log('Backend response:', data);
        if (!response.ok) {
            throw new Error(data.message || 'Failed to send match request');
        }
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane me-1"></i>Send Request';
        cancelMatchRequest();
        // Show success toast
        const toast = document.createElement('div');
        toast.className = 'position-fixed bottom-0 end-0 p-3';
        toast.style.zIndex = '5';
        toast.innerHTML = `
            <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header" style="background-color: #012312; color: white;">
                    <i class="fas fa-check-circle me-2"></i>
                    <strong class="me-auto">Success</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    Match request sent successfully!
                </div>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => { toast.remove(); }, 3000);
        updateAuthUI(true);
    } catch (error) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane me-1"></i>Send Request';
        alert(error.message || 'Failed to send match request.');
        console.error('Match request error:', error);
    }
}

// Show match requests modal with backend data
let matchModal = null;
async function showMatchRequests() {
    if (matchModal) matchModal.remove();
    matchModal = document.createElement('div');
    matchModal.id = 'matchRequestsModal';
    matchModal.className = 'modal fade';
    matchModal.setAttribute('tabindex', '-1');

    // Always fetch latest pets and userPets
    let allPets = [];
    let userPets = [];
    try {
        const petsRes = await fetch('/api/pets');
        allPets = await petsRes.json();
        const userId = localStorage.getItem('userId');
        console.log('Current userId:', userId); // Debug log
        userPets = allPets.filter(p => p.userId === userId);
        localStorage.setItem('pets', JSON.stringify(allPets));
        localStorage.setItem('userPets', JSON.stringify(userPets));
    } catch (e) {
        allPets = JSON.parse(localStorage.getItem('pets') || '[]');
        userPets = JSON.parse(localStorage.getItem('userPets') || '[]');
    }

    // Fetch match requests from backend
    const userId = localStorage.getItem('userId');
    console.log('Current userId:', userId); // Debug log
    let requests = [];
    try {
        const res = await fetch(`/api/match-requests?userId=${userId}`);
        requests = await res.json();
        console.log('Fetched match requests:', requests); // Debug log
        if (!Array.isArray(requests)) requests = [];
    } catch (e) {
        requests = [];
    }

    // Split requests into sent and received (robust comparison for ObjectId or string)
    const sentRequests = requests.filter(r => String(r.sender?._id || r.sender?.$oid || r.sender) === String(userId));
    const receivedRequests = requests.filter(r => String(r.receiver?._id || r.receiver?.$oid || r.receiver) === String(userId));

    // Modal content
    matchModal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header" style="background-color: #012312; color: white;">
                    <h5 class="modal-title">
                        <i class="fas fa-heart me-2"></i>Match Requests
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <h6 class="mb-3">Sent Requests</h6>
                    ${sentRequests.length === 0 ?
                        `<div class='text-muted mb-4'>No sent match requests.</div>` :
                        sentRequests.map(request => {
                            let receiverPetName = request.receiverPet?.name || 'Target Pet';
                            let senderPetName = request.senderPet?.name || 'Your Pet';
                            return `
                                <div class="card mb-2 border-0 shadow-sm">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-start mb-2">
                                            <h6 class="card-title mb-0">
                                                <i class="fas fa-paw me-2" style="color: #FFB031;"></i>
                                                ${senderPetName} → ${receiverPetName}
                                            </h6>
                                            <span class="badge ${request.status === 'pending' ? 'bg-warning' : request.status === 'accepted' ? 'bg-success' : 'bg-danger'} px-3 py-2">
                                                <i class="fas ${request.status === 'pending' ? 'fa-clock' : request.status === 'accepted' ? 'fa-check-circle' : 'fa-times-circle'} me-1"></i>
                                                ${request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                            </span>
                                        </div>
                                        ${request.message ?
                                            `<div class="card-text bg-light p-3 rounded mb-2">
                                                <i class="fas fa-quote-left me-2" style="color: #FFB031;"></i>
                                                ${request.message}
                                            </div>` : ''}
                                        <small class="text-muted">
                                            <i class="far fa-clock me-1"></i>
                                            Sent on ${new Date(request.createdAt).toLocaleDateString()}
                                        </small>
                                    </div>
                                </div>
                            `;
                        }).join('')
                    }
                    <hr/>
                    <h6 class="mb-3">Received Requests</h6>
                    ${receivedRequests.length === 0 ?
                        `<div class='text-muted mb-4'>No received match requests.</div>` :
                        receivedRequests.map(request => {
                            let senderPetName = request.senderPet?.name || 'Sender Pet';
                            let receiverPetName = request.receiverPet?.name || 'Your Pet';
                            return `
                                <div class="card mb-2 border-0 shadow-sm">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-start mb-2">
                                            <h6 class="card-title mb-0">
                                                <i class="fas fa-paw me-2" style="color: #FFB031;"></i>
                                                ${senderPetName} → ${receiverPetName}
                                            </h6>
                                            <span class="badge ${request.status === 'pending' ? 'bg-warning' : request.status === 'accepted' ? 'bg-success' : 'bg-danger'} px-3 py-2">
                                                <i class="fas ${request.status === 'pending' ? 'fa-clock' : request.status === 'accepted' ? 'fa-check-circle' : 'fa-times-circle'} me-1"></i>
                                                ${request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                            </span>
                                        </div>
                                        ${request.message ?
                                            `<div class="card-text bg-light p-3 rounded mb-2">
                                                <i class="fas fa-quote-left me-2" style="color: #FFB031;"></i>
                                                ${request.message}
                                            </div>` : ''}
                                        <small class="text-muted">
                                            <i class="far fa-clock me-1"></i>
                                            Sent on ${new Date(request.createdAt).toLocaleDateString()}
                                        </small>
                                    </div>
                                </div>
                            `;
                        }).join('')
                    }
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                        <i class="fas fa-times me-1"></i>Close
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(matchModal);
    const modal = new bootstrap.Modal(matchModal);
    modal.show();
    updateAuthUI(true);
}
window.showMatchRequests = showMatchRequests;

// --- PETS BACKEND INTEGRATION ---

// Fetch pets from backend
async function fetchPets() {
    const res = await fetch('/pets');
    if (!res.ok) return [];
    return await res.json();
}

// Add a new pet to backend
async function addPet(petData) {
    const res = await fetch('/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(petData)
    });
    return await res.json();
}

// Update a pet in backend
async function updatePet(id, petData) {
    const res = await fetch(`/pets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(petData)
    });
    return await res.json();
}

// Delete a pet in backend
async function deletePet(id) {
    // Use the correct backend API endpoint
    const res = await fetch(`http://localhost:3000/api/pets/${id}`, { method: 'DELETE' });
    return await res.json();
}

// Render pets on My Pets page
async function renderMyPets() {
    const container = document.getElementById('myPetsContainer');
    if (!container) return;
    
    // Fetch from backend instead of localStorage
    try {
        const userId = localStorage.getItem('userId');
        const res = await fetch(`http://localhost:3000/api/pets?userId=${userId}`);
        const pets = await res.json();
        const userPets = pets.filter(pet => pet.userId === userId);

        if (userPets.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-muted">You haven't added any pets yet.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = userPets.map(renderPetCard).join('');

        // Update localStorage for consistency
        localStorage.setItem('userPets', JSON.stringify(userPets));
    } catch (error) {
        container.innerHTML = `<div class="col-12 text-center"><p class="text-danger">Failed to load pets.</p></div>`;
        console.error('Error loading pets:', error);
    }
}

// Centralized pet card renderer
function renderPetCard(pet) {
    // Only show the Edit button for My Pets if not on browse.html
    const currentPage = window.location.pathname.split('/').pop();
    const editButton = currentPage === 'my-pets.html'
        ? `<button class="btn" style="background-color: #FFB031; color: #012312;" onclick="editPet('${pet._id}')">
                <i class="fas fa-edit me-2"></i>Edit
           </button>`
        : '';
    const deleteButton = currentPage === 'my-pets.html'
        ? `<button class="btn btn-danger" onclick="handleDeletePet('${pet._id}')">
                <i class="fas fa-trash me-2"></i>Delete
           </button>`
        : '';
    return `
        <div class="col-md-4 mb-4">
            <div class="card h-100">
                <img src="${pet.profileImage}" 
                     class="card-img-top" 
                     alt="${pet.name}"
                     style="height: 200px; object-fit: cover;">
                <div class="card-body">
                    <h5 class="card-title">${pet.name}</h5>
                    <p class="card-text">
                        <strong>Breed:</strong> ${pet.breed}<br>
                        <strong>Age:</strong> ${pet.age}<br>
                        <strong>Gender:</strong> ${pet.gender}<br>
                        <strong>Location:</strong> ${pet.location}
                    </p>
                    <p class="card-text">${pet.description}</p>
                </div>
                <div class="card-footer bg-transparent border-0">
                    <div class="d-flex justify-content-between">
                        ${editButton}
                        ${deleteButton}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Add event listeners for add/edit/delete
async function handleAddPet(e) {
    e.preventDefault();
    
    const name = document.getElementById('dogName').value;
    const breed = document.getElementById('breed').value;
    const age = document.getElementById('age').value;
    const gender = document.querySelector('input[name="gender"]:checked').value;
    const location = document.getElementById('location').value;
    const description = document.getElementById('description').value;
    
    // Handle image upload
    const profileImage = document.getElementById('profileImage').files[0];
    
    // Convert image to base64
    const getBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };
    
    try {
        const profileImageBase64 = profileImage ? await getBase64(profileImage) : null;
        
        const petData = {
            name,
            breed,
            age,
            gender,
            location,
            description,
            images: [profileImageBase64].filter(Boolean),
            userId: localStorage.getItem('userId')
        };
        
        // Send to backend
        const response = await fetch('http://localhost:3000/api/pets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(petData)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add pet');
        }
        // Reset form and hide it
        e.target.reset();
        document.getElementById('addPetForm').style.display = 'none';
        document.getElementById('showAddPetForm').style.display = 'block';
        document.getElementById('imagePreview').innerHTML = '';
        // Refresh the pets display
        await renderMyPets();
    } catch (error) {
        console.error('Error adding pet:', error);
        // Removed alert to avoid unnecessary error message to user
    }
}

async function handleDeletePet(id) {
    if (confirm('Are you sure you want to delete this pet?')) {
        try {
            const response = await fetch(`http://localhost:3000/api/pets/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                let errorMsg = 'Failed to delete pet.';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch {}
                alert(errorMsg);
                return;
            }
            // Success: refresh pets
            await renderMyPets();
            // Always refresh match requests list
            await showMatchRequests();
        } catch (err) {
            alert('Error deleting pet. See console for details.');
            console.error('Delete error:', err);
        }
    }
}

window.handleDeletePet = handleDeletePet;

// Attach listeners on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'my-pets.html') {
        renderMyPets();
    }
    const addPetForm = document.getElementById('addPetForm');
    if (addPetForm) {
        addPetForm.addEventListener('submit', handleAddPet);
    }
});
// --- END PETS BACKEND INTEGRATION ---

// Add/Edit Pet Modal
let editPetModal = null;
function showEditPetForm(id) {
    fetch(`http://localhost:3000/api/pets/${id}`)
        .then(res => res.json())
        .then(pet => {
            // Parse age as number for the input
            let ageValue = pet.age;
            if (typeof ageValue === 'string') {
                const match = ageValue.match(/\d+/);
                ageValue = match ? match[0] : '';
            }
            // Create modal HTML if not exists
            if (!editPetModal) {
                editPetModal = document.createElement('div');
                editPetModal.className = 'modal fade';
                editPetModal.id = 'editPetModal';
                editPetModal.tabIndex = -1;
                document.body.appendChild(editPetModal);
            }
            editPetModal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Edit Pet</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="editPetForm">
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Name</label>
                                <input type="text" class="form-control" name="name" value="${pet.name}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Age</label>
                                 <input type="number" class="form-control" name="age" value="${ageValue}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Breed</label>
                                <input type="text" class="form-control" name="breed" value="${pet.breed}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Gender</label>
                                <select class="form-select" name="gender" required>
                                    <option value="Male" ${pet.gender === 'Male' ? 'selected' : ''}>Male</option>
                                    <option value="Female" ${pet.gender === 'Female' ? 'selected' : ''}>Female</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Location</label>
                                <input type="text" class="form-control" name="location" value="${pet.location}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" name="description" rows="3" required>${pet.description}</textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                        </div>
                        </form>
                    </div>
                </div>
            `;
            const modal = new bootstrap.Modal(editPetModal);
            modal.show();
            document.getElementById('editPetForm').onsubmit = async function(e) {
                e.preventDefault();
                const formData = new FormData(e.target);
                const updatedPet = Object.fromEntries(formData.entries());
                 updatedPet.age = Number(updatedPet.age); // Ensure age is a number
                try {
                    await updatePet(id, updatedPet);
                    modal.hide();
                     await renderMyPets();
                    // Remove modal from DOM after hiding
                    setTimeout(() => {
                        if (editPetModal) {
                            editPetModal.remove();
                            editPetModal = null;
                        }
                    }, 500);
                } catch (err) {
                    alert('Error updating pet.');
                    console.error(err);
                }
            };
        })
        .catch(err => {
            alert('Error loading pet for editing.');
            console.error(err);
        });
}
window.showEditPetForm = function(){}; // Disable modal edit for my-pets.html

// Handle image preview
function handleImagePreview(input, previewContainer) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'img-thumbnail';
            img.style.width = '150px';
            img.style.height = '150px';
            img.style.objectFit = 'cover';
            img.style.margin = '5px';
            
            // Clear previous previews
            previewContainer.innerHTML = '';
            previewContainer.appendChild(img);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Handle multiple image preview
function handleMultipleImagePreview(input, previewContainer) {
    if (input.files) {
        // Clear previous previews
        previewContainer.innerHTML = '';
        
        // Limit to 3 images
        const files = Array.from(input.files).slice(0, 3);
        
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'img-thumbnail';
                img.style.width = '150px';
                img.style.height = '150px';
                img.style.objectFit = 'cover';
                img.style.margin = '5px';
                previewContainer.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    }
}

// Handle contact form submission
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value
        };

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                showAlert('Message sent successfully!', 'success');
                contactForm.reset();
            } else {
                showAlert(data.message || 'Error sending message', 'error');
            }
        } catch (error) {
            showAlert('Error sending message. Please try again.', 'error');
        }
    });
}