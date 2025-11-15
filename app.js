// Florida Gators Basketball - National Champions 2025!
// Created by Robbiek7455

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏆 Florida Gators - 2025 National Champions! 🏆');
    
    // Load all data with CORS proxy
    loadSchedule();
    loadRoster();
    loadLiveGame();
    
    // Refresh data periodically
    setInterval(loadLiveGame, 30000); // Check for live games every 30 seconds
    
    // Scroll to top functionality
    window.addEventListener('scroll', function() {
        const backToTop = document.getElementById('backToTop');
        if (window.scrollY > 300) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    });
});

// CORS Proxy to fix API issues
function getCORSProxy(url) {
    // Using AllOrigins as CORS proxy
    return `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
}

// Load Schedule with fallback data
async function loadSchedule() {
    const scheduleContainer = document.getElementById('scheduleContainer');
    
    try {
        // Try to fetch from ESPN API through CORS proxy
        const proxyUrl = getCORSProxy(`https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/57/schedule`);
        const response = await fetch(proxyUrl);
        const data = await response.json();
        const espnData = JSON.parse(data.contents);
        
        if (espnData && espnData.events) {
            displaySchedule(espnData.events);
        } else {
            displayFallbackSchedule();
        }
    } catch (error) {
        console.error('Error loading schedule:', error);
        displayFallbackSchedule();
    }
}

// Display schedule from API
function displaySchedule(games) {
    const scheduleContainer = document.getElementById('scheduleContainer');
    let scheduleHTML = '<div class="schedule-timeline">';
    
    // Show recent and upcoming games
    games.slice(0, 10).forEach(game => {
        const date = new Date(game.date);
        const isHome = game.competitions[0].competitors.find(team => team.id === "57").homeAway === "home";
        const opponent = game.competitions[0].competitors.find(team => team.id !== "57");
        const gators = game.competitions[0].competitors.find(team => team.id === "57");
        
        let resultClass = '';
        let resultBadge = '';
        
        if (game.status.type.completed) {
            const won = parseInt(gators.score) > parseInt(opponent.score);
            resultClass = won ? 'win' : 'loss';
            resultBadge = `<span class="badge bg-${won ? 'success' : 'danger'}">${won ? 'W' : 'L'} ${gators.score}-${opponent.score}</span>`;
        } else if (game.status.type.state === "in") {
            resultBadge = `<span class="badge bg-warning">LIVE</span>`;
        }
        
        scheduleHTML += `
            <div class="schedule-item ${resultClass}">
                <div class="row align-items-center">
                    <div class="col-md-3">
                        <strong>${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong><br>
                        <small>${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</small>
                    </div>
                    <div class="col-md-5">
                        <strong>${isHome ? 'vs' : '@'} ${opponent.team.displayName}</strong><br>
                        <small class="text-muted">${isHome ? 'O\'Connell Center' : opponent.team.location}</small>
                    </div>
                    <div class="col-md-4 text-end">
                        ${resultBadge}
                    </div>
                </div>
            </div>
        `;
    });
    
    scheduleHTML += '</div>';
    scheduleContainer.innerHTML = scheduleHTML;
}

// Fallback schedule if API fails
function displayFallbackSchedule() {
    const scheduleContainer = document.getElementById('scheduleContainer');
    
    const fallbackGames = [
        { date: '2025-04-07', opponent: 'Duke', location: 'Phoenix, AZ', result: 'W 85-77', note: '🏆 NATIONAL CHAMPIONSHIP' },
        { date: '2025-04-05', opponent: 'UConn', location: 'Phoenix, AZ', result: 'W 78-71', note: 'Final Four' },
        { date: '2025-03-30', opponent: 'Kansas', location: 'Detroit, MI', result: 'W 82-75', note: 'Elite Eight' },
        { date: '2025-03-28', opponent: 'Marquette', location: 'Detroit, MI', result: 'W 79-68', note: 'Sweet Sixteen' },
        { date: '2025-03-23', opponent: 'Michigan State', location: 'Indianapolis, IN', result: 'W 88-82', note: 'Round of 32' },
        { date: '2025-03-21', opponent: 'Vermont', location: 'Indianapolis, IN', result: 'W 95-62', note: 'Round of 64' },
        { date: '2025-03-16', opponent: 'Kentucky', location: 'Nashville, TN', result: 'W 91-86', note: 'SEC Tournament Championship' },
        { date: '2025-03-09', opponent: 'Kentucky', location: 'Lexington, KY', result: 'W 77-74', note: 'Regular Season Finale' },
        { date: '2025-03-05', opponent: 'Tennessee', location: 'Gainesville, FL', result: 'W 83-79', note: '' },
        { date: '2025-03-01', opponent: 'Alabama', location: 'Tuscaloosa, AL', result: 'W 88-85', note: '' }
    ];
    
    let scheduleHTML = '<div class="schedule-timeline">';
    
    fallbackGames.forEach(game => {
        const isWin = game.result.startsWith('W');
        scheduleHTML += `
            <div class="schedule-item ${isWin ? 'win' : 'loss'}">
                <div class="row align-items-center">
                    <div class="col-md-3">
                        <strong>${new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong>
                    </div>
                    <div class="col-md-5">
                        <strong>vs ${game.opponent}</strong><br>
                        <small class="text-muted">${game.location}</small>
                    </div>
                    <div class="col-md-4 text-end">
                        <span class="badge bg-${isWin ? 'success' : 'danger'}">${game.result}</span>
                        ${game.note ? `<br><small class="text-warning">${game.note}</small>` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    scheduleHTML += '</div>';
    scheduleContainer.innerHTML = scheduleHTML;
}

// Load Roster
async function loadRoster() {
    const rosterContainer = document.getElementById('rosterContainer');
    
    try {
        const proxyUrl = getCORSProxy(`https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/57/roster`);
        const response = await fetch(proxyUrl);
        const data = await response.json();
        const espnData = JSON.parse(data.contents);
        
        if (espnData && espnData.athletes) {
            displayRoster(espnData.athletes);
        } else {
            displayFallbackRoster();
        }
    } catch (error) {
        console.error('Error loading roster:', error);
        displayFallbackRoster();
    }
}

// Display roster
function displayRoster(athletes) {
    const rosterContainer = document.getElementById('rosterContainer');
    let rosterHTML = '';
    
    // Sort by jersey number
    athletes.sort((a, b) => (parseInt(a.jersey) || 99) - (parseInt(b.jersey) || 99));
    
    athletes.slice(0, 12).forEach(player => {
        rosterHTML += `
            <div class="col-md-3 col-6 mb-4" data-aos="fade-up">
                <div class="player-card">
                    <div class="player-image"></div>
                    <div class="player-info">
                        <div class="player-number">#${player.jersey || '--'}</div>
                        <div class="player-name">${player.fullName}</div>
                        <small class="text-muted">${player.position?.displayName || 'Guard'}</small><br>
                        <small>${player.displayHeight || ''} ${player.displayWeight || ''}</small>
                    </div>
                </div>
            </div>
        `;
    });
    
    rosterContainer.innerHTML = rosterHTML;
}

// Fallback roster
function displayFallbackRoster() {
    const rosterContainer = document.getElementById('rosterContainer');
    
    const fallbackRoster = [
        { number: '1', name: 'Walter Clayton Jr.', position: 'Guard', info: 'Senior • 6-2 • 195 lbs', note: '2025 Final Four MVP' },
        { number: '2', name: 'Zyon Pullin', position: 'Guard', info: 'Senior • 6-4 • 200 lbs' },
        { number: '4', name: 'Denzel Aberdeen', position: 'Guard', info: 'Junior • 6-3 • 185 lbs' },
        { number: '5', name: 'Will Richard', position: 'Forward', info: 'Junior • 6-5 • 205 lbs' },
        { number: '10', name: 'Sam Alexis', position: 'Forward', info: 'Sophomore • 6-6 • 210 lbs' },
        { number: '11', name: 'Alijah Martin', position: 'Forward', info: 'Senior • 6-7 • 215 lbs' },
        { number: '13', name: 'Rueben Chinyelu', position: 'Center', info: 'Junior • 6-11 • 235 lbs' },
        { number: '15', name: 'Alex Condon', position: 'Forward/Center', info: 'Sophomore • 6-11 • 225 lbs' },
        { number: '20', name: 'Isaiah Brown', position: 'Guard', info: 'Freshman • 6-1 • 175 lbs' },
        { number: '23', name: 'Thomas Haugh', position: 'Forward', info: 'Senior • 6-9 • 230 lbs' },
        { number: '33', name: 'Viktor Mikic', position: 'Center', info: 'Freshman • 7-0 • 245 lbs' },
        { number: '35', name: 'Kajus Kublickas', position: 'Guard', info: 'Freshman • 6-5 • 190 lbs' }
    ];
    
    let rosterHTML = '';
    
    fallbackRoster.forEach(player => {
        rosterHTML += `
            <div class="col-md-3 col-6 mb-4" data-aos="fade-up">
                <div class="player-card">
                    <div class="player-image"></div>
                    <div class="player-info">
                        <div class="player-number">#${player.number}</div>
                        <div class="player-name">${player.name}</div>
                        <small class="text-muted">${player.position}</small><br>
                        <small>${player.info}</small>
                        ${player.note ? `<br><small class="text-warning">${player.note}</small>` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    rosterContainer.innerHTML = rosterHTML;
}

// Check for live games
async function loadLiveGame() {
    try {
        const proxyUrl = getCORSProxy(`https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/57/schedule`);
        const response = await fetch(proxyUrl);
        const data = await response.json();
        const espnData = JSON.parse(data.contents);
        
        if (espnData && espnData.events) {
            const liveGame = espnData.events.find(game => game.status.type.state === "in");
            
            if (liveGame) {
                displayLiveGame(liveGame);
            } else {
                document.getElementById('liveGameCard').style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error checking live game:', error);
        document.getElementById('liveGameCard').style.display = 'none';
    }
}

// Display live game
function displayLiveGame(game) {
    const liveCard = document.getElementById('liveGameCard');
    const liveScore = document.getElementById('liveScore');
    
    const competition = game.competitions[0];
    const homeTeam = competition.competitors.find(team => team.homeAway === "home");
    const awayTeam = competition.competitors.find(team => team.homeAway === "away");
    
    liveCard.style.display = 'block';
    liveScore.innerHTML = `
        <h2 class="mb-3">
            <span class="text-primary">${awayTeam.team.displayName}</span>
            <span class="mx-3">${awayTeam.score} - ${homeTeam.score}</span>
            <span class="text-primary">${homeTeam.team.displayName}</span>
        </h2>
        <p class="text-muted">
            ${game.status.displayClock} | ${game.status.period === 1 ? '1st Half' : '2nd Half'}
        </p>
    `;
}

// Scroll to top
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = 120; // Account for fixed header
            const targetPosition = target.offsetTop - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Easter egg in console
console.log('%c🐊 CHOMP CHOMP! 🏆', 'color: #FA4616; font-size: 30px; font-weight: bold;');
console.log('%c2025 NATIONAL CHAMPIONS!', 'color: #FFD700; font-size: 20px; font-weight: bold;');
console.log('%cWebsite by Robbiek7455', 'color: #0021A5; font-size: 14px;');
console.log('%cGo Gators! 🏀', 'color: #FA4616; font-size: 16px;');
