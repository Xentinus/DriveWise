// Initialize map when DOM is ready to ensure container size is correct
document.addEventListener('DOMContentLoaded', function () {
    // Default to a Europe-wide view (no specific city) so users see the continent on load
    var map = L.map('map').setView([52.0, 10.0], 5); // Europe center, slightly closer (zoom +1)

    // OpenStreetMap tiles (Lightweight, no API key)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // No example marker by default (user requested no pin)

    // If map is in a container with dynamic size, call invalidateSize after a short delay
    setTimeout(function () { map.invalidateSize(); }, 200);

    // Recalculate size on window resize / orientation change (mobile)
    function safeInvalidate() {
        try { map.invalidateSize(); } catch (e) { /* ignore */ }
    }
    window.addEventListener('resize', function () { setTimeout(safeInvalidate, 150); });
    window.addEventListener('orientationchange', function () { setTimeout(safeInvalidate, 300); });

    // Simple button wiring (placeholders) — user can replace with real actions
    var vehiclesBtn = document.getElementById('vehiclesBtn');
    var planBtn = document.getElementById('planBtn');
    var settingsBtn = document.getElementById('settingsBtn');

    // Dock button handlers
    [vehiclesBtn, planBtn, settingsBtn].forEach(function (btn) {
        if (!btn) return;
        btn.addEventListener('click', function (ev) {
            if (!this.classList.contains('nav-btn')) uiRipple(this, ev);
            setActive(this);
            // Placeholder actions removed - ModalManager handles showing panels/cards.
        });
    });
    
    // Ripple helper
    function uiRipple(el, ev) {
        var rect = el.getBoundingClientRect();
        var clientX = (ev && ev.clientX) || (ev.touches && ev.touches[0] && ev.touches[0].clientX) || (rect.left + rect.width / 2);
        var clientY = (ev && ev.clientY) || (ev.touches && ev.touches[0] && ev.touches[0].clientY) || (rect.top + rect.height / 2);
        var ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.left = (clientX - rect.left - Math.max(rect.width, rect.height)/2) + 'px';
        ripple.style.top = (clientY - rect.top - Math.max(rect.width, rect.height)/2) + 'px';
        ripple.style.width = ripple.style.height = Math.max(rect.width, rect.height) + 'px';
        el.style.position = el.style.position || 'relative';
        el.appendChild(ripple);
        setTimeout(function () { if (ripple.parentNode) ripple.parentNode.removeChild(ripple); }, 700);
    }

    function setActive(el) {
        document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
        el.classList.add('active');
    }
});