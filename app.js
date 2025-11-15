// Florida Gators Basketball Hub - Complete JavaScript
// Created by Robbiek7455
// ESPN Team ID for Florida Gators
const FLORIDA_TEAM_ID = 57;

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Florida Gators Basketball Hub by Robbiek7455 - Loading...');
    
    // Load all data
    loadSchedule();
    loadRoster();
    loadStats();
    loadStandings();
    checkLiveGame();
    loadWeather();
    initializePoll();
    initializeCountdown();
    
    // Set up refresh intervals
    setInterval(checkLiveGame, 30000); // Check for live games every 30 seconds
    setInterval(updateCountdown, 1000); // Update countdown every second
    setInterval(() => {
        loadSchedule();
        loadStats();
    }, 300000); // Refresh data every 5 minutes
    
    // Show scroll button when scrolling
    window.onscroll = function() {
        if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
            document.getElementById("scrollTop").style.display = "block";
        } else {
            document.getElementById("scrollTop").style.display = "none";
        }
    };
});

// Fetch schedule from ESPN
async function loadSchedule() {
    try {
        const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/${FLORIDA_TEAM_ID}/schedule`);
        const data = await response.json();
        
        let scheduleHTML = '<div class="row">';
        const games = data.events || [];
        
        // Store next game for countdown
        const futureGames = games.filter(game => !game.status.type.completed);
        if (futureGames.length > 0) {
            window.nextGame = futureGames[0];
        }
        
        // Show next 8 games
        games.slice(0, 8).forEach(game => {
            const date = new Date(game.date);
            const isHome = game.competitions[0].competitors.find(team => team.id === "57").homeAway === "home";
            const opponent = game.competitions[0].competitors.find(team => team.id !== "57");
            const gatorTeam = game.competitions[0].competitors.find(team => team.id === "57");
            
            let statusHTML = '';
            if (game.status.type.completed) {
                const won = parseInt(gatorTeam.score) > parseInt(opponent.score);
                statusHTML = `
                    <div class="mt-2">
                        <span class="badge ${won ? 'bg-success' : 'bg-danger'}">
                            ${won ? 'W' : 'L'} ${gatorTeam.score} - ${opponent.score}
                        </span>
                    </div>
                `;
            } else if (game.status.type.state === "in") {
                statusHTML = `
                    <div class="mt-2">
                        <span class="badge bg-danger">LIVE</span>
                        <strong>${gatorTeam.score} - ${opponent.score}</strong>
                    </div>
                `;
            } else {
                const tvBroadcast = game.competitions[0].broadcasts && game.competitions[0].broadcasts.length > 0 
                    ? game.competitions[0].broadcasts[0].names[0] 
                    : 'TBA';
                statusHTML = `
                    <div class="mt-2">
                        <small class="text-muted"><i class="fas fa-tv"></i> ${tvBroadcast}</small>
                    </div>
                `;
            }
            
            scheduleHTML += `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="game-card ${game.status.type.state === "in" ? 'border-danger' : ''}">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1">${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</h6>
                                <p class="mb-1"><strong>${isHome ? 'vs' : '@'} ${opponent.team.displayName}</strong></p>
                                <small>${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</small>
                            </div>
                            <div class="text-end">
                                ${isHome ? '<span class="badge bg-primary">HOME</span>' : '<span class="badge bg-secondary">AWAY</span>'}
                            </div>
                        </div>
                        ${statusHTML}
                    </div>
                </div>
            `;
        });
        
        scheduleHTML += '</div>';
        document.getElementById('schedule-container').innerHTML = scheduleHTML;
        
    } catch (error) {
        document.getElementById('schedule-container').innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i> Unable to load schedule. Please check back later.
            </div>
        `;
    }
}

// Fetch roster from ESPN
async function loadRoster() {
    try {
        const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/${FLORIDA_TEAM_ID}/roster`);
        const data = await response.json();
        
        let rosterHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Position</th>
                            <th>Height</th>
                            <th>Weight</th>
                            <th>Year</th>
                            <th>Hometown</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        const athletes = data.athletes || [];
        athletes.sort((a, b) => (parseInt(a.jersey) || 99) - (parseInt(b.jersey) || 99));
        
        athletes.forEach(player => {
            const hometown = player.birthPlace ? `${player.birthPlace.city}, ${player.birthPlace.state || player.birthPlace.country}` : '-';
            rosterHTML += `
                <tr>
                    <td><strong>${player.jersey || '-'}</strong></td>
                    <td>
                        <strong>${player.fullName}</strong>
                        ${player.injuries && player.injuries.length > 0 ? '<span class="badge bg-danger ms-2">Injured</span>' : ''}
                    </td>
                    <td>${player.position?.abbreviation || '-'}</td>
                    <td>${player.displayHeight || '-'}</td>
                    <td>${player.displayWeight || '-'}</td>
                    <td>${player.experience?.displayValue || 'Freshman'}</td>
                    <td><small>${hometown}</small></td>
                </tr>
            `;
        });
        
        rosterHTML += `
                    </tbody>
                </table>
            </div>
            <div class="mt-3">
                <p class="text-muted"><small><i class="fas fa-info-circle"></i> Roster data from ESPN API</small></p>
            </div>
        `;
        
        document.getElementById('roster-container').innerHTML = rosterHTML;
        
    } catch (error) {
        document.getElementById('roster-container').innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i> Unable to load roster. Please check back later.
            </div>
        `;
    }
}

// Fetch team stats
async function loadStats() {
    try {
        const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/${FLORIDA_TEAM_ID}`);
        const data = await response.json();
        
        const record = data.team.record?.items?.[0] || {};
        const stats = record.stats || [];
        
        // Update quick stats
        document.getElementById('season-record').textContent = record.summary || '0-0';
        
        const confRecord = stats.find(s => s.name === "vs. Conf.")?.displayValue || '0-0';
        document.getElementById('conf-record').textContent = confRecord;
        
        const homeRecord = stats.find(s => s.name === "Home")?.displayValue || '0-0';
        document.getElementById('home-record').textContent = homeRecord;
        
        // Check for ranking
        const ranking = data.team.rank || '--';
        document.getElementById('ranking').textContent = ranking ? `#${ranking}` : 'NR';
        
        // Build detailed stats
        let statsHTML = `
            <div class="row mb-4">
                <div class="col-md-3 col-6 text-center mb-3">
                    <div class="stat-box">
                        <div class="stat-value">${record.summary || '0-0'}</div>
                        <div class="stat-label">Overall</div>
                    </div>
                </div>
                <div class="col-md-3 col-6 text-center mb-3">
                    <div class="stat-box">
                        <div class="stat-value">${stats.find(s => s.name === "vs. Conf.")?.displayValue || '0-0'}</div>
                        <div class="stat-label">Conference</div>
                    </div>
                </div>
                <div class="col-md-3 col-6 text-center mb-3">
                    <div class="stat-box">
                        <div class="stat-value">${stats.find(s => s.name === "Home")?.displayValue || '0-0'}</div>
                        <div class="stat-label">Home</div>
                    </div>
                </div>
                <div class="col-md-3 col-6 text-center mb-3">
                    <div class="stat-box">
                        <div class="stat-value">${stats.find(s => s.name === "Road")?.displayValue || '0-0'}</div>
                        <div class="stat-label">Away</div>
                    </div>
                </div>
            </div>
            
            <h4>Additional Stats</h4>
            <div class="row">
                <div class="col-md-6">
                    <ul class="list-group">
                        <li class="list-group-item d-flex justify-content-between">
                            <span>Neutral Site:</span>
                            <strong>${stats.find(s => s.name === "Neutral Site")?.displayValue || '0-0'}</strong>
                        </li>
                        <li class="list-group-item d-flex justify-content-between">
                            <span>vs. AP Top 25:</span>
                            <strong>${stats.find(s => s.name === "vs. AP Top 25")?.displayValue || '0-0'}</strong>
                        </li>
                        <li class="list-group-item d-flex justify-content-between">
                            <span>Streak:</span>
                            <strong>${record.standingSummary || 'N/A'}</strong>
                        </li>
                    </ul>
                </div>
                <div class="col-md-6">
                    <div class="alert alert-info">
                        <h5>Team Leaders</h5>
                        <p class="mb-0">Check individual player stats on the official roster page for detailed statistics.</p>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('stats-container').innerHTML = statsHTML;
        
    } catch (error) {
        document.getElementById('stats-container').innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i> Unable to load stats. Please check back later.
            </div>
        `;
    }
}

// Load SEC Standings
async function loadStandings() {
    try {
        const response = await fetch('https://site.api.espn.com/apis/v2/sports/basketball/mens-college-basketball/standings?group=8');
        const data = await response.json();
        
        // Find SEC standings
        const standings = data.children?.find(conf => 
            conf.name === "Southeastern Conference" || 
            conf.abbreviation === "SEC"
        );
        
        if (standings && standings.standings?.entries) {
            let standingsHTML = `
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead class="table-light">
                            <tr>
                                <th>Rank</th>
                                <th>Team</th>
                                <th>Conference</th>
                                <th>Overall</th>
                                <th>Streak</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            standings.standings.entries.forEach((team, index) => {
                const stats = team.stats || [];
                const confRecord = stats.find(s => s.type === "vsconf")?.displayValue || "0-0";
                const overall = stats.find(s => s.name === "overall")?.displayValue || "0-0";
                const streak = stats.find(s => s.name === "streak")?.displayValue || "-";
                const isGators = team.team.id === "57";
                
                standingsHTML += `
                    <tr class="${isGators ? 'table-primary' : ''}">
                        <td>${index + 1}</td>
                        <td>
                            <strong>${team.team.displayName}</strong>
                            ${isGators ? ' <span class="badge bg-primary">GATORS</span>' : ''}
                        </td>
                        <td>${confRecord}</td>
                        <td>${overall}</td>
                        <td>
                            <span class="badge ${streak.includes('W') ? 'bg-success' : 'bg-danger'}">
                                ${streak}
                            </span>
                        </td>
                    </tr>
                `;
            });
            
            standingsHTML += `
                        </tbody>
                    </table>
                </div>
                <p class="text-muted mt-2"><small>Updated: ${new Date().toLocaleString()}</small></p>
            `;
            
            document.getElementById('standings-container').innerHTML = standingsHTML;
        }
    } catch (error) {
        document.getElementById('standings-container').innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i> Unable to load standings. Please check back later.
            </div>
        `;
    }
}

// Check for live games
async function checkLiveGame() {
    try {
        const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/${FLORIDA_TEAM_ID}/schedule`);
        const data = await response.json();
        
        const games = data.events || [];
        const liveGame = games.find(game => game.status.type.state === "in");
        
        if (liveGame) {
            const competition = liveGame.competitions[0];
            const homeTeam = competition.competitors.find(team => team.homeAway === "home");
            const awayTeam = competition.competitors.find(team => team.homeAway === "away");
            const gators = competition.competitors.find(team => team.id === "57");
            const opponent = competition.competitors.find(team => team.id !== "57");
            
            document.getElementById('live-ticker').style.display = 'block';
            document.getElementById('ticker-content').innerHTML = `
                <strong>
                    ${awayTeam.team.displayName} ${awayTeam.score} - ${homeTeam.score} ${homeTeam.team.displayName}
                </strong>
                | ${liveGame.status.displayClock} - ${liveGame.status.period === 1 ? '1st' : '2nd'} Half
                | <a href="#schedule" class="text-white">View Details</a>
            `;
            
            // Add confetti if Gators are winning
            if (parseInt(gators.score) > parseInt(opponent.score)) {
                document.getElementById('ticker-content').innerHTML += ' 🎉 GO GATORS!';
            }
        } else {
            document.getElementById('live-ticker').style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking live game:', error);
    }
}

// Weather widget
async function loadWeather() {
    try {
        // Using wttr.in for simple weather (no API key needed)
        const response = await fetch('https://wttr.in/Gainesville,FL?format=j1');
        const data = await response.json();
        
        const current = data.current_condition[0];
        const weatherHTML = `
            <div class="row align-items-center">
                <div class="col-auto">
                    <i class="fas fa-temperature-high fa-2x"></i>
                </div>
                <div class="col">
                    <strong>${current.temp_F}°F</strong> - ${current.weatherDesc[0].value}<br>
                    <small>Feels like ${current.FeelsLikeF}°F | Humidity: ${current.humidity}%</small>
                </div>
            </div>
        `;
        
        document.getElementById('weather-content').innerHTML = weatherHTML;
    } catch (error) {
        document.getElementById('weather-content').innerHTML = `
            <p>Gainesville, FL - Perfect basketball weather! 🏀</p>
        `;
    }
}

// Countdown timer
function initializeCountdown() {
    updateCountdown();
}

function updateCountdown() {
    if (!window.nextGame) {
        document.getElementById('countdown').innerHTML = '<p>No upcoming games scheduled</p>';
        return;
    }
    
    const gameDate = new Date(window.nextGame.date);
    const now = new Date();
    const difference = gameDate - now;
    
    if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
        
        // Update next game info
        const opponent = window.nextGame.competitions[0].competitors.find(team => team.id !== "57");
        const isHome = window.nextGame.competitions[0].competitors.find(team => team.id === "57").homeAway === "home";
        
        document.getElementById('next-game-info').innerHTML = `
            <p class="mb-2">
                <strong>${isHome ? 'vs' : '@'} ${opponent.team.displayName}</strong><br>
                ${gameDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} 
                at ${gameDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </p>
        `;
    } else {
        document.getElementById('countdown').innerHTML = '<p>Game in progress or completed!</p>';
    }
}

// Fan Poll System
function initializePoll() {
    // Load saved votes from localStorage
    const votes = JSON.parse(localStorage.getItem('gatorsPoll') || '{"option1":0,"option2":0,"option3":0,"option4":0}');
    updatePollDisplay(votes);
}

function vote(option) {
    let votes = JSON.parse(localStorage.getItem('gatorsPoll') || '{"option1":0,"option2":0,"option3":0,"option4":0}');
    
    // Check if user already voted
    const hasVoted = localStorage.getItem('hasVoted');
    if (hasVoted) {
        alert('You have already voted in this poll!');
        return;
    }
    
    votes[option]++;
    localStorage.setItem('gatorsPoll', JSON.stringify(votes));
    localStorage.setItem('hasVoted', 'true');
    
    // Highlight selected option
    document.querySelectorAll('.poll-option').forEach(el => el.classList.remove('selected'));
    event.target.closest('.poll-option').classList.add('selected');
    
    updatePollDisplay(votes);
}

function updatePollDisplay(votes) {
    const total = Object.values(votes).reduce((a, b) => a + b, 0) || 1;
    
    document.getElementById('vote1').textContent = Math.round(votes.option1 / total * 100) + '%';
    document.getElementById('vote2').textContent = Math.round(votes.option2 / total * 100) + '%';
    document.getElementById('vote3').textContent = Math.round(votes.option3 / total * 100) + '%';
    document.getElementById('vote4').textContent = Math.round(votes.option4 / total * 100) + '%';
    document.getElementById('total-votes').textContent = total;
}

// Scroll to top function
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Add smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Console Easter Egg
console.log('%c🐊 GO GATORS! 🏀', 'color: #FA4616; font-size: 24px; font-weight: bold;');
console.log('%cCreated by Robbiek7455', 'color: #0021A5; font-size: 14px;');
console.log('%cCheck out the repo: https://github.com/Robbiek7455/florida-gators-basketball', 'color: #666; font-size: 12px;');
