document.addEventListener('DOMContentLoaded', () => {
    // State
    let providers = [];
    let providerChart = null;

    // DOM Elements
    const tableBody = document.getElementById('tableBody');
    const emptyState = document.getElementById('emptyState');
    const countSpan = document.getElementById('count');
    const providersTable = document.getElementById('providersTable');
    const dashboardSection = document.getElementById('dashboardSection');
    const viewChartBtn = document.getElementById('viewChartBtn');
    const closeChartBtn = document.getElementById('closeChartBtn');

    // Stats elements
    const totalProvidersEl = document.getElementById('totalProviders');
    const avgQualityEl = document.getElementById('avgQuality');
    const avgPriceEl = document.getElementById('avgPrice');
    const avgTimeEl = document.getElementById('avgTime');

    // Event Listeners
    viewChartBtn.addEventListener('click', () => {
        if (providers.length > 0) {
            calculateScores();
            updateChart();
            dashboardSection.classList.remove('hidden');
            dashboardSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            alert('No provider data available to display analytics.');
        }
    });

    closeChartBtn.addEventListener('click', () => {
        dashboardSection.classList.add('hidden');
    });

    // Load data from localStorage (simulating data from admin)
    function loadProviders() {
        const storedData = localStorage.getItem('providers');
        if (storedData) {
            try {
                providers = JSON.parse(storedData);
                calculateScores();
                renderProviders();
                updateStats();
            } catch (error) {
                console.error('Error loading provider data:', error);
                providers = [];
            }
        }
    }

    // Calculate scores for providers
    function calculateScores() {
        if (providers.length === 0) return;

        let minPrice = Math.min(...providers.map(p => p.price));
        let maxQuality = Math.max(...providers.map(p => p.quality));
        let minTime = Math.min(...providers.map(p => p.time));
        let maxCapacity = Math.max(...providers.map(p => p.capacity));

        if (minPrice === 0) minPrice = 1;
        if (maxQuality === 0) maxQuality = 1;
        if (minTime === 0) minTime = 1;
        if (maxCapacity === 0) maxCapacity = 1;

        providers = providers.map(p => {
            const priceScore = (minPrice / (p.price || 1)) * 30;
            const qualityScore = ((p.quality || 0) / maxQuality) * 35;
            const timeScore = (minTime / (p.time || 1)) * 20;
            const capacityScore = ((p.capacity || 0) / maxCapacity) * 15;
            const totalScore = priceScore + qualityScore + timeScore + capacityScore;
            return {
                ...p,
                score: parseFloat(totalScore.toFixed(1)),
                breakdown: [priceScore, qualityScore, timeScore, capacityScore]
            };
        });
    }

    // Update statistics
    function updateStats() {
        if (providers.length === 0) {
            totalProvidersEl.textContent = '0';
            avgQualityEl.textContent = '0';
            avgPriceEl.textContent = '$0';
            avgTimeEl.textContent = '0';
            return;
        }

        totalProvidersEl.textContent = providers.length;

        const avgQuality = providers.reduce((sum, p) => sum + p.quality, 0) / providers.length;
        avgQualityEl.textContent = avgQuality.toFixed(1);

        const avgPrice = providers.reduce((sum, p) => sum + p.price, 0) / providers.length;
        avgPriceEl.textContent = `$${avgPrice.toFixed(2)}`;

        const avgTime = providers.reduce((sum, p) => sum + p.time, 0) / providers.length;
        avgTimeEl.textContent = `${Math.round(avgTime)} days`;
    }

    // Render providers table
    function renderProviders() {
        tableBody.innerHTML = '';
        countSpan.textContent = providers.length;

        if (providers.length === 0) {
            emptyState.classList.remove('hidden');
            providersTable.classList.add('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        providersTable.classList.remove('hidden');

        // Find best provider if scores are calculated
        const bestProvider = providers.length > 0 && providers[0].score !== undefined
            ? providers.reduce((prev, current) => (prev.score > current.score) ? prev : current)
            : null;

        // Sort by score if available, otherwise by name
        const sortedProviders = [...providers].sort((a, b) => {
            if (a.score !== undefined && b.score !== undefined) {
                return b.score - a.score;
            }
            return a.name.localeCompare(b.name);
        });

        sortedProviders.forEach(p => {
            const isBest = bestProvider && p.id === bestProvider.id && p.score !== undefined;
            const row = document.createElement('tr');
            if (isBest) row.className = 'best-row';

            const scoreDisplay = p.score !== undefined && p.score > 0
                ? `<span class="score-badge">${p.score}</span>${isBest ? ' <span class="best-provider-badge"><i class="fa-solid fa-crown"></i> Best</span>' : ''}`
                : '<span class="score-badge">Not Rated</span>';

            row.innerHTML = `
                <td><strong>${p.name}</strong></td>
                <td>$${p.price.toFixed(2)}</td>
                <td>${p.quality}/10</td>
                <td>${p.time} days</td>
                <td>${p.capacity} units</td>
                <td>${scoreDisplay}</td>
            `;

            tableBody.appendChild(row);
        });
    }

    // Update chart
    function updateChart() {
        const ctx = document.getElementById('providerChart').getContext('2d');

        if (providerChart) {
            providerChart.destroy();
        }

        const sortedProviders = [...providers].sort((a, b) => b.score - a.score);

        providerChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedProviders.map(p => p.name),
                datasets: [
                    {
                        label: 'Price Score (30%)',
                        data: sortedProviders.map(p => p.breakdown[0].toFixed(1)),
                        backgroundColor: '#34D399',
                    },
                    {
                        label: 'Quality Score (35%)',
                        data: sortedProviders.map(p => p.breakdown[1].toFixed(1)),
                        backgroundColor: '#10B981',
                    },
                    {
                        label: 'Time Score (20%)',
                        data: sortedProviders.map(p => p.breakdown[2].toFixed(1)),
                        backgroundColor: '#059669',
                    },
                    {
                        label: 'Capacity Score (15%)',
                        data: sortedProviders.map(p => p.breakdown[3].toFixed(1)),
                        backgroundColor: '#F59E0B',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                family: "'Outfit', sans-serif",
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: '#1F2937',
                        titleFont: { family: "'Outfit', sans-serif" },
                        bodyFont: { family: "'Outfit', sans-serif" }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        grid: { display: false }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Overall Performance Score'
                        }
                    }
                }
            }
        });
    }

    // Auto-refresh data every 5 seconds
    function startAutoRefresh() {
        setInterval(() => {
            const storedData = localStorage.getItem('providers');
            if (storedData) {
                try {
                    const newProviders = JSON.parse(storedData);
                    // Only update if data has changed
                    if (JSON.stringify(newProviders) !== JSON.stringify(providers)) {
                        providers = newProviders;
                        calculateScores();
                        renderProviders();
                        updateStats();

                        // Update chart if it's visible
                        if (!dashboardSection.classList.contains('hidden')) {
                            updateChart();
                        }
                    }
                } catch (error) {
                    console.error('Error refreshing provider data:', error);
                }
            }
        }, 5000); // Refresh every 5 seconds
    }

    // Initialize
    loadProviders();
    startAutoRefresh();
});
