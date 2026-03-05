export function initAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    initHeroAnimations();
    initBackgroundElements();
    initScrollAnimations();
}

function initHeroAnimations() {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to('.hero-title', {
        y: 0,
        opacity: 1,
        duration: 1.2,
        delay: 0.2
    })
        .to('.hero-subtitle', {
            y: 0,
            opacity: 1,
            duration: 1
        }, '-=0.8')
        .to('.cta-button', {
            y: 0,
            opacity: 1,
            duration: 0.8
        }, '-=0.6')
        .to('.scroll-indicator', {
            opacity: 1,
            duration: 1
        }, '-=0.4');
}

function initBackgroundElements() {
    const container = document.querySelector('.bg-elements');
    const colors = ['#24889E', '#4facfe', '#ff0080'];

    // Create random floating circles
    for (let i = 0; i < 15; i++) {
        const circle = document.createElement('div');
        const size = Math.random() * 300 + 50;

        circle.style.width = `${size}px`;
        circle.style.height = `${size}px`;
        circle.style.borderRadius = '50%';
        circle.style.position = 'absolute';
        circle.style.background = colors[Math.floor(Math.random() * colors.length)];
        circle.style.opacity = Math.random() * 0.15 + 0.05;
        circle.style.filter = 'blur(40px)';
        circle.style.top = `${Math.random() * 100}%`;
        circle.style.left = `${Math.random() * 100}%`;
        circle.style.zIndex = '-1';

        container.appendChild(circle);

        // Animate them
        gsap.to(circle, {
            x: 'random(-100, 100)',
            y: 'random(-100, 100)',
            duration: 'random(10, 20)',
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });
    }
}

function initScrollAnimations() {
    // Parallax for hero bg
    gsap.to('.bg-elements', {
        scrollTrigger: {
            trigger: 'body',
            start: 'top top',
            end: 'bottom top',
            scrub: 1
        },
        y: 200
    });

    // Reveal viz section
    gsap.from('.viz-card', {
        scrollTrigger: {
            trigger: '.viz-section',
            start: 'top 80%',
        },
        y: 100,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.2
    });

    // Animate Comparison Chart Lines
    ScrollTrigger.create({
        trigger: '#comparison-container',
        start: 'top 70%',
        onEnter: () => {
            if (window.comparisonChart) {
                window.comparisonChart.animate();
            }
        }
    });

    // Animate Map Timeline
    ScrollTrigger.create({
        trigger: '#map-container',
        start: 'top 60%',
        onEnter: () => {
            if (window.mapViz) {
                const years = [2022, 2023, 2024, 2025, 2026, 2027, 2028];
                let i = 0;

                // Initial state
                window.mapViz.update(years[0]);

                window.mapInterval = setInterval(() => {
                    i++;
                    if (i < years.length) {
                        window.mapViz.update(years[i]);
                    } else {
                        clearInterval(window.mapInterval);
                    }
                }, 1000); // Update every 1 second
            }
        }
    });

    // Animate Revenue Chart
    ScrollTrigger.create({
        trigger: '#revenue-container',
        start: 'top 70%',
        onEnter: () => {
            if (window.revenueChart) {
                window.revenueChart.animate();
            }
        }
    });
}
