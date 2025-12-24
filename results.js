document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ---
    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRm3c6QYL4v6zWOEriAL68yo6vIwuknvthe100imFfNuEatoqwcKG4XnGWg83tRhs3EeosEthzSUB29/pub?gid=694960132&single=true&output=csv';

    const CONFIG = {
        userIdColIndex: 5,
        categories: [
            // We use 'translationKey' instead of hardcoded names
            { id: 'cat1', translationKey: "cat1Title", icon: "💃🥳", colIndex: 1 },
            { id: 'cat2', translationKey: "cat2Title", icon: "✨👗", colIndex: 2 },
            { id: 'cat3', translationKey: "cat3Title", icon: "😭❤️", colIndex: 3 },
            { id: 'cat4', translationKey: "cat4Title", icon: "📸🤳", colIndex: 4 }
        ]
    };

    // --- LANGUAGE HANDLER ---
    const currentLang = localStorage.getItem('weddingLang') || 'es';
    const langStrings = translations[currentLang];

    // Apply translations to static elements
    document.querySelectorAll('[data-translate-key]').forEach(el => {
        const key = el.dataset.translateKey;
        if (langStrings[key]) el.textContent = langStrings[key];
    });


    // --- DOM ELEMENTS ---
    const loading = document.getElementById('loading');
    const container = document.getElementById('resultsContainer');
    const errorDiv = document.getElementById('error');

    // --- FETCH DATA ---
    const uniqueCsvUrl = CSV_URL + "&t=" + Date.now();
    const PROXY_URL = "https://corsproxy.io/?" + encodeURIComponent(uniqueCsvUrl);

    fetch(PROXY_URL)
        .then(response => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.text();
        })
        .then(csvText => {
            const rows = parseCSV(csvText);
            const dataRows = rows.slice(1);
            const cleanData = processVotes(dataRows);
            const winners = calculateWinners(cleanData);
            renderResults(winners);
            
            loading.classList.add('hidden');
            container.classList.remove('hidden');
            container.classList.add('grid');
        })
        .catch(err => {
            console.error("Fetch Error:", err);
            loading.classList.add('hidden');
            if(errorDiv) {
                errorDiv.classList.remove('hidden');
                errorDiv.textContent = langStrings.resultsError; // Translated error
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
        return rows;
    }

    // --- DEDUPLICATION ---
    function processVotes(rows) {
        const latestVotesMap = new Map();
        rows.forEach((row, index) => {
            if (row.length <= CONFIG.userIdColIndex) return;
            const userId = row[CONFIG.userIdColIndex];
            const timestampStr = row[0];

            if(userId && userId.trim() !== '') {
                const cleanId = userId.trim();
                const currentObj = { data: row, date: parseGoogleDate(timestampStr) };
                if (!latestVotesMap.has(cleanId)) {
                    latestVotesMap.set(cleanId, currentObj);
                } else {
                    const existingObj = latestVotesMap.get(cleanId);
                    if (currentObj.date > existingObj.date) {
                        latestVotesMap.set(cleanId, currentObj);
                    }
                }
            } else {
                latestVotesMap.set(`unknown-${index}`, { data: row, date: new Date() });
            }
        });
        return Array.from(latestVotesMap.values()).map(obj => obj.data);
    }

    function parseGoogleDate(dateStr) {
        if (!dateStr) return new Date(0);
        let date = new Date(dateStr);
        if (!isNaN(date.getTime())) return date;
        try {
            const parts = dateStr.split(' ');
            const dateParts = parts[0].split('/');
            const timeParts = parts[1] ? parts[1].split(':') : [0, 0, 0];
            return new Date(dateParts[2], dateParts[1] - 1, dateParts[0], timeParts[0] || 0, timeParts[1] || 0, timeParts[2] || 0);
        } catch (e) { return new Date(0); }
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
            
            let winner = "---";
            let maxVotes = 0;
            Object.entries(counts).forEach(([name, count]) => {
                if (count > maxVotes) { maxVotes = count; winner = name; }
            });

            // LOOKUP TRANSLATION HERE
            const translatedTitle = langStrings[cat.translationKey] || cat.translationKey;

            results[cat.id] = { winner, votes: maxVotes, title: translatedTitle, icon: cat.icon };
        });
        return results;
    }

    // --- RENDER CARDS ---
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

            // Use translation for "Vote/Votes"
            const voteLabel = data.votes === 1 ? langStrings.resultsVote : langStrings.resultsVotes;

            card.innerHTML = `
                <div class="text-5xl mb-6 transform group-hover:scale-110 transition duration-500">${data.icon}</div>
                <h2 class="font-script text-4xl text-zinc-900 mb-2">${data.title}</h2>
                <div class="flex-grow flex items-center justify-center w-full mt-6 mb-2 relative z-10">
                    <div class="winner-name blur-reveal font-sans font-bold text-3xl md:text-4xl text-center px-4 py-2 rounded-lg select-none" onclick="reveal(this)">
                        ${data.winner}
                    </div>
                </div>
                <p class="text-zinc-400 text-xs tracking-widest uppercase mt-6 border-t border-zinc-100 pt-4 w-1/2 text-center">
                    ${data.votes} ${voteLabel}
                </p>
            `;
            container.appendChild(card);
        });
    }
});

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