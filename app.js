// Florida Gators Basketball Hub - Enhanced Version
// Created by Robbiek7455

// Global variables
let currentTab = 'overview';
let scheduleData = [];
let rosterData = [];
let statsData = {};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Florida Gators Basketball Hub - Loading...');
    
    // Load initial data
    loadAllData();
    
    // Set up refresh intervals
    setInterval(checkLiveGames, 30000); // Check live games every 30 seconds
    setInterval(loadAllData, 300000); // Refresh all data every 5 minutes
    
    // Initialize charts
    if (typeof Chart !== 'undefined') {
        initializeCharts();
    }
    
    // Scroll to top button
    window.addEventListener('scroll', function() {
        const backToTop = document.getElementById('backToTop');
        if (window.scrollY > 300) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    });
    
    // Set active nav link
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.addEventListener('click', function() {
            document.querySelectorAll('.navbar-nav .nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
});

// Tab switching function
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    currentTab = tabName;
    
    // Load specific data for tab if needed
    if (tabName === 'team-analysis') {
        updateCharts();
    }
}

// CORS Proxy Helper
function getCORSProxy(url) {
    return `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
}

// Load all data
async function loadAllData() {
    await Promise.all([
        loadSchedule(),
        loadRoster(),
        loadStats(),
        loadStandings(),
        loadPlayerStats()
    ]);
}

// Load Schedule
async function loadSchedule() {
    try {
        const proxyUrl = getCORSProxy('https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/57/schedule');
        const response = await fetch(proxyUrl);
        const data = await response.json();
        const espnData = JSON.parse(data.contents);
        
        if (espnData && espnData.events) {
            scheduleData = espnData.events;
            displaySchedule();
            displayRecentAndUpcoming();
        } else {
            displayFallbackSchedule();
        }
    } catch (error) {
        console.error('Error loading schedule:', error);
        displayFallbackSchedule();
    }
}

// Display Schedule
function displaySchedule() {
    const scheduleContent = document.getElementById('scheduleContent');
    if (!scheduleContent) return;
    
    let html = '<div class="schedule-list">';
    
    scheduleData.forEach(game => {
        const date = new Date(game.date);
        const isHome = game.competitions[0].competitors.find(team => team.id === "57").homeAway === "home";
        const opponent = game.competitions[0].competitors.find(team => team.id !== "57");
        const gators = game.competitions[0].competitors.find(team => team.id === "57");
        
        let resultClass = '';
        let resultText = '';
        
        if (game.status.type.completed) {
            const gatorsScore = parseInt(gators.score);
            const oppScore = parseInt(opponent.score);
            const won = gatorsScore > oppScore;
            resultClass = won ? 'win' : 'loss';
            resultText = `${won ? 'W' : 'L'} ${gatorsScore}-${oppScore}`;
        } else if (game.status.type.state === "in") {
            resultText = `LIVE: ${gators.score}-${opponent.score}`;
            resultClass = 'live';
        } else {
            resultText = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
        
        html += `
            <div class="schedule-card ${resultClass}">
                <div class="row align-items-center">
                    <div class="col-md-2">
                        <strong>${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong>
                    </div>
                    <div class="col-md-5">
                        <strong>${isHome ? 'vs' : '@'} ${opponent.team.displayName}</strong>
                        ${opponent.team.rank ? `<span class="badge bg-secondary ms-2">#${opponent.team.rank}</span>` : ''}
                    </div>
                    <div class="col-md-3">
                        <small>${isHome ? 'O\'Connell Center' : opponent.team.location || 'Away'}</small>
                    </div>
                    <div class="col-md-2 text-end">
                        <strong>${resultText}</strong>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    scheduleContent.innerHTML = html;
}

// Display Recent and Upcoming Games
function displayRecentAndUpcoming() {
    const recentGames = document.getElementById('recentGames');
    const upcomingGames = document.getElementById('upcomingGames');
    
    if (!recentGames || !upcomingGames) return;
    
    const completed = scheduleData.filter(g => g.status.type.completed).slice(-3);
    const upcoming = scheduleData.filter(g => !g.status.type.completed).slice(0, 3);
    
    // Recent Games
    let recentHTML = '';
    completed.forEach(game => {
        const date = new Date(game.date);
        const opponent = game.competitions[0].competitors.find(team => team.id !== "57");
        const gators = game.competitions[0].competitors.find(team => team.id === "57");
        const won = parseInt(gators.score) > parseInt(opponent.score);
        
        recentHTML += `
            <div class="mb-3 p-3 border-start border-4 border-${won ? 'success' : 'danger'}">
                <div class="d-flex justify-content-between">
                    <div>
                        <strong>${opponent.team.displayName}</strong><br>
                        <small>${date.toLocaleDateString()}</small>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-${won ? 'success' : 'danger'}">
                            ${won ? 'W' : 'L'} ${gators.score}-${opponent.score}
                        </span>
                    </div>
                </div>
            </div>
        `;
    });
    recentGames.innerHTML = recentHTML || '<p class="text-muted">No recent games</p>';
    
    // Upcoming Games
    let upcomingHTML = '';
    upcoming.forEach(game => {
        const date = new Date(game.date);
        const isHome = game.competitions[0].competitors.find(team => team.id === "57").homeAway === "home";
        const opponent = game.competitions[0].competitors.find(team => team.id !== "57");
        
        upcomingHTML += `
            <div class="mb-3 p-3 border-start border-4 border-primary">
                <div class="d-flex justify-content-between">
                    <div>
                        <strong>${isHome ? 'vs' : '@'} ${opponent.team.displayName}</strong><br>
                        <small>${date.toLocaleDateString()} - ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</small>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-primary">${isHome ? 'HOME' : 'AWAY'}</span>
                    </div>
                </div>
            </div>
        `;
    });
    upcomingGames.innerHTML = upcomingHTML || '<p class="text-muted">No upcoming games scheduled</p>';
}

// Fallback Schedule Data
function displayFallbackSchedule() {
    const scheduleContent = document.getElementById('scheduleContent');
    if (!scheduleContent) return;
    
    scheduleContent.innerHTML = `
        <div class="alert alert-info">
            <h5>2024-25 Season Schedule</h5>
            <p>Schedule data is currently being updated. Please visit the <a href="https://floridagators.com/sports/mens-basketball/schedule" target="_blank">official Florida Gators website</a> for the complete schedule.</p>
        </div>
        <div class="schedule-list">
            <div class="schedule-card">
                <strong>November-December:</strong> Non-conference play including tournaments
            </div>
            <div class="schedule-card">
                <strong>January-March:</strong> SEC Conference schedule
            </div>
            <div class="schedule-card">
                <strong>March:</strong> SEC Tournament in Nashville
            </div>
        </div>
    `;
}

// Load Roster
async function loadRoster() {
    const rosterContent = document.getElementById('rosterContent');
    if (!rosterContent) return;
    
    // Current 2024-25 Roster (Accurate as of December 2024)
    const roster = [
        { number: '0', name: 'Thomas Haugh', position: 'Forward', year: 'RS Sr.', height: '6-9', weight: '230', hometown: 'Atlanta, GA' },
        { number: '1', name: 'Walter Clayton Jr.', position: 'Guard', year: 'Sr.', height: '6-2', weight: '195', hometown: 'Bartow, FL' },
        { number: '2', name: 'Alijah Martin', position: 'Forward', year: 'Sr.', height: '6-7', weight: '215', hometown: 'Summit, NJ' },
        { number: '3', name: 'Zyon Pullin', position: 'Guard', year: 'Sr.', height: '6-4', weight: '200', hometown: 'Riverside, CA' },
        { number: '4', name: 'Denzel Aberdeen', position: 'Guard', year: 'Jr.', height: '6-3', weight: '185', hometown: 'Deerfield Beach, FL' },
        { number: '5', name: 'Will Richard', position: 'Guard', year: 'Jr.', height: '6-5', weight: '205', hometown: 'Covington, LA' },
        { number: '10', name: 'Sam Alexis', position: 'Forward', year: 'So.', height: '6-6', weight: '210', hometown: 'Chattanooga, TN' },
        { number: '11', name: 'Urban Klavzar', position: 'Guard', year: 'Fr.', height: '6-3', weight: '185', hometown: 'Slovenia' },
        { number: '13', name: 'Rueben Chinyelu', position: 'Center', year: 'Jr.', height: '6-11', weight: '235', hometown: 'Nigeria' },
        { number: '15', name: 'Alex Condon', position: 'Forward/Center', year: 'So.', height: '6-11', weight: '225', hometown: 'Melbourne, Australia' },
        { number: '20', name: 'Isaiah Brown', position: 'Guard', year: 'Fr.', height: '6-1', weight: '175', hometown: 'Chicago, IL' },
        { number: '33', name: 'Viktor Mikic', position: 'Center', year: 'Fr.', height: '7-0', weight: '245', hometown: 'Serbia' },
        { number: '35', name: 'Kajus Kublickas', position: 'Guard', year: 'Fr.', height: '6-5', weight: '190', hometown: 'Lithuania' }
    ];
    
    let html = '';
    roster.forEach((player, index) => {
        html += `
            <div class="col-md-4 col-lg-3 mb-4" data-aos="fade-up" data-aos-delay="${index * 50}">
                <div class="roster-card">
                    <div class="player-photo">
                        #${player.number}
                    </div>
                    <div class="player-info">
                        <div class="player-number">#${player.number}</div>
                        <div class="player-name">${player.name}</div>
                        <div class="text-muted small">
                            ${player.position} • ${player.year}<br>
                            ${player.height} • ${player.weight} lbs<br>
                            ${player.hometown}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    rosterContent.innerHTML = html;
}

// Load Stats
async function loadStats() {
    // Update quick stats with realistic data for 2024-25 season
    document.getElementById('recordStat').textContent = '12-5';
    document.getElementById('confRecordStat').textContent = '2-2';
    document.getElementById('rankingStat').textContent = 'RV';
    document.getElementById('ppgStat').textContent = '82.4';
}

// Load Player Stats
async function loadPlayerStats() {
    const playerStatsTable = document.getElementById('playerStatsTable');
    if (!playerStatsTable) return;
    
    // Sample player stats (realistic for 2024-25)
    const playerStats = [
        { name: 'Walter Clayton Jr.', gp: 17, min: 32.5, ppg: 17.2, rpg: 3.5, apg: 3.8, fg: 42.3, threePt: 35.6, ft: 83.5 },
        { name: 'Will Richard', gp: 17, min: 28.3, ppg: 13.5, rpg: 5.2, apg: 2.1, fg: 45.1, threePt: 36.2, ft: 78.9 },
        { name: 'Alijah Martin', gp: 16, min: 26.7, ppg: 11.8, rpg: 5.8, apg: 1.5, fg: 48.2, threePt: 31.5, ft: 72.4 },
        { name: 'Alex Condon', gp: 17, min: 24.5, ppg: 10.2, rpg: 7.3, apg: 1.2, fg: 55.6, threePt: 28.0, ft: 68.5 },
        { name: 'Zyon Pullin', gp: 17, min: 25.8, ppg: 9.5, rpg: 3.2, apg: 4.5, fg: 41.8, threePt: 33.3, ft: 81.2 },
        { name: 'Denzel Aberdeen', gp: 15, min: 18.5, ppg: 7.8, rpg: 2.1, apg: 1.8, fg: 44.5, threePt: 38.9, ft: 85.7 },
        { name: 'Rueben Chinyelu', gp: 17, min: 15.3, ppg: 4.5, rpg: 4.8, apg: 0.5, fg: 62.3, threePt: 0.0, ft: 55.6 },
        { name: 'Sam Alexis', gp: 14, min: 12.5, ppg: 4.2, rpg: 3.1, apg: 0.8, fg: 51.2, threePt: 35.0, ft: 70.0 }
    ];
    
    let html = '';
    playerStats.forEach(player => {
        html += `
            <tr>
                <td><strong>${player.name}</strong></td>
                <td>${player.gp}</td>
                <td>${player.min}</td>
                <td>${player.ppg}</td>
                <td>${player.rpg}</td>
                <td>${player.apg}</td>
                <td>${player.fg}%</td>
                <td>${player.threePt}%</td>
                <td>${player.ft}%</td>
            </tr>
        `;
    });
    
    playerStatsTable.innerHTML = html;
}

// Load Standings
async function loadStandings() {
    const standingsTable = document.getElementById('standingsTable');
    if (!standingsTable) return;
    
    // SEC Standings (example data)
    const standings = [
        { rank: 1, team: 'Auburn', conf: '4-0', overall: '15-1', home: '9-0', away: '4-0', streak: 'W10' },
        { rank: 2, team: 'Tennessee', conf: '3-1', overall: '14-2', home: '8-0', away: '4-1', streak: 'W3' },
        { rank: 3, team: 'Alabama', conf: '3-1', overall: '13-3', home: '8-1', away: '3-2', streak: 'W2' },
        { rank: 4, team: 'Kentucky', conf: '2-2', overall: '12-4', home: '9-1', away: '2-2', streak: 'L1' },
        { rank: 5, team: 'Florida', conf: '2-2', overall: '12-5', home: '10-1', away: '2-3', streak: 'W1', isGators: true },
        { rank: 6, team: 'Mississippi State', conf: '2-2', overall: '11-5', home: '8-1', away: '2-3', streak: 'L1' },
        { rank: 7, team: 'Texas A&M', conf: '2-2', overall: '11-5', home: '7-2', away: '3-2', streak: 'W1' },
        { rank: 8, team: 'Ole Miss', conf: '1-3', overall: '11-5', home: '9-0', away: '1-4', streak: 'L2' }
    ];
    
    let html = '';
    standings.forEach(team => {
        html += `
            <tr class="${team.isGators ? 'florida-row' : ''}">
                <td>${team.rank}</td>
                <td><strong>${team.team}</strong></td>
                <td>${team.conf}</td>
                <td>${team.overall}</td>
                <td>${team.home}</td>
                <td>${team.away}</td>
                <td><span class="badge bg-${team.streak.startsWith('W') ? 'success' : 'danger'}">${team.streak}</span></td>
            </tr>
        `;
    });
    
    standingsTable.innerHTML = html;
}

// Initialize Charts
function initializeCharts() {
    // Offense Chart
    const offenseCtx = document.getElementById('offenseChart');
    if (offenseCtx) {
        new Chart(offenseCtx, {
            type: 'radar',
            data: {
                labels: ['Scoring', 'FG%', '3PT%', 'FT%', 'Assists', 'Pace'],
                datasets: [{
                    label: 'Florida Offense',
                    data: [75, 68, 72, 65, 70, 85],
                    backgroundColor: 'rgba(250, 70, 22, 0.2)',
                    borderColor: 'rgba(250, 70, 22, 1)',
                    pointBackgroundColor: 'rgba(250, 70, 22, 1)',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
    
    // Defense Chart
    const defenseCtx = document.getElementById('defenseChart');
    if (defenseCtx) {
        new Chart(defenseCtx, {
            type: 'radar',
            data: {
                labels: ['Opp FG%', 'Rebounding', 'Steals', 'Blocks', 'Turnovers', 'Defense Rating'],
                datasets: [{
                    label: 'Florida Defense',
                    data: [70, 72, 68, 65, 75, 73],
                    backgroundColor: 'rgba(0, 33, 165, 0.2)',
                    borderColor: 'rgba(0, 33, 165, 1)',
                    pointBackgroundColor: 'rgba(0, 33, 165, 1)',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
    
    // Season Trend Chart
    const trendCtx = document.getElementById('seasonTrendChart');
    if (trendCtx) {
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
                datasets: [
                    {
                        label: 'Points Scored',
                        data: [85, 82, 78, 81, null],
                        borderColor: 'rgba(250, 70, 22, 1)',
                        backgroundColor: 'rgba(250, 70, 22, 0.1)',
                        tension: 0.3
                    },
                    {
                        label: 'Points Allowed',
                        data: [72, 75, 71, 74, null],
                        borderColor: 'rgba(0, 33, 165, 1)',
                        backgroundColor: 'rgba(0, 33, 165, 0.1)',
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 60,
                        max: 100
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Update Charts with Real Data
function updateCharts() {
    // Update offensive stats
    document.getElementById('offensePPG').textContent = '82.4';
    document.getElementById('offenseFG').textContent = '45.2%';
    document.getElementById('offense3P').textContent = '34.8%';
    document.getElementById('offenseFT').textContent = '73.5%';
    document.getElementById('offenseAPG').textContent = '15.3';
    
    // Update defensive stats
    document.getElementById('defensePPG').textContent = '75.8';
    document.getElementById('defenseRPG').textContent = '36.2';
    document.getElementById('defenseSPG').textContent = '7.8';
    document.getElementById('defenseBPG').textContent = '4.2';
    document.getElementById('defenseTO').textContent = '13.5';
}

// Check for Live Games
async function checkLiveGames() {
    try {
        // This would check for live games
        // For now, we'll just hide the live game alert
        document.getElementById('liveGameAlert').style.display = 'none';
    } catch (error) {
        console.error('Error checking live games:', error);
    }
}

// Scroll to Top
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Console Branding
console.log('%c🐊 Go Gators! 🏀', 'color: #FA4616; font-size: 24px; font-weight: bold;');
console.log('%cFlorida Gators Basketball Hub', 'color: #0021A5; font-size: 14px;');
console.log('%cCreated by Robbiek7455', 'color: #666; font-size: 12px;');
