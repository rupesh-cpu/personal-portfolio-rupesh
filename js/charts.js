const ctx = document.getElementById('cgpaChart').getContext('2d');

const cgpaChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['1st Year (FE)', '2nd Year (SE)', '3rd Year (TE)', '4th Year (BE)'],
        datasets: [{
            label: 'CGPA Progress',
            data: [9.55, 9.67, 9.79, null], // BE is pursuing
            borderColor: '#f9c74f',
            backgroundColor: 'rgba(249, 199, 79, 0.2)',
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 10,
            pointBackgroundColor: '#ff9800'
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: '#333', font: { size: 14 } } }
        },
        scales: {
            x: { ticks: { color: '#333' } },
            y: { ticks: { color: '#333' }, min: 9.4, max: 10 }
        },
        animation: {
            duration: 2000,
            easing: 'easeOutQuart'
        }
    }
});
