/**
 * Transfer Chair - AA Alive Sdn. Bhd.
 * Premium interactions with enhanced animations
 * Purple-Emerald theme with warm neutrals
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Elements
    const header = document.getElementById('header');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    // =============================================
    // Create Scroll Progress Bar
    // =============================================
    const createScrollProgress = () => {
        if (prefersReducedMotion) return;

        const progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        document.body.prepend(progressBar);

        const updateProgress = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollTop / docHeight) * 100;
            progressBar.style.width = `${progress}%`;
        };

        window.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();
    };

    createScrollProgress();

    // =============================================
    // Create Parallax Orbs
    // =============================================
    const createParallaxOrbs = () => {
        if (prefersReducedMotion || window.innerWidth < 768) return;

        const orbsContainer = document.createElement('div');
        orbsContainer.className = 'parallax-orbs-container';
        orbsContainer.innerHTML = `
            <div class="parallax-orb orb-1"></div>
            <div class="parallax-orb orb-2"></div>
            <div class="parallax-orb orb-3"></div>
        `;
        document.body.prepend(orbsContainer);

        const orbs = document.querySelectorAll('.parallax-orb');
        let mouseX = 0, mouseY = 0;
        let currentX = 0, currentY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        });

        const animateOrbs = () => {
            currentX += (mouseX - currentX) * 0.05;
            currentY += (mouseY - currentY) * 0.05;

            orbs.forEach((orb, index) => {
                const speed = (index + 1) * 15;
                const x = currentX * speed;
                const y = currentY * speed;
                orb.style.transform = `translate(${x}px, ${y}px)`;
            });

            requestAnimationFrame(animateOrbs);
        };

        animateOrbs();
    };

    createParallaxOrbs();

    // =============================================
    // Header Scroll Effect - Glass Morphism
    // =============================================
    const handleHeaderScroll = () => {
        if (window.scrollY > 20) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleHeaderScroll, { passive: true });
    handleHeaderScroll();

    // =============================================
    // Smooth Scroll with Offset
    // =============================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();

                // Close mobile menu if open
                if (navMenu) {
                    navMenu.classList.remove('open');
                    navToggle?.classList.remove('active');
                }

                const headerHeight = header.offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: prefersReducedMotion ? 'auto' : 'smooth'
                });
            }
        });
    });

    // =============================================
    // Mobile Navigation - Enhanced
    // =============================================
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('open');
            navToggle.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('open');
                navToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('open')) {
                navMenu.classList.remove('open');
                navToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // =============================================
    // FAQ Accordion (Single Open)
    // =============================================
    document.querySelectorAll('.faq-item').forEach(item => {
        item.addEventListener('toggle', () => {
            if (item.open) {
                document.querySelectorAll('.faq-item').forEach(other => {
                    if (other !== item) other.removeAttribute('open');
                });
            }
        });
    });

    // =============================================
    // Card Tilt Effect
    // =============================================
    const initCardTilt = () => {
        if (prefersReducedMotion || window.innerWidth < 1024) return;

        const cards = document.querySelectorAll('.benefit-card, .why-card, .comparison-card');

        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const tiltX = (y - centerY) / 20;
                const tiltY = (centerX - x) / 20;

                card.style.setProperty('--tilt-x', `${tiltX}deg`);
                card.style.setProperty('--tilt-y', `${tiltY}deg`);
            });

            card.addEventListener('mouseleave', () => {
                card.style.setProperty('--tilt-x', '0deg');
                card.style.setProperty('--tilt-y', '0deg');
            });
        });
    };

    initCardTilt();

    // =============================================
    // Staggered Reveal Animations (Safe - content always visible as fallback)
    // =============================================
    const initRevealAnimations = () => {
        const revealElements = document.querySelectorAll(
            '.benefit-card, .comparison-card, .step-card, .why-card, .coverage-item, .faq-item, .section-header'
        );

        // Skip animations if reduced motion or no IntersectionObserver
        if (!('IntersectionObserver' in window) || prefersReducedMotion) {
            return; // Content already visible by default
        }

        // Group elements by parent section for staggered animation
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Find siblings for stagger effect
                    const parent = entry.target.parentElement;
                    const siblings = Array.from(parent.children).filter(
                        child => child.matches('.benefit-card, .comparison-card, .step-card, .why-card, .coverage-item, .faq-item')
                    );
                    const index = siblings.indexOf(entry.target);
                    const delay = index >= 0 ? index * 80 : 0;

                    setTimeout(() => {
                        entry.target.classList.add('revealed');
                    }, delay);

                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -30px 0px'
        });

        // Add classes and observe - use will-animate so content is visible if JS fails
        revealElements.forEach(el => {
            el.classList.add('reveal', 'will-animate');
            observer.observe(el);
        });

        // Fallback: Show all content after 3 seconds if observer didn't trigger
        setTimeout(() => {
            revealElements.forEach(el => {
                if (!el.classList.contains('revealed')) {
                    el.classList.add('revealed');
                }
            });
        }, 3000);
    };

    initRevealAnimations();

    // =============================================
    // Number Counter Animation
    // =============================================
    const initNumberCounters = () => {
        if (prefersReducedMotion) return;

        const counters = document.querySelectorAll('.coverage-stat strong');

        const animateCounter = (element, target, suffix = '') => {
            const duration = 2000;
            const steps = 60;
            const stepDuration = duration / steps;
            let current = 0;
            const increment = target / steps;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                element.textContent = Math.floor(current) + suffix;
            }, stepDuration);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const text = entry.target.textContent;
                    // Parse numbers like "4-24", "100%", "24/7"
                    if (text.includes('%')) {
                        animateCounter(entry.target, 100, '%');
                    } else if (text.includes('/')) {
                        // Keep as is for 24/7
                        entry.target.textContent = '24/7';
                    } else if (text.includes('-')) {
                        // Keep as is for ranges like 4-24
                    }
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => observer.observe(counter));
    };

    initNumberCounters();

    // =============================================
    // Track WhatsApp Clicks (for analytics)
    // =============================================
    document.querySelectorAll('a[href^="https://wa.me"]').forEach(link => {
        link.addEventListener('click', () => {
            if (typeof gtag === 'function') {
                gtag('event', 'whatsapp_click', {
                    event_category: 'engagement',
                    event_label: 'WhatsApp Contact'
                });
            }
        });
    });

    // =============================================
    // Track Phone Clicks (for analytics)
    // =============================================
    document.querySelectorAll('a[href^="tel:"]').forEach(link => {
        link.addEventListener('click', () => {
            if (typeof gtag === 'function') {
                gtag('event', 'phone_click', {
                    event_category: 'engagement',
                    event_label: 'Phone Contact'
                });
            }
        });
    });

    // =============================================
    // Button Ripple Effect
    // =============================================
    const initRippleEffect = () => {
        if (prefersReducedMotion) return;

        document.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('click', function(e) {
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const ripple = document.createElement('span');
                ripple.style.cssText = `
                    position: absolute;
                    width: 0;
                    height: 0;
                    background: rgba(255,255,255,0.3);
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                    left: ${x}px;
                    top: ${y}px;
                    animation: ripple 0.6s ease-out forwards;
                `;

                this.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
            });
        });

        // Add ripple animation to document if not exists
        if (!document.querySelector('#ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                @keyframes ripple {
                    to {
                        width: 300px;
                        height: 300px;
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    };

    initRippleEffect();

    // =============================================
    // Smooth hover effects for hero cards
    // =============================================
    const heroCards = document.querySelectorAll('.hero-card');
    heroCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.animationPlayState = 'paused';
        });
        card.addEventListener('mouseleave', function() {
            this.style.animationPlayState = 'running';
        });
    });
});

// =============================================
// Accessibility: Reduced Motion Support
// =============================================
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.setProperty('--transition', '0.01ms');
    document.documentElement.style.setProperty('--transition-slow', '0.01ms');
}

// =============================================
// Performance: Throttle scroll events
// =============================================
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
