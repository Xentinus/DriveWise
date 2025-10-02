/**
 * Toast Notification System
 * 
 * Modern toast notification system with support for:
 * - Multiple types: success, error, danger, warning, info
 * - Auto-dismiss with progress bar
 * - Stacking (new toasts appear on top and push others down)
 * - Close button
 * - Custom duration
 * - Icons for each type
 */

class ToastManager {
    constructor() {
        this.toasts = [];
        this.container = null;
        this.init();
    }

    init() {
        // Create toast container if it doesn't exist
        if (!document.getElementById('toast-container')) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('toast-container');
        }
    }

    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - Toast type: 'success', 'error', 'danger', 'warning', 'info'
     * @param {number} duration - Duration in milliseconds (default: 5000)
     * @returns {HTMLElement} The toast element
     */
    show(message, type = 'info', duration = 5000) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Get icon based on type
        const icon = this.getIcon(type);
        
        // Build toast HTML
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="bi bi-${icon}"></i>
            </div>
            <div class="toast-content">
                <p class="toast-message">${this.escapeHtml(message)}</p>
            </div>
            <button class="toast-close" type="button" aria-label="Bezárás">
                <i class="bi bi-x"></i>
            </button>
            <div class="toast-progress"></div>
        `;

        // Insert at the beginning (top) of the container
        if (this.container.firstChild) {
            this.container.insertBefore(toast, this.container.firstChild);
            
            // Add stack animation to existing toasts
            Array.from(this.container.children).forEach((child, index) => {
                if (index > 0 && !child.classList.contains('hide')) {
                    child.classList.add('stack-animate');
                    setTimeout(() => child.classList.remove('stack-animate'), 300);
                }
            });
        } else {
            this.container.appendChild(toast);
        }

        // Add to toasts array
        this.toasts.unshift(toast);

        // Show toast with animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Setup close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.dismiss(toast));

        // Setup auto-dismiss
        if (duration > 0) {
            this.setupAutoDismiss(toast, duration);
        }

        return toast;
    }

    /**
     * Get icon name based on toast type
     */
    getIcon(type) {
        const icons = {
            success: 'check-circle-fill',
            error: 'x-circle-fill',
            danger: 'exclamation-triangle-fill',
            warning: 'exclamation-triangle-fill',
            info: 'info-circle-fill'
        };
        return icons[type] || icons.info;
    }

    /**
     * Setup auto-dismiss with progress bar
     */
    setupAutoDismiss(toast, duration) {
        const progressBar = toast.querySelector('.toast-progress');
        
        // Animate progress bar
        if (progressBar) {
            progressBar.style.transition = `width ${duration}ms linear`;
            requestAnimationFrame(() => {
                progressBar.style.width = '0%';
            });
        }

        // Dismiss after duration
        const timeoutId = setTimeout(() => {
            this.dismiss(toast);
        }, duration);

        // Store timeout ID for potential cancellation
        toast.dataset.timeoutId = timeoutId;

        // Pause on hover
        toast.addEventListener('mouseenter', () => {
            clearTimeout(timeoutId);
            if (progressBar) {
                const currentWidth = progressBar.offsetWidth;
                const totalWidth = toast.offsetWidth;
                progressBar.style.transition = 'none';
                progressBar.style.width = `${(currentWidth / totalWidth) * 100}%`;
            }
        });

        // Resume on mouse leave
        toast.addEventListener('mouseleave', () => {
            if (progressBar) {
                const currentWidth = progressBar.offsetWidth;
                const totalWidth = toast.offsetWidth;
                const remainingPercent = (currentWidth / totalWidth) * 100;
                const remainingTime = (remainingPercent / 100) * duration;
                
                progressBar.style.transition = `width ${remainingTime}ms linear`;
                progressBar.style.width = '0%';
                
                const newTimeoutId = setTimeout(() => {
                    this.dismiss(toast);
                }, remainingTime);
                
                toast.dataset.timeoutId = newTimeoutId;
            }
        });
    }

    /**
     * Dismiss a toast
     */
    dismiss(toast) {
        if (!toast || toast.classList.contains('hide')) return;

        // Clear timeout if exists
        if (toast.dataset.timeoutId) {
            clearTimeout(parseInt(toast.dataset.timeoutId));
        }

        // Hide with animation
        toast.classList.remove('show');
        toast.classList.add('hide');

        // Remove from DOM after animation
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            
            // Remove from toasts array
            const index = this.toasts.indexOf(toast);
            if (index > -1) {
                this.toasts.splice(index, 1);
            }
        }, 300);
    }

    /**
     * Dismiss all toasts
     */
    dismissAll() {
        this.toasts.forEach(toast => this.dismiss(toast));
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Convenience methods
    success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    danger(message, duration = 5000) {
        return this.show(message, 'danger', duration);
    }

    warning(message, duration = 5000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }
}

// Create global instance
window.Toast = new ToastManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToastManager;
}
