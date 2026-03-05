export function initVisualizations() {
    renderAllCharts();

    // Debounced Resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            renderAllCharts();
        }, 250);
    });
}

function renderAllCharts() {
    const container = document.getElementById('chart-container');
    if (container) {
        // Clear Intervals if they exist
        if (window.mapInterval) clearInterval(window.mapInterval);

        // Clear Containers
        document.getElementById('chart-container').innerHTML = '';
        document.getElementById('comparison-container').innerHTML = '';
        document.getElementById('map-container').innerHTML = '';
        document.getElementById('revenue-container').innerHTML = '';

        // Re-Init
        initMainChart();
        window.comparisonChart = initComparisonChart();
        window.mapViz = initMap();
        window.revenueChart = initRevenueChart();

        // Retrigger animations if needed based on scroll position? 
        // For simplicity, just letting them exist in their initial state is fine, 
        // or ScrollTrigger will handle re-entering if we refresh it. 
        if (window.ScrollTrigger) ScrollTrigger.refresh();
    }
}

function initMainChart() {
    const container = document.getElementById('chart-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Margins
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select('#chart-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Generate Dummy Data (50 data points)
    const data = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        category: Math.floor(Math.random() * 5), // 5 categories
        value: Math.random() * 1000 + 100
    }));

    // Scales
    const xScale = d3.scaleLinear().range([0, innerWidth]);
    const yScale = d3.scaleLinear().range([innerHeight, 0]);
    const colorScale = d3.scaleOrdinal()
        .range(['#24889E', '#4facfe', '#ff0080', '#00f260', '#f7b733']);

    // Scale domains
    xScale.domain([0, 100]);
    yScale.domain([0, 120]); // slightly higher for padding

    // Axes
    const xAxis = svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).ticks(10));

    const yAxis = svg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(yScale));

    // Axis styling
    svg.selectAll('.domain, .tick line').attr('stroke', 'rgba(0,0,0,0.2)');
    svg.selectAll('.tick text').attr('fill', 'rgba(0,0,0,0.6)');

    // Tooltip
    const tooltip = d3.select('.viz-tooltip');

    // Initial Render (Scatter)
    updateChart('scatter');

    // Controls
    const buttons = document.querySelectorAll('.viz-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // UI Toggle
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update Visualization
            const view = btn.dataset.view;
            updateChart(view);
        });
    });

    function updateChart(viewType) {
        if (viewType === 'scatter') {
            renderScatter();
        } else {
            renderBar();
        }
    }

    function renderScatter() {
        // Reset X Scale Linear
        xScale.domain([0, 100]);
        xAxis.transition().duration(1000).call(d3.axisBottom(xScale));

        const circles = svg.selectAll('circle')
            .data(data, d => d.id);

        // Enter
        const enter = circles.enter()
            .append('circle')
            .attr('r', 0)
            .attr('fill', d => colorScale(d.category));

        // Update + Enter
        circles.merge(enter)
            .transition().duration(1000).ease(d3.easeCubicOut)
            .attr('cx', d => xScale(d.x))
            .attr('cy', d => yScale(d.y))
            .attr('r', 8)
            .attr('fill', d => colorScale(d.category));

        // Interactions
        svg.selectAll('circle')
            .on('mouseenter', function (event, d) {
                d3.select(this)
                    .transition().duration(200)
                    .attr('r', 12)
                    .attr('stroke', '#1a1a1a')
                    .attr('stroke-width', 2);

                tooltip.classed('hidden', false)
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY - 28}px`)
                    .html(`<strong>Category ${d.category}</strong><br>Value: ${Math.round(d.value)}`);
            })
            .on('mouseleave', function () {
                d3.select(this)
                    .transition().duration(200)
                    .attr('r', 8)
                    .attr('stroke', 'none');
                tooltip.classed('hidden', true);
            });

        // Exit
        circles.exit().remove();

        // Remove Bars if any
        svg.selectAll('rect')
            .transition().duration(500)
            .attr('height', 0)
            .attr('y', innerHeight)
            .remove();
    }

    function renderBar() {
        // Prepare Data for Bar Chart (Aggregate by Category)
        const aggregated = d3.rollups(data, v => d3.sum(v, d => d.value), d => d.category)
            .map(([key, value]) => ({ category: key, value: value }))
            .sort((a, b) => a.category - b.category);

        // X Scale Band
        const xBand = d3.scaleBand()
            .range([0, innerWidth])
            .domain(aggregated.map(d => d.category))
            .padding(0.2);

        // Y Scale for aggregated values
        const maxVal = d3.max(aggregated, d => d.value);
        yScale.domain([0, maxVal * 1.1]);

        // Transition Axes
        xAxis.transition().duration(1000).call(d3.axisBottom(xBand));
        yAxis.transition().duration(1000).call(d3.axisLeft(yScale));

        // Bars
        const bars = svg.selectAll('rect')
            .data(aggregated, d => d.category);

        // Fade out circles
        svg.selectAll('circle')
            .transition().duration(500)
            .attr('r', 0)
            .remove();

        bars.enter()
            .append('rect')
            .attr('x', d => xBand(d.category))
            .attr('y', innerHeight)
            .attr('width', xBand.bandwidth())
            .attr('height', 0)
            .attr('fill', d => colorScale(d.category))
            .attr('opacity', 0.8)
            .merge(bars)
            .transition().duration(1000).delay((d, i) => i * 100)
            .attr('x', d => xBand(d.category))
            .attr('y', d => yScale(d.value))
            .attr('width', xBand.bandwidth())
            .attr('height', d => innerHeight - yScale(d.value));

        // Interactions for Bars
        svg.selectAll('rect')
            .on('mouseenter', function (event, d) {
                d3.select(this)
                    .transition().duration(200)
                    .attr('opacity', 1)
                    .attr('fill', d3.color(colorScale(d.category)).brighter(0.5));

                tooltip.classed('hidden', false)
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY - 28}px`)
                    .html(`<strong>Category ${d.category}</strong><br>Total: ${Math.round(d.value)}`);
            })
            .on('mouseleave', function (event, d) {
                d3.select(this)
                    .transition().duration(200)
                    .attr('opacity', 0.8)
                    .attr('fill', colorScale(d.category));
                tooltip.classed('hidden', true);
            });

        bars.exit().remove();
    }
}

export function initComparisonChart() {
    const container = document.getElementById('comparison-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Margins - Responsive
    const isMobile = width < 600;
    const margin = {
        top: 40,
        right: isMobile ? 40 : 60,
        bottom: 60,
        left: isMobile ? 40 : 60
    };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select('#comparison-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Data (Approximated based on reliable trends 2015-2024)
    // Metric: Prevalence (% of Adults)
    const data = [
        { year: 2015, alcohol: 65, cannabis: 11 },
        { year: 2016, alcohol: 64, cannabis: 12 },
        { year: 2017, alcohol: 63, cannabis: 14 },
        { year: 2018, alcohol: 62, cannabis: 16 },
        { year: 2019, alcohol: 61, cannabis: 17 },
        { year: 2020, alcohol: 60, cannabis: 18 }, // Dip/Flat
        { year: 2021, alcohol: 59, cannabis: 20 },
        { year: 2022, alcohol: 57, cannabis: 21 },
        { year: 2023, alcohol: 55, cannabis: 23 },
        { year: 2024, alcohol: 54, cannabis: 25 }
    ];

    // Scales
    const xScale = d3.scaleLinear()
        .domain([2015, 2024])
        .range([0, innerWidth]);

    const yScaleAlcohol = d3.scaleLinear()
        .domain([50, 70])
        .range([innerHeight, 0]);

    const yScaleCannabis = d3.scaleLinear()
        .domain([10, 30])
        .range([innerHeight, 0]);

    // Axes
    const xAxis = svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format('d')));

    // Left Axis (Alcohol)
    const yAxisLeft = svg.append('g')
        .attr('class', 'y-axis-left')
        .call(d3.axisLeft(yScaleAlcohol).tickFormat(d => d + '%'));

    // Right Axis (Cannabis)
    const yAxisRight = svg.append('g')
        .attr('class', 'y-axis-right')
        .attr('transform', `translate(${innerWidth}, 0)`)
        .call(d3.axisRight(yScaleCannabis).tickFormat(d => d + '%'));

    // Styling
    svg.selectAll('.domain, .tick line').attr('stroke', 'rgba(0,0,0,0.2)');
    svg.selectAll('.tick text').attr('fill', 'rgba(0,0,0,0.6)');

    // Colorize Axes for clarity
    svg.selectAll('.y-axis-left .tick text').attr('fill', '#e63946'); // Red for Alcohol
    svg.selectAll('.y-axis-right .tick text').attr('fill', '#2a9d8f'); // Teal for Cannabis

    // Line Generators
    const lineAlcohol = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScaleAlcohol(d.alcohol))
        .curve(d3.curveMonotoneX);

    const lineCannabis = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScaleCannabis(d.cannabis))
        .curve(d3.curveMonotoneX);

    // Gridlines (Use Alcohol scale for grid, or remove to avoid clutter)
    svg.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .call(d3.axisLeft(yScaleAlcohol)
            .tickSize(-innerWidth)
            .tickFormat('')
        );

    // Draw Paths (Initially hidden/length 0 for animation)
    const pathAlcohol = svg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#e63946') // Accent Red
        .attr('stroke-width', 4)
        .attr('d', lineAlcohol);

    const pathCannabis = svg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#2a9d8f') // Green
        .attr('stroke-width', 4)
        .attr('d', lineCannabis);

    // Total lengths for animation
    const lengthAlcohol = pathAlcohol.node().getTotalLength() || 2000;
    const lengthCannabis = pathCannabis.node().getTotalLength() || 2000;

    // Set initial dasharray to hide (length, length) and offset to length
    pathAlcohol.attr('stroke-dasharray', `${lengthAlcohol} ${lengthAlcohol}`)
        .attr('stroke-dashoffset', lengthAlcohol);

    pathCannabis.attr('stroke-dasharray', `${lengthCannabis} ${lengthCannabis}`)
        .attr('stroke-dashoffset', lengthCannabis);

    // Labels (End of line) - initially hidden
    svg.append('text')
        .attr('class', 'chart-label')
        .attr('x', xScale(2015))
        .attr('y', yScaleAlcohol(65) - 15) // Use correct scale
        .attr('fill', '#e63946')
        .attr('font-weight', 'bold')
        .attr('display', 'none') // Hide redundant text if we have a legend, or keep it. Let's keep it but formatted better.
        .text('Alcohol');

    svg.append('text')
        .attr('class', 'chart-label')
        .attr('x', xScale(2015))
        .attr('y', yScaleCannabis(11) - 15) // Use correct scale
        .attr('fill', '#2a9d8f')
        .attr('font-weight', 'bold')
        .attr('display', 'none')
        .text('Cannabis');

    // Add Legend
    // Mobile: Center at bottom or top? Let's keep top right but adjust
    const legendX = isMobile ? innerWidth / 2 - 50 : innerWidth - 200;
    const legendY = isMobile ? -30 : -20;

    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${legendX}, ${legendY})`);

    // Legend: Alcohol
    legend.append('rect').attr('x', 0).attr('y', 0).attr('width', 12).attr('height', 12).attr('fill', '#e63946');
    legend.append('text').attr('id', 'legend-alcohol-text').attr('x', 20).attr('y', 10).text('Alcohol (Dropping)').attr('font-size', '14px').attr('fill', '#000').style('font-weight', 'bold');

    // Legend: Cannabis
    legend.append('rect').attr('x', 0).attr('y', 25).attr('width', 12).attr('height', 12).attr('fill', '#2a9d8f');
    legend.append('text').attr('id', 'legend-cannabis-text').attr('x', 20).attr('y', 35).text('Cannabis (Rising)').attr('font-size', '14px').attr('fill', '#000').style('font-weight', 'bold');

    // Y Axis Label (Left)
    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .attr('y', -45)
        .attr('x', -innerHeight / 2)
        .attr('fill', '#e63946')
        .style('font-size', '12px')
        .text('Alcohol Prevalence (%)');

    // Y Axis Label (Right)
    // Y Axis Label (Right)
    if (!isMobile) {
        svg.append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(90)')
            .attr('y', -innerWidth - 45)
            .attr('x', innerHeight / 2)
            .attr('fill', '#2a9d8f')
            .style('font-size', '12px')
            .text('Cannabis Prevalence (%)');
    }

    // Source Citation
    svg.append('text')
        .attr('text-anchor', 'end')
        .attr('x', innerWidth)
        .attr('y', innerHeight + 40)
        .attr('fill', '#888')
        .style('font-size', '10px')
        .style('font-style', 'italic')
        .text('Source: Gallup, SAMHSA');

    // Overlay for hover
    const mouseG = svg.append('g').attr('class', 'mouse-over-effects').style('display', 'none');

    // Vertical Line
    mouseG.append('line')
        .attr('class', 'mouse-line')
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .style('stroke', '#666')
        .style('stroke-width', '1px')
        .style('stroke-dasharray', '3 3')
        .style('opacity', '0.7');

    // Data Circles
    const mouseCircleAlcohol = mouseG.append('circle')
        .attr('r', 6)
        .attr('fill', '#e63946')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

    const mouseCircleCannabis = mouseG.append('circle')
        .attr('r', 6)
        .attr('fill', '#2a9d8f')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

    // Setup interactive area
    svg.append('rect')
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .attr('fill', 'transparent')
        .on('mouseenter', () => mouseG.style('display', null))
        .on('mouseleave', () => {
            mouseG.style('display', 'none');
            // Reset Legend text if needed, or leave last value?
            // Let's reset to titles
            d3.select('#legend-alcohol-text').text('Alcohol (Dropping)');
            d3.select('#legend-cannabis-text').text('Cannabis (Rising)');
        })
        .on('mousemove', function (event) {
            const [x] = d3.pointer(event);
            const year = Math.round(xScale.invert(x));

            // Allow clamping to data range
            const bisect = d3.bisector(d => d.year).left;
            const index = bisect(data, year);
            const d = data[Math.min(data.length - 1, Math.max(0, index))]; // Approximate closest

            // Snap line to year
            const xPos = xScale(d.year);
            mouseG.select('.mouse-line').attr('transform', `translate(${xPos},0)`);

            // Move circles
            mouseCircleAlcohol.attr('cx', xPos).attr('cy', yScaleAlcohol(d.alcohol));
            mouseCircleCannabis.attr('cx', xPos).attr('cy', yScaleCannabis(d.cannabis));

            // Update Legend with values
            d3.select('#legend-alcohol-text').text(`Alcohol: ${d.alcohol}%`);
            d3.select('#legend-cannabis-text').text(`Cannabis: ${d.cannabis}%`);
        });

    // Expose Animation Function
    return {
        animate: () => {
            // Animate paths
            pathAlcohol.transition().duration(2000).ease(d3.easeCubicOut)
                .attr('stroke-dashoffset', 0);
            pathCannabis.transition().duration(2000).ease(d3.easeCubicOut)
                .attr('stroke-dashoffset', 0);

            // Fade in labels
            svg.selectAll('.chart-label')
                .transition().duration(1000).delay(1000)
                .attr('opacity', 1);
        }
    };
}

export function initMap() {
    const container = document.getElementById('map-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear previous Svg if any
    d3.select('#map-container').selectAll('*').remove();

    const svg = d3.select('#map-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Map Group (Centered & Moved Up)
    const mapGroup = svg.append('g');

    const projection = d3.geoAlbersUsa()
        .translate([width / 2, (height - 100) / 2]) // Lift map to make room for timeline
        .scale(width * 0.9);

    const path = d3.geoPath().projection(projection);

    const colorDefault = '#eee820'; // Yellow
    const colorHighlight = '#ee2e53'; // Red

    // Timeline Logic
    const timeline = {
        2022: 0,
        2023: 6,
        2024: 14,
        2025: 24,
        2026: 35,
        2027: 40,
        2028: 49 // All 50 states - 1 (California) = 49 target
    };

    let statePaths;
    let usData;
    let sortedStates = []; // Will hold states sorted safely

    // Load Data
    d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json').then(us => {
        usData = us;
        const states = topojson.feature(us, us.objects.states).features;

        // Sort states randomly ONCE to determine "order of turning red"
        // But ensure California (id: "06") is LAST.
        const ca = states.find(s => s.id === "06");
        const others = states.filter(s => s.id !== "06");

        // Shuffle others
        others.sort(() => Math.random() - 0.5);

        sortedStates = [...others, ca]; // CA is last

        statePaths = mapGroup.append('g')
            .selectAll('path')
            .data(states)
            .enter().append('path')
            .attr('d', path)
            .attr('fill', colorDefault)
            .attr('stroke', 'rgba(0,0,0,0.1)')
            .attr('stroke-width', 0.5)
            .attr('id', d => `state-${d.id}`);

        // Tooltips (Optional)
        statePaths.on('mouseenter', function (event, d) {
            d3.select(this).attr('stroke', '#000').attr('stroke-width', 1);
        }).on('mouseleave', function () {
            d3.select(this).attr('stroke', 'rgba(0,0,0,0.1)').attr('stroke-width', 0.5);
        });
    });

    // --- Interaction Timeline ---
    const timelineData = [2023, 2024, 2025, 2026, 2027, 2028];
    const timelineScale = d3.scalePoint()
        .domain(timelineData)
        .range([50, width - 50])
        .padding(0.5);

    const timelineGroup = svg.append('g')
        .attr('transform', `translate(0, ${height - 60})`);

    // Axis Line
    timelineGroup.append('line')
        .attr('x1', 50)
        .attr('x2', width - 50)
        .attr('stroke', '#ccc')
        .attr('stroke-width', 2);

    // Ticks & Labels
    const ticks = timelineGroup.selectAll('.timeline-tick')
        .data(timelineData)
        .enter().append('g')
        .attr('class', 'timeline-tick')
        .attr('cursor', 'pointer')
        .attr('transform', d => `translate(${timelineScale(d)}, 0)`);

    // Tick Dots
    ticks.append('circle')
        .attr('r', 6)
        .attr('fill', '#fff')
        .attr('stroke', '#24889E')
        .attr('stroke-width', 2);

    // Tick Labels
    ticks.append('text')
        .attr('y', 25)
        .attr('text-anchor', 'middle')
        .attr('fill', '#666')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text(d => {
            if (width < 500) {
                // Abbreviated for mobile
                if (d >= 2026) return `${d}'`; // just 2026'
                return `${d}`;
            }
            if (d >= 2026) return `${d} (Proj)`;
            return `${d}`;
        });

    // Invisible Hit Area for Hover
    ticks.append('rect')
        .attr('x', -30)
        .attr('y', -20)
        .attr('width', 60)
        .attr('height', 60)
        .attr('fill', 'transparent')
        .on('mouseenter', (event, d) => {
            // Stop auto-play if interactive
            if (window.mapInterval) clearInterval(window.mapInterval);

            // Update Map
            instance.update(d);
        });

    const instance = {
        update: (year) => {
            if (!statePaths || !sortedStates.length) return;

            const targetCount = timeline[year] || 0;
            const isProjected = year >= 2026;

            // Update Year Display
            const yearText = isProjected ? `${year} (Projected)` : `${year}`;
            d3.select('#year-display').text(yearText);

            // Update Tick Styles (highlight active year)
            ticks.selectAll('circle')
                .transition().duration(200)
                .attr('fill', d => d === year ? '#24889E' : '#fff');

            // Determine which states should be red
            const redStateIds = new Set(
                sortedStates.slice(0, targetCount).map(s => s.id)
            );

            statePaths.transition().duration(500)
                .attr('fill', d => {
                    if (redStateIds.has(d.id)) return colorHighlight;
                    return colorDefault;
                });
        }
    };
    return instance;
}

export function initRevenueChart() {
    const container = document.getElementById('revenue-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear previous
    d3.select('#revenue-container').selectAll('*').remove();
    d3.selectAll('.revenue-tooltip').remove(); // Cleanup body tooltips

    const svg = d3.select('#revenue-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Gradients
    const defs = svg.append('defs');

    // Bar Gradient (Red)
    const gradientBar = defs.append('linearGradient')
        .attr('id', 'revenue-gradient')
        .attr('x1', '0%')
        .attr('y1', '100%') // Bottom
        .attr('x2', '0%')
        .attr('y2', '0%');  // Top

    gradientBar.append('stop').attr('offset', '0%').attr('stop-color', '#c62828'); // Darker Red
    gradientBar.append('stop').attr('offset', '100%').attr('stop-color', '#ff5252'); // Lighter Red

    // Responsive margins
    const isMobile = width < 600;
    const margin = {
        top: 60,
        right: isMobile ? 20 : 40,
        bottom: 60,
        left: isMobile ? 40 : 60
    };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const data = [
        { year: '2020', value: 13, d2c: 30, licensing: 2, growth: 0 },
        { year: '2021', value: 21, d2c: 35, licensing: 4, growth: 61 },
        { year: '2022', value: 25, d2c: 40, licensing: 5, growth: 19 },
        { year: '2023', value: 32, d2c: 45, licensing: 7, growth: 28 },
        { year: '2024', value: 38, d2c: 50, licensing: 9, growth: 18 },
        { year: '2025', value: 48, d2c: 55, licensing: 12, growth: 26 },
        { year: '2026', value: 65, projected: true, d2c: 60, licensing: 18, growth: 35 }
    ];

    const xScale = d3.scaleBand()
        .domain(data.map(d => d.year))
        .range([0, innerWidth])
        .padding(0.3);

    const yScale = d3.scaleLinear()
        .domain([0, 70])
        .range([innerHeight, 0]);

    // Axes
    const xAxis = g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale))
        .attr('font-size', isMobile ? '10px' : '14px')
        .attr('font-weight', 'bold');

    // Style X Axis Labels
    xAxis.selectAll('text')
        .attr('fill', d => d === '2026' ? '#e53935' : '#1a1a1a') // Red for projected
        .text(d => {
            if (isMobile && d === '2026') return '2026\'';
            return d === '2026' ? '2026 (Proj)' : d;
        });

    // Y Axis (Grid only)
    g.append('g')
        .call(d3.axisLeft(yScale)
            .tickSize(-innerWidth)
            .tickFormat('')
        )
        .attr('stroke-dasharray', '3 3')
        .attr('opacity', 0.1);

    // Bars
    const bars = g.selectAll('.bar')
        .data(data)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.year))
        .attr('y', innerHeight) // Start at bottom
        .attr('width', xScale.bandwidth())
        .attr('height', 0) // Start height 0
        .attr('fill', 'url(#revenue-gradient)')
        .attr('rx', 6);

    // Tooltip logic
    // Append to body to avoid overflow:hidden clipping from the card
    const tooltip = d3.select('body').append('div')
        .attr('class', 'viz-tooltip revenue-tooltip hidden')
        .style('z-index', '9999')
        .style('position', 'absolute') // Ensure absolute positioning
        .style('pointer-events', 'none') // Prevent interference with mouse events
        .style('background', 'rgba(20, 20, 20, 0.95)') // Darker, cleaner bg
        .style('border', '1px solid rgba(255, 255, 255, 0.2)') // Subtle border
        .style('border-radius', '8px')
        .style('padding', '12px')
        .style('box-shadow', '0 8px 32px rgba(0, 0, 0, 0.4)')
        .style('backdrop-filter', 'blur(4px)');

    bars.on('mouseenter', function (event, d) {
        d3.select(this)
            .attr('fill', '#ff1744') // Brighter solid red hover
            .attr('filter', 'drop-shadow(0 0 5px rgba(255, 23, 68, 0.5))');

        tooltip.classed('hidden', false)
            .style('opacity', 1)
            .style('visibility', 'visible')
            .html(`
                <div style="text-align: left; min-width: 160px; font-family: 'Inter', sans-serif;">
                    <div style="font-weight: 700; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 4px; font-size: 1.1em; color: #fff;">${d.year} Overview</div>
                    <div style="margin-bottom: 4px; color: #ccc; font-size: 0.9em;">Primary: <span style="color: #ffd700; font-weight: 600;">Gummies</span></div>
                    <div style="margin-bottom: 4px; color: #ccc; font-size: 0.9em;">% Rev D2C: <strong style="color: #fff;">${d.d2c}%</strong></div>
                    <div style="margin-bottom: 4px; color: #ccc; font-size: 0.9em;">Licensing: <strong style="color: #fff;">$${d.licensing}M</strong></div>
                    <div style="font-size: 0.9em; margin-top: 6px;">Growth: <span style="color: #4caf50; font-weight: 700; background: rgba(76, 175, 80, 0.1); padding: 2px 6px; border-radius: 4px;">+${d.growth}%</span></div>
                </div>
            `);
    })
        .on('mousemove', function (event) {
            // Dynamic positioning attached to cursor
            const tooltipWidth = 180; // approximate
            const xOffset = 15;
            const yOffset = 15;

            // Smart checking for right edge
            let left = event.pageX + xOffset;
            if (left + tooltipWidth > window.innerWidth) {
                left = event.pageX - tooltipWidth - xOffset;
            }

            tooltip
                .style('left', `${left}px`)
                .style('top', `${event.pageY + yOffset}px`);
        })
        .on('mouseleave', function () {
            d3.select(this)
                .transition().duration(200)
                .attr('fill', 'url(#revenue-gradient)')
                .attr('filter', 'none');

            // Hide tooltip
            tooltip
                .style('opacity', 0)
                .style('visibility', 'hidden');
        });

    // Line Generator for Accent
    const line = d3.line()
        .x(d => xScale(d.year) + xScale.bandwidth() / 2)
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX);

    const path = g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#fdd835') // Bright Yellow accent
        .attr('stroke-width', 4)
        .attr('d', line)
        .attr('stroke-linecap', 'round')
        .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))');

    const pathLength = path.node().getTotalLength();
    path.attr('stroke-dasharray', pathLength)
        .attr('stroke-dashoffset', pathLength);

    // Labels on top of bars
    const labels = g.selectAll('.label')
        .data(data)
        .enter().append('text')
        .attr('x', d => xScale(d.year) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.value) - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#1a1a1a')
        .attr('font-weight', 'bold')
        .attr('font-size', isMobile ? '10px' : '14px')
        .attr('opacity', 0)
        .text(d => `$${d.value}M`);

    return {
        animate: () => {
            // Animate Bars
            bars.transition().duration(1000).delay((d, i) => i * 100)
                .ease(d3.easeBackOut.overshoot(0.5))
                .attr('y', d => yScale(d.value))
                .attr('height', d => innerHeight - yScale(d.value));

            // Animate Line
            path.transition().duration(1500).delay(500)
                .ease(d3.easeCubicOut)
                .attr('stroke-dashoffset', 0);

            // Animate Labels
            labels.transition().duration(500).delay((d, i) => 1000 + i * 100)
                .attr('opacity', 1);
        }
    };
}
