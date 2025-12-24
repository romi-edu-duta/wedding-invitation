document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ---
    
    // PASTE YOUR "PUBLISH TO WEB" CSV LINK HERE:
    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRm3c6QYL4v6zWOEriAL68yo6vIwuknvthe100imFfNuEatoqwcKG4XnGWg83tRhs3EeosEthzSUB29/pub?gid=694960132&single=true&output=csv';

    // MAP YOUR COLUMNS (Based on your Google Sheet columns, A=0, B=1, C=2...)
    // Usually: Timestamp=0, Cat1=1, Cat2=2, Cat3=3, Cat4=4, UserID=5
    const CONFIG = {
        userIdColIndex: 5, // The index of the Hidden ID column
        categories: [
            { id: 'cat1', name: "El Terremoto", icon: "💃🥳", colIndex: 1 },
            { id: 'cat2', name: "Look Espectacular", icon: "✨👗", colIndex: 2 },
            { id: 'cat3', name: "Lágrima Fácil", icon: "😭❤️", colIndex: 3 },
            { id: 'cat4', name: "El Paparazzi", icon: "📸🤳", colIndex: 4 }
        ]
    };

    // --- DOM ELEMENTS ---
    const loading = document.getElementById('loading');
    const container = document.getElementById('resultsContainer');
    const errorDiv = document.getElementById('error');
    const debugBody = document.getElementById('debugTableBody');

    // --- FETCH DATA ---
    const uniqueCsvUrl = CSV_URL + "&t=" + Date.now();
    
    // Pass the unique URL to the proxy
    const PROXY_URL = "https://corsproxy.io/?" + encodeURIComponent(uniqueCsvUrl);

    fetch(PROXY_URL)
        .then(response => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.text();
        })
        .then(csvText => {
            const rows = parseCSV(csvText);
            const dataRows = rows.slice(1); // Remove header
            
            // 1. Process: Keep only latest vote per ID
            const cleanData = processVotes(dataRows);
            
            // 2. Calculate: Count totals
            const winners = calculateWinners(cleanData);
            
            // 3. Render: Cards and Debug Table
            renderResults(winners);
            // renderDebugTable(cleanData);
            
            loading.classList.add('hidden');
            container.classList.remove('hidden');
            container.classList.add('grid');
        })
        .catch(err => {
            console.error("Fetch Error:", err);
            loading.classList.add('hidden');
            if(errorDiv) {
                errorDiv.classList.remove('hidden');
                errorDiv.textContent = "Error: " + err.message;
            }
        });

    // --- PARSER ---
    function parseCSV(text) {
        const rows = [];
        let currentRow = [];
        let currentCell = '';
        let insideQuotes = false;
        text = text.replace(/\r\n/g, '\n');

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];

            if (char === '"') {
                if (insideQuotes && nextChar === '"') { currentCell += '"'; i++; }
                else { insideQuotes = !insideQuotes; }
            } else if (char === ',' && !insideQuotes) {
                currentRow.push(currentCell); currentCell = '';
            } else if (char === '\n' && !insideQuotes) {
                currentRow.push(currentCell); rows.push(currentRow); currentRow = []; currentCell = '';
            } else { currentCell += char; }
        }
        if (currentCell || currentRow.length > 0) { currentRow.push(currentCell); rows.push(currentRow); }

        // show rows in console for debugging
        console.log("Parsed CSV Rows:", rows);
        return rows;
    }

    // --- DEDUPLICATION (The "Latest Vote" Logic) ---
    function processVotes(rows) {
        const latestVotesMap = new Map();

        console.log(`Total raw votes found: ${rows.length}`);

        rows.forEach((row, index) => {
            // Safety: Ensure row has enough columns
            if (row.length <= CONFIG.userIdColIndex) return;

            const userId = row[CONFIG.userIdColIndex]; // Column 5
            const timestampStr = row[0]; // Column 0 (Timestamp)

            if(userId && userId.trim() !== '') {
                const cleanId = userId.trim();
                const currentObj = {
                    data: row,
                    date: parseGoogleDate(timestampStr)
                };

                // Logic: 
                // 1. If ID doesn't exist, add it.
                // 2. If ID exists, compare dates. If new one is newer, overwrite.
                if (!latestVotesMap.has(cleanId)) {
                    latestVotesMap.set(cleanId, currentObj);
                } else {
                    const existingObj = latestVotesMap.get(cleanId);
                    if (currentObj.date > existingObj.date) {
                        // We found a newer vote for this person! Update it.
                        latestVotesMap.set(cleanId, currentObj);
                    }
                }
            } else {
                // Rows without ID (legacy testing?) treat as unique
                latestVotesMap.set(`unknown-${index}`, { data: row, date: new Date() });
            }
        });

        // Convert back to simple array of Rows
        const uniqueRows = Array.from(latestVotesMap.values()).map(obj => obj.data);

        console.log(`Unique voters after cleanup: ${uniqueRows.length}`);
        return uniqueRows;
    }



    // Helper to parse Google Sheets Date format (DD/MM/YYYY HH:mm:ss)
    function parseGoogleDate(dateStr) {
        if (!dateStr) return new Date(0); // Return old date if empty

        // Try standard parsing first
        let date = new Date(dateStr);
        if (!isNaN(date.getTime())) return date;

        // Handle Spanish format: 28/12/2025 14:30:00
        try {
            const parts = dateStr.split(' ');
            const dateParts = parts[0].split('/');
            const timeParts = parts[1] ? parts[1].split(':') : [0, 0, 0];

            // new Date(year, monthIndex, day, hours, minutes, seconds)
            return new Date(
                dateParts[2],       // Year
                dateParts[1] - 1,   // Month (0-based)
                dateParts[0],       // Day
                timeParts[0] || 0,  // Hours
                timeParts[1] || 0,  // Minutes
                timeParts[2] || 0   // Seconds
            );
        } catch (e) {
            console.warn("Could not parse date:", dateStr);
            return new Date(0);
        }
    }

    // --- CALCULATE WINNERS ---
    function calculateWinners(uniqueRows) {
        const results = {};

        CONFIG.categories.forEach(cat => {
            const counts = {};
            
            uniqueRows.forEach(row => {
                const vote = row[cat.colIndex];
                if (vote && vote.trim() !== '') {
                    const cleanName = vote.trim();
                    counts[cleanName] = (counts[cleanName] || 0) + 1;
                }
            });

            // Find winner (Handle ties by picking first)
            let winner = "---";
            let maxVotes = 0;
            
            Object.entries(counts).forEach(([name, count]) => {
                if (count > maxVotes) {
                    maxVotes = count;
                    winner = name;
                }
            });

            results[cat.id] = { winner, votes: maxVotes, title: cat.name, icon: cat.icon };
        });

        return results;
    }

    // --- RENDER CARDS (White Theme) ---
    function renderResults(winners) {
        container.innerHTML = '';
        Object.values(winners).forEach((data, index) => {
            const card = document.createElement('div');
            card.className = "award-card bg-white p-8 rounded-xl border border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center min-h-[320px] relative overflow-hidden group";
            
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 150);

            card.innerHTML = `
                <div class="text-5xl mb-6 transform group-hover:scale-110 transition duration-500">${data.icon}</div>
                <h2 class="font-script text-4xl text-zinc-900 mb-2">${data.title}</h2>
                
                <div class="flex-grow flex items-center justify-center w-full mt-6 mb-2 relative z-10">
                    <div class="winner-name blur-reveal font-sans font-bold text-3xl md:text-4xl text-center px-4 py-2 rounded-lg select-none" 
                         onclick="reveal(this)">
                        ${data.winner}
                    </div>
                </div>
                
                <p class="text-zinc-400 text-xs tracking-widest uppercase mt-6 border-t border-zinc-100 pt-4 w-1/2 text-center">
                    ${data.votes} ${data.votes === 1 ? 'Voto' : 'Votos'}
                </p>
            `;
            container.appendChild(card);
        });
    }

    // --- RENDER DEBUG TABLE ---
    function renderDebugTable(rows) {
        if(!debugBody) return;
        debugBody.innerHTML = '';
        
        // Show newest first
        const reversedRows = [...rows].reverse();
        
        reversedRows.forEach(row => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-zinc-50 transition";
            
            // Timestamp (Col 0)
            const timestamp = row[0] || '-';
            // ID (Col 5) - Masked
            const fullId = row[CONFIG.userIdColIndex] || 'Anon';
            const shortId = fullId.length > 10 ? '...' + fullId.slice(-6) : fullId;
            
            // Categories
            const cat1 = row[1] || '-';
            const cat2 = row[2] || '-';
            const cat3 = row[3] || '-';
            const cat4 = row[4] || '-';

            tr.innerHTML = `
                <td class="px-4 py-2 whitespace-nowrap">${timestamp}</td>
                <td class="px-4 py-2 font-mono text-zinc-400">${shortId}</td>
                <td class="px-4 py-2 font-medium text-zinc-800">${cat1}</td>
                <td class="px-4 py-2">${cat2}</td>
                <td class="px-4 py-2">${cat3}</td>
                <td class="px-4 py-2">${cat4}</td>
            `;
            debugBody.appendChild(tr);
        });
    }
});

// Global Reveal
window.reveal = function(element) {
    if (!element.classList.contains('revealed')) {
        element.classList.remove('blur-reveal');
        element.classList.add('revealed');
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#D4AF37', '#C0C0C0', '#F3F4F6', '#18181B']
        });
    }
};