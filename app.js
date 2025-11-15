// Florida Gators ESPN Team ID
const FLORIDA_TEAM_ID = 57;

// Fetch schedule from ESPN
async function loadSchedule() {
    try {
        const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/${FLORIDA_TEAM_ID}/schedule`);
        const data = await response.json();
        
        let scheduleHTML = '<div class="row">';
        const games = data.events || [];
        
        // Show next 5 games
        games.slice(0, 5).forEach(game => {
            const date = new Date(game.date);
            const isHome = game.competitions[0].competitors.find(team => team.id === "57").homeAway === "home";
            const opponent = game.competitions[0].competitors.find(team => team.id !== "57");
            
            scheduleHTML += `
                <div class="col-md-6">
                    <div class="game-card">
                        <h5>${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</h5>
                        <p><strong>${isHome ? 'vs' : '@'} ${opponent.team.displayName}</strong></p>
                        <p>${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                        ${game.status.type.completed ? 
                            `<p>Final: ${game.competitions[0].competitors[0].score} - ${game.competitions[0].competitors[1].score}</p>` : 
                            ''
                        }
                    </div>
                </div>
            `;
        });
        
        scheduleHTML += '</div>';
        document.getElementById('schedule-container').innerHTML = scheduleHTML;
        
    } catch (error) {
        document.getElementById('schedule-container').innerHTML = '<p>Unable to load schedule. Please try again later.</p>';
    }
}

// Fetch roster from ESPN
async function loadRoster() {
    try {
        const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/${FLORIDA_TEAM_ID}/roster`);
        const data = await response.json();
        
        let rosterHTML = '<div class="table-responsive"><table class="table table-striped"><thead><tr><th>#</th><th>Name</th><th>Position</th><th>Height</th><th>Year</th></tr></thead><tbody>';
        
        const athletes = data.athletes || [];
        athletes.forEach(player => {
            rosterHTML += `
                <tr>
                    <td>${player.jersey || '-'}</td>
                    <td><strong>${player.fullName}</strong></td>
                    <td>${player.position.abbreviation || '-'}</td>
                    <td>${player.displayHeight || '-'}</td>
                    <td>${player.experience?.displayValue || '-'}</td>
                </tr>
            `;
        });
        
        rosterHTML += '</tbody></table></div>';
        document.getElementById('roster-container').innerHTML = rosterHTML;
        
    } catch (error) {
        document.getElementById('roster-container').innerHTML = '<p>Unable to load roster. Please try again later.</p>';
    }
}

// Fetch team stats
async function loadStats() {
    try {
        const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/${FLORIDA_TEAM_ID}`);
        const data = await response.json();
        
        const record = data.team.record?.items?.[0] || {};
        
        let statsHTML = `
            <div class="row">
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h5 class="card-title">Overall Record</h5>
                            <h2>${record.summary || '0-0'}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h5 class="card-title">Conference</h5>
                            <h2>SEC</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h5 class="card-title">Home</h5>
                            <h2>${record.stats?.find(s => s.name === "Home")?.displayValue || '0-0'}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h5 class="card-title">Away</h5>
                            <h2>${record.stats?.find(s => s.name === "Road")?.displayValue || '0-0'}</h2>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('stats-container').innerHTML = statsHTML;
        
    } catch (error) {
        document.getElementById('stats-container').innerHTML = '<p>Unable to load stats. Please try again later.</p>';
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
            
            document.getElementById('live-score').style.display = 'block';
            document.getElementById('score-content').innerHTML = `
                <h3>${awayTeam.team.displayName} ${awayTeam.score} - ${homeTeam.score} ${homeTeam.team.displayName}</h3>
                <p>${liveGame.status.displayClock} - ${liveGame.status.period}${liveGame.status.period === 1 ? 'st' : liveGame.status.period === 2 ? 'nd' : 'th'} Half</p>
            `;
        } else {
            document.getElementById('live-score').style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking live game:', error);
    }
}

// Load all data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadSchedule();
    loadRoster();
    loadStats();
    checkLiveGame();
    
    // Refresh live score every 30 seconds during games
    setInterval(checkLiveGame, 30000);
    
    // Refresh all data every 5 minutes
    setInterval(function() {
        loadSchedule();
        loadStats();
    }, 300000);
});
