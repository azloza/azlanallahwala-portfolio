/* ============================================
   MAIN.JS — Cinematic Motion Engine
   ============================================

   RESPONSIBILITIES:
   1. Split-text hero title animation
   2. Scroll-triggered reveals (IntersectionObserver)
   3. Contact bar in-view detection
   4. Scroll-linked parallax (--scroll-y)
   5. Hero content parallax + opacity fade
   6. Nav scroll behavior
   7. Mobile nav toggle
   8. Lightbox
   9. Gallery filter
   10. Contact form

   ============================================ */

(function () {
    'use strict';

    /* --- REDUCED MOTION CHECK --- */
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ============================================
       SPLIT-TEXT: HERO TITLE
       ============================================
       Parses the hero h1 by <br> breaks.
       Wraps each visual line in:
         <span class="line-wrapper">
           <span class="line-inner">[content]</span>
         </span>
       Then adds .motion-ready to trigger the CSS transition.
    */

    function splitHeroTitle() {
        const title = document.querySelector('.hero__title');
        if (!title) return;

        // Preserve the original HTML so we can parse it
        const rawHTML = title.innerHTML;

        // Split on <br> or <br/> or <br />
        const lines = rawHTML.split(/<br\s*\/?>/gi);

        // Rebuild as wrapped lines
        title.innerHTML = lines.map(function (lineHTML) {
            const trimmed = lineHTML.trim();
            if (!trimmed) return '';
            return '<span class="line-wrapper"><span class="line-inner">' + trimmed + '</span></span>';
        }).filter(Boolean).join('');

        // Trigger the animation after a brief tick so the browser paints the hidden state
        if (prefersReducedMotion) {
            title.classList.add('motion-ready');
        } else {
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    title.classList.add('motion-ready');
                });
            });
        }
    }

    /* ============================================
       SCROLL REVEALS (IntersectionObserver)
       ============================================
       Observes all .reveal elements.
       Adds .visible when they enter the viewport.
       Different CSS classes handle different reveal styles —
       JS doesn't need to know the type.
    */

    function initScrollReveals() {
        var revealElements = document.querySelectorAll('.reveal');
        if (!revealElements.length) return;

        if (!('IntersectionObserver' in window) || prefersReducedMotion) {
            revealElements.forEach(function (el) {
                el.classList.add('visible');
            });
            return;
        }

        var revealObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        revealObserver.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0,
                rootMargin: '50px 0px -60px 0px',
            }
        );

        revealElements.forEach(function (el) {
            revealObserver.observe(el);
        });

        // Scroll-based fallback for elements the observer misses
        // (can happen during fast scrolling or on ultrawide viewports)
        var pending = Array.from(revealElements);
        var fallbackTicking = false;

        function checkFallback() {
            for (var i = pending.length - 1; i >= 0; i--) {
                var el = pending[i];
                if (el.classList.contains('visible')) {
                    pending.splice(i, 1);
                    continue;
                }
                var rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    el.classList.add('visible');
                    revealObserver.unobserve(el);
                    pending.splice(i, 1);
                }
            }
            fallbackTicking = false;
            if (!pending.length) {
                window.removeEventListener('scroll', onScrollFallback);
            }
        }

        function onScrollFallback() {
            if (!fallbackTicking) {
                fallbackTicking = true;
                requestAnimationFrame(checkFallback);
            }
        }

        window.addEventListener('scroll', onScrollFallback, { passive: true });
        // Also run once immediately for elements already in view
        requestAnimationFrame(checkFallback);
    }

    /* ============================================
       PULL QUOTE REVEAL
       ============================================ */

    function initPullQuoteReveals() {
        var pullQuotes = document.querySelectorAll('.pull-quote');
        if (!pullQuotes.length) return;

        if (!('IntersectionObserver' in window) || prefersReducedMotion) {
            pullQuotes.forEach(function (q) { q.classList.add('visible'); });
            return;
        }

        var quoteObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        quoteObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.25 }
        );

        pullQuotes.forEach(function (q) { quoteObserver.observe(q); });
    }

    /* ============================================
       STAT CALLOUT REVEAL
       ============================================ */

    function initStatCalloutReveals() {
        var statCallouts = document.querySelectorAll('.stat-callout');
        if (!statCallouts.length) return;

        if (!('IntersectionObserver' in window) || prefersReducedMotion) {
            statCallouts.forEach(function (s) { s.classList.add('visible'); });
            return;
        }

        var statObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        statObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.25 }
        );

        statCallouts.forEach(function (s) { statObserver.observe(s); });
    }

    /* ============================================
       CONTACT BAR — IN-VIEW DETECTION
       ============================================
       The CSS uses .contact-bar.in-view to trigger
       the accent line scaleX draw animation.
    */

    function initContactBarReveal() {
        var contactBar = document.querySelector('.contact-bar');
        if (!contactBar) return;

        if (!('IntersectionObserver' in window) || prefersReducedMotion) {
            contactBar.classList.add('in-view');
            return;
        }

        var barObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in-view');
                        barObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.2 }
        );

        barObserver.observe(contactBar);
    }

    /* ============================================
       SCROLL-LINKED: --scroll-y & HERO PARALLAX
       ============================================
       Updates a CSS custom property on :root so
       animations.css can use it for grain parallax.

       Also handles hero content parallax (translateY + opacity fade).
    */

    function initScrollLinked() {
        if (prefersReducedMotion) return;

        var hero = document.getElementById('hero');
        var heroContent = hero ? hero.querySelector('.hero__content') : null;
        var ticking = false;

        function onScroll() {
            if (ticking) return;
            ticking = true;

            requestAnimationFrame(function () {
                var scrollY = window.scrollY;

                // Set CSS custom property for grain parallax
                document.documentElement.style.setProperty('--scroll-y', scrollY);

                // Hero content parallax & fade
                if (heroContent && scrollY < window.innerHeight) {
                    var progress = scrollY / (window.innerHeight * 0.8);
                    heroContent.style.transform = 'translateY(' + (scrollY * 0.18) + 'px)';
                    heroContent.style.opacity = Math.max(0, 1 - progress);
                }

                ticking = false;
            });
        }

        window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* ============================================
       NAV SCROLL BEHAVIOR
       ============================================ */

    function initNavScroll() {
        var nav = document.getElementById('nav');
        if (!nav) return;

        function handleNavScroll() {
            if (window.scrollY > 80) {
                nav.classList.add('nav--solid');
            } else {
                nav.classList.remove('nav--solid');
            }
        }

        window.addEventListener('scroll', handleNavScroll, { passive: true });
        // Run once on load in case page is already scrolled
        handleNavScroll();
    }

    /* ============================================
       MOBILE NAV TOGGLE
       ============================================ */

    function initMobileNav() {
        var navToggle = document.getElementById('navToggle');
        var mobileNav = document.getElementById('mobileNav');
        if (!navToggle || !mobileNav) return;

        navToggle.addEventListener('click', function () {
            navToggle.classList.toggle('active');
            mobileNav.classList.toggle('active');
            document.body.classList.toggle('nav-open');
        });

        // Close on link click
        mobileNav.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                navToggle.classList.remove('active');
                mobileNav.classList.remove('active');
                document.body.classList.remove('nav-open');
            });
        });
    }

    /* ============================================
       LIGHTBOX
       ============================================ */

    function initLightbox() {
        var lightbox = document.getElementById('lightbox');
        if (!lightbox) return;

        var lightboxImg = lightbox.querySelector('.lightbox__img');
        var lightboxCaption = lightbox.querySelector('.lightbox__caption');
        var lightboxClose = lightbox.querySelector('.lightbox__close');
        var lightboxPrev = lightbox.querySelector('.lightbox__nav--prev');
        var lightboxNext = lightbox.querySelector('.lightbox__nav--next');

        var galleryItems = [];
        var currentIndex = 0;

        document.querySelectorAll('[data-lightbox]').forEach(function (item, index) {
            galleryItems.push({
                src: item.dataset.lightbox,
                caption: item.dataset.caption || '',
            });
            item.addEventListener('click', function () {
                currentIndex = index;
                openLightbox();
            });
        });

        function openLightbox() {
            if (!galleryItems.length) return;
            var item = galleryItems[currentIndex];
            if (lightboxImg) {
                lightboxImg.style.background = item.src || 'var(--bg-tertiary)';
                lightboxImg.style.width = '80vw';
                lightboxImg.style.height = '60vh';
                lightboxImg.style.borderRadius = '0';
            }
            if (lightboxCaption) {
                lightboxCaption.textContent = item.caption;
            }
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }

        function nextImage() {
            currentIndex = (currentIndex + 1) % galleryItems.length;
            openLightbox();
        }

        function prevImage() {
            currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
            openLightbox();
        }

        if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
        if (lightboxPrev) lightboxPrev.addEventListener('click', prevImage);
        if (lightboxNext) lightboxNext.addEventListener('click', nextImage);

        lightbox.addEventListener('click', function (e) {
            if (e.target === lightbox) closeLightbox();
        });

        document.addEventListener('keydown', function (e) {
            if (!lightbox.classList.contains('active')) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
        });
    }

    /* ============================================
       GALLERY FILTER
       ============================================ */

    function initGalleryFilter() {
        var filterButtons = document.querySelectorAll('.gallery-filter__btn');
        var galleryItems = document.querySelectorAll('.masonry-grid__item');
        if (!filterButtons.length || !galleryItems.length) return;

        filterButtons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                filterButtons.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');

                var filter = btn.dataset.filter;

                galleryItems.forEach(function (item) {
                    if (filter === 'all' || item.dataset.category === filter) {
                        item.style.display = '';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }

    /* ============================================
       CONTACT FORM
       ============================================ */

    function initContactForm() {
        var contactForm = document.getElementById('contactForm');
        if (!contactForm) return;

        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var btn = contactForm.querySelector('.btn');

            // Gather form values
            var name = (contactForm.querySelector('#name') || {}).value || '';
            var email = (contactForm.querySelector('#email') || {}).value || '';
            var company = (contactForm.querySelector('#company') || {}).value || '';
            var projectType = (contactForm.querySelector('#projectType') || {}).value || '';
            var budget = (contactForm.querySelector('#budget') || {}).value || '';
            var timeline = (contactForm.querySelector('#timeline') || {}).value || '';
            var message = (contactForm.querySelector('#message') || {}).value || '';

            // Build mailto
            var subject = encodeURIComponent('New project inquiry from ' + name + ' — ' + projectType);
            var bodyParts = [
                'Hi Azlan,',
                '',
                'Name: ' + name,
                'Email: ' + email
            ];
            if (company) bodyParts.push('Company: ' + company);
            if (projectType) bodyParts.push('Project Type: ' + projectType);
            if (budget) bodyParts.push('Budget: ' + budget);
            if (timeline) bodyParts.push('Timeline: ' + timeline);
            bodyParts.push('');
            if (message) bodyParts.push('Message:\n' + message);
            bodyParts.push('');
            bodyParts.push('Sent from your portfolio site.');

            var body = encodeURIComponent(bodyParts.join('\n'));
            var mailtoLink = 'mailto:azlanallahwala@gmail.com?subject=' + subject + '&body=' + body;

            // Open email client
            window.location.href = mailtoLink;

            // Show success state
            btn.innerHTML = 'Opening email client&hellip;';
            btn.style.background = '#44BB77';
            setTimeout(function () {
                btn.innerHTML = 'Send Message <span class="arrow">&rarr;</span>';
                btn.style.background = '';
            }, 3000);
        });
    }

    /* ============================================
       INLINE CONVERSATIONAL FORM (Homepage)
       ============================================
       A slick 3-step chat-style micro-form in the
       contact bar. Asks a few quick questions, then
       opens a pre-filled mailto to Azlan.
    */

    function initConvoForm() {
        var startBtn = document.getElementById('startConvoBtn');
        var convoForm = document.getElementById('convoForm');
        var convoChat = document.getElementById('convoChat');
        var step1 = document.getElementById('convoStep1');
        var step2 = document.getElementById('convoStep2');
        var step3 = document.getElementById('convoStep3');
        var sendBtn = document.getElementById('convoSend');

        if (!startBtn || !convoForm) return;

        var answers = { work: '', source: '', name: '', email: '', note: '' };

        // Utility: add a chat bubble
        function addBubble(text, type) {
            var bubble = document.createElement('div');
            bubble.className = 'convo-bubble convo-bubble--' + type;
            bubble.textContent = text;
            convoChat.appendChild(bubble);
            // Scroll the contact bar into nice view
            bubble.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // Utility: show typing indicator, then resolve
        function showTyping(delay) {
            return new Promise(function (resolve) {
                var typing = document.createElement('div');
                typing.className = 'convo-typing';
                typing.innerHTML = '<span class="convo-typing__dot"></span><span class="convo-typing__dot"></span><span class="convo-typing__dot"></span>';
                convoChat.appendChild(typing);
                typing.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                setTimeout(function () {
                    convoChat.removeChild(typing);
                    resolve();
                }, delay);
            });
        }

        // Utility: transition steps
        function showStep(stepEl) {
            document.querySelectorAll('.convo-form__step').forEach(function (s) {
                s.classList.remove('active');
            });
            if (stepEl) stepEl.classList.add('active');
        }

        // Step 0: Open the form
        startBtn.addEventListener('click', function () {
            convoForm.classList.add('active');
            startBtn.style.color = 'var(--accent)';

            showTyping(600).then(function () {
                addBubble("Hey! What kind of work are you looking for?", 'bot');
                showStep(step1);
            });
        });

        // Step 1: Work type dropdown + Next button
        var workSelect = document.getElementById('convoWorkType');
        var step1Next = document.getElementById('convoStep1Next');
        if (step1Next && workSelect) {
            step1Next.addEventListener('click', function () {
                if (!workSelect.value) {
                    workSelect.style.borderColor = 'rgba(232, 93, 58, 0.6)';
                    workSelect.focus();
                    return;
                }
                answers.work = workSelect.value;
                addBubble(answers.work, 'user');
                showStep(null);

                showTyping(500).then(function () {
                    addBubble("Nice. How did you find me?", 'bot');
                    showStep(step2);
                });
            });
        }

        // Step 2: Source pills
        step2.querySelectorAll('.convo-pill').forEach(function (pill) {
            pill.addEventListener('click', function () {
                answers.source = pill.dataset.value;
                addBubble(answers.source, 'user');
                showStep(null);

                showTyping(500).then(function () {
                    addBubble("Almost there — drop your details and I'll be in touch.", 'bot');
                    showStep(step3);
                    // Auto-focus the name field
                    var nameInput = document.getElementById('convoName');
                    if (nameInput) setTimeout(function () { nameInput.focus(); }, 100);
                });
            });
        });

        // Step 3: Send button
        sendBtn.addEventListener('click', function () {
            var nameInput = document.getElementById('convoName');
            var emailInput = document.getElementById('convoEmail');
            var noteInput = document.getElementById('convoNote');

            var name = nameInput.value.trim();
            var email = emailInput.value.trim();
            var note = noteInput.value.trim();

            // Validation
            if (!name) { nameInput.focus(); nameInput.style.borderColor = 'rgba(232, 93, 58, 0.6)'; return; }
            if (!email || email.indexOf('@') === -1) { emailInput.focus(); emailInput.style.borderColor = 'rgba(232, 93, 58, 0.6)'; return; }

            answers.name = name;
            answers.email = email;
            answers.note = note;

            // Compose mailto
            var subject = encodeURIComponent('New inquiry from ' + answers.name + ' — ' + answers.work);
            var body = encodeURIComponent(
                'Hi Azlan,\n\n' +
                'Name: ' + answers.name + '\n' +
                'Email: ' + answers.email + '\n' +
                'Looking for: ' + answers.work + '\n' +
                'Found you via: ' + answers.source + '\n' +
                (answers.note ? 'Note: ' + answers.note + '\n' : '') +
                '\nSent from your portfolio site.'
            );

            var mailtoLink = 'mailto:azlanallahwala@gmail.com?subject=' + subject + '&body=' + body;

            // Show success state
            showStep(null);
            addBubble(name + ' — ' + email, 'user');

            showTyping(400).then(function () {
                // Replace chat with success
                var successHTML = '<div class="convo-success">' +
                    '<span class="convo-success__icon">&#10003;</span>' +
                    '<p class="convo-success__text">Opening your email client now.<br>If it doesn\'t open, <a href="' + mailtoLink + '" style="color: var(--accent); text-decoration: underline;">click here</a>.</p>' +
                    '</div>';

                // Clear steps, show success after chat
                document.querySelectorAll('.convo-form__step').forEach(function (s) { s.style.display = 'none'; });
                var successDiv = document.createElement('div');
                successDiv.innerHTML = successHTML;
                convoForm.appendChild(successDiv.firstChild);

                // Open mailto
                window.location.href = mailtoLink;
            });
        });

        // Allow Enter key to submit on step 3
        [document.getElementById('convoName'), document.getElementById('convoEmail'), document.getElementById('convoNote')].forEach(function (input) {
            if (!input) return;
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendBtn.click();
                }
            });
        });
    }

    /* ============================================
       ACTIVE NAV LINK
       ============================================ */

    function initActiveNavLink() {
        var fullPath = window.location.pathname;
        var currentFile = fullPath.split('/').pop() || 'index.html';
        var isInBlogDir = fullPath.indexOf('/blog/') !== -1;

        document.querySelectorAll('.nav__link').forEach(function (link) {
            var href = link.getAttribute('href');
            if (isInBlogDir && (href === '../blog.html' || href === 'blog.html')) {
                link.classList.add('nav__link--active');
            } else if (href === currentFile) {
                link.classList.add('nav__link--active');
            }
        });
    }

    /* ============================================
       INIT — ORCHESTRATE THE SEQUENCE
       ============================================ */

    // Run split-text immediately (before paint if possible)
    splitHeroTitle();

    // Everything else on DOMContentLoaded or immediately if already loaded
    function init() {
        initNavScroll();
        initMobileNav();
        initScrollReveals();
        initPullQuoteReveals();
        initStatCalloutReveals();
        initContactBarReveal();
        initScrollLinked();
        initLightbox();
        initGalleryFilter();
        initContactForm();
        initConvoForm();
        initActiveNavLink();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
