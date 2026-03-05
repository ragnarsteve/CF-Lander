import { initAnimations } from './animations.js';
import { initVisualizations } from './visualizations.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('App initialized');
    
    // Initialize modules
    initAnimations();
    initVisualizations();
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
