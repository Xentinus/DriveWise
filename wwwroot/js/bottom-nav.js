// Simple interactions for the bottom navigation: active state, keyboard focus, and ripple effect
(function () {
    'use strict';

    function makeRipple(el, x, y) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        el.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }

    function attach() {
    const navLinks = document.querySelectorAll('.bottom-nav.v2 .nav-btn, .bottom-nav.v2 .nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Simple active visual toggle
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });

            link.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    link.click();
                }
            });

            link.addEventListener('pointerdown', (ev) => {
                const rect = link.getBoundingClientRect();
                const x = ev.clientX - rect.left;
                const y = ev.clientY - rect.top;
                makeRipple(link, x, y);
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attach);
    } else {
        attach();
    }
})();
