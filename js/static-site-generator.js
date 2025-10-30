/**
 * Static Site Generator for CSUN English Graduate Program Website
 * Uses markdown-it for rendering markdown files with YAML front matter
 */
class StaticSiteGenerator {
    constructor() {
        this.md = window.markdownit({
            html: true,
            breaks: true,
            linkify: true,
            typographer: true
        });

        // Add custom rule to parse {attribute} syntax for links
        this.md.core.ruler.after('inline', 'link_attributes', (state) => {
            const tokens = state.tokens;
            for (let i = 0; i < tokens.length; i++) {
                if (tokens[i].type === 'inline') {
                    this.parseLinkAttributes(tokens[i]);
                }
            }
        });

        // Configure link rendering to preserve HTML attributes
        const defaultLinkRender = this.md.renderer.rules.link_open || function(tokens, idx, options, env, renderer) {
            return renderer.renderToken(tokens, idx, options);
        };

        this.md.renderer.rules.link_open = function (tokens, idx, options, env, renderer) {
            // Get the current token
            const token = tokens[idx];

            // Find target attribute in HTML and preserve it
            const href = token.attrGet('href');
            if (href && (href.startsWith('http') || href.startsWith('https'))) {
                // Only add target="_blank" if not already specified
                if (!token.attrGet('target')) {
                    token.attrSet('target', '_blank');
                }
                // Only add rel if not already specified
                if (!token.attrGet('rel')) {
                    token.attrSet('rel', 'noopener noreferrer');
                }
            }

            return defaultLinkRender(tokens, idx, options, env, renderer);
        };

        // Configure HTML block rendering to preserve all attributes
        this.md.renderer.rules.html_block = function (tokens, idx, options, env, renderer) {
            return tokens[idx].content;
        };

        // Configure HTML inline rendering to preserve all attributes
        this.md.renderer.rules.html_inline = function (tokens, idx, options, env, renderer) {
            return tokens[idx].content;
        };

        // Add custom renderer for headings to include IDs for TOC
        const self = this;
        this.md.renderer.rules.heading_open = function (tokens, idx, options, env, renderer) {
            const token = tokens[idx];

            // Get the text content from the next token (heading content)
            const contentToken = tokens[idx + 1];
            let headingText = '';

            if (contentToken && contentToken.children) {
                headingText = contentToken.children
                    .filter(t => t.type === 'text' || t.type === 'code_inline')
                    .map(t => t.content)
                    .join('');
            }

            // Generate slug from heading text
            const slug = self.generateSlug(headingText);

            // Add id attribute to the token
            token.attrSet('id', slug);

            return renderer.renderToken(tokens, idx, options);
        };

        this.cache = new Map();
        this.currentPage = '';
        this.initializeRouter();
        this.initializeBackToTop();
    }

    /**
     * Generate a URL-friendly slug from text
     * @param {string} text - Text to convert to slug
     * @returns {string} URL-friendly slug
     */
    generateSlug(text) {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, hyphens
            .replace(/\s+/g, '-')      // Replace spaces with hyphens
            .replace(/-+/g, '-')       // Replace multiple hyphens with single hyphen
            .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens
    }

    /**
     * Parse link attributes from markdown syntax like [text](url){target="_blank"}
     * @param {Object} token - The inline token to process
     */
    parseLinkAttributes(token) {
        const children = token.children;
        if (!children) return;

        for (let i = 0; i < children.length - 1; i++) {
            const current = children[i];
            const next = children[i + 1];

            // Look for link_close followed by text with attributes
            if (current.type === 'link_close' && next.type === 'text') {
                const attrMatch = next.content.match(/^\{([^}]+)\}/);
                if (attrMatch) {
                    // Find the corresponding link_open token
                    for (let j = i - 1; j >= 0; j--) {
                        if (children[j].type === 'link_open') {
                            // Parse attributes from the match
                            const attrString = attrMatch[1];
                            const attrs = this.parseAttributes(attrString);

                            // Add attributes to the link_open token
                            for (const [key, value] of Object.entries(attrs)) {
                                children[j].attrSet(key, value);
                            }

                            // Remove the attribute text from the next token
                            next.content = next.content.replace(/^\{[^}]+\}/, '');
                            break;
                        }
                    }
                }
            }
        }
    }

    /**
     * Parse attribute string into key-value pairs
     * @param {string} attrString - String like 'target="_blank" class="example"'
     * @returns {Object} - Object with attribute key-value pairs
     */
    parseAttributes(attrString) {
        const attrs = {};
        const attrRegex = /(\w+)=["']([^"']+)["']/g;
        let match;

        while ((match = attrRegex.exec(attrString)) !== null) {
            attrs[match[1]] = match[2];
        }

        return attrs;
    }

    /**
     * Initialize Page.js router with all routes
     */
    initializeRouter() {
        // Primary routes
        page('/graduate-program/', () => this.loadPage('home'));
        page('/graduate-program/', () => this.loadPage('home'));
        page('/graduate-program/about', () => this.loadPage('about'));
        page('/graduate-program/prospective-students', () => this.loadPage('prospective-students'));
        page('/graduate-program/new-students', () => this.loadPage('new-students'));
        // Course routes
        page('/graduate-program/courses/spring-2026', () => this.loadPage('courses-spring-2026'));
        page('/graduate-program/courses/descriptions-spring-2026', () => this.loadPage('descriptions-spring-2026'));
        page('/graduate-program/courses/fall-2025', () => this.loadPage('courses-fall-2025'));
        page('/graduate-program/courses/descriptions-fall-2025', () => this.loadPage('descriptions-fall-2025'));

        page('/graduate-program/courses/spring-2025', () => this.loadPage('courses-spring-2025'));
        page('/graduate-program/courses/descriptions-spring-2025', () => this.loadPage('descriptions-spring-2025'));

        // Legacy redirects for backwards compatibility
        page('/graduate-program/about.html', () => page.redirect('/graduate-program/about'));
        page('/graduate-program/prospective-students.html', () => page.redirect('/graduate-program/prospective-students'));
        page('/graduate-program/new-students.html', () => page.redirect('/graduate-program/new-students'));

        page('/graduate-program/grad-courses-spring-2026.html', () => page.redirect('/graduate-program/courses/spring-2026'));
        page('/graduate-program/grad-courses-descriptions-spring-2026.html', () => page.redirect('/graduate-program/courses/spring-2026'));
        page('/graduate-program/grad-courses-fall-2025.html', () => page.redirect('/graduate-program/courses/fall-2025'));
        page('/graduate-program/grad-courses-descriptions-fall-2025.html', () => page.redirect('/graduate-program/courses/descriptions-fall-2025'));
        page('/graduate-program/grad-courses-spring-2025.html', () => page.redirect('/graduate-program/courses/spring-2025'));
        page('/graduate-program/grad-courses-descriptions-spring-2025.html', () => page.redirect('/graduate-program/courses/descriptions-spring-2025'));

        // Catch-all for 404s
        page('*', () => this.showErrorPage());

        // Start the router with hash link handling disabled
        page.start({ hashbang: false, click: true, dispatch: true });

        // Manually handle hash links (anchor links) on the same page
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a');
            if (!target) return;

            const href = target.getAttribute('href');
            // If it's a hash link (starts with #), don't let Page.js handle it
            if (href && href.startsWith('#')) {
                e.stopPropagation(); // Prevent Page.js from handling it
                const element = document.getElementById(href.substring(1));
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }, true); // Use capture phase to intercept before Page.js
    }

    /**
     * Load and render a page from markdown
     * @param {string} pageName - Name of the page to load
     */
    async loadPage(pageName) {
        try {
            // Check if we're loading the same page (used to prevent scroll on hash navigation)
            const isPageChange = this.currentPage !== pageName;

            // Show loading spinner
            this.showLoadingSpinner();

            // Load markdown content
            const { frontMatter, content } = await this.loadMarkdownPage(pageName);

            // Render content
            const htmlContent = this.md.render(content);

            // Update page
            this.updatePageContent(htmlContent, frontMatter);
            this.updateNavigation(frontMatter.nav_id || pageName);
            this.updatePageTitle(frontMatter.title);

            // Reinitialize components
            this.reinitializeComponents(pageName, frontMatter, isPageChange);

            // Update current page tracker
            this.currentPage = pageName;

            this.currentPage = pageName;

        } catch (error) {
            console.error('Error loading page:', error);
            this.showErrorPage();
        }
    }

    /**
     * Load markdown file and parse front matter
     * @param {string} pageName - Name of the page to load
     * @returns {Object} Object with frontMatter and content
     */
    async loadMarkdownPage(pageName) {
        // Check cache first
        if (this.cache.has(pageName)) {
            return this.cache.get(pageName);
        }

        try {
            const response = await fetch(`/graduate-program/pages/${pageName}.md`);
            if (!response.ok) {
                throw new Error(`Failed to load ${pageName}.md`);
            }

            const markdownText = await response.text();
            const parsed = this.parseFrontMatter(markdownText);

            // Cache the result
            this.cache.set(pageName, parsed);

            return parsed;
        } catch (error) {
            throw new Error(`Could not load page: ${pageName}`);
        }
    }

    /**
     * Parse YAML front matter from markdown content
     * @param {string} markdownText - Raw markdown text with front matter
     * @returns {Object} Object with frontMatter and content
     */
    parseFrontMatter(markdownText) {
        const frontMatterRegex = /^---\s*\n(.*?)\n---\s*\n(.*)$/s;
        const match = markdownText.match(frontMatterRegex);

        if (!match) {
            return {
                frontMatter: {},
                content: markdownText
            };
        }

        const frontMatterYaml = match[1];
        const content = match[2];

        // Simple YAML parser for front matter
        const frontMatter = {};
        frontMatterYaml.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
                const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
                frontMatter[key.trim()] = value;
            }
        });

        return { frontMatter, content };
    }

    /**
     * Update the page content area with rendered HTML
     * @param {string} htmlContent - Rendered HTML content
     * @param {Object} frontMatter - Front matter metadata
     */
    updatePageContent(htmlContent, frontMatter) {
        const appContent = document.getElementById('app-content');
        const layout = frontMatter.layout || 'default';

        // Add the title from front matter if it exists and no H1 in content
        let finalContent = htmlContent;
        if (frontMatter.title && !htmlContent.includes('<h1')) {
            finalContent = `<h1 class="mt-3">${frontMatter.title}</h1>${htmlContent}`;
        }

        // Apply the appropriate layout
        appContent.innerHTML = this.getLayoutTemplate(layout, finalContent);
    }

    /**
     * Get the HTML template for a specific layout
     * @param {string} layout - Layout name
     * @param {string} content - Rendered content
     * @returns {string} Layout HTML
     */
    getLayoutTemplate(layout, content) {
        switch (layout) {
            case 'toc':
                return `
                    <div class="row g-4">
                        <div class="col-lg-3 col-md-4">
                            <nav id="toc" data-toggle="toc"></nav>
                        </div>
                        <div class="col-lg-9 col-md-8">
                            <div id="page-content" class="content-area">
                                ${content}
                            </div>
                        </div>
                    </div>
                `;

            case 'default':
            default:
                return `
                    <div class="row">
                        <div class="col-12">
                            <div id="page-content" class="content-area">
                                ${content}
                            </div>
                        </div>
                    </div>
                `;
        }
    }

    /**
     * Update active navigation state
     * @param {string} navId - Navigation ID to highlight
     */
    updateNavigation(navId) {
        // Remove active class from all nav items
        document.querySelectorAll('.nav-link, .dropdown-item').forEach(link => {
            link.classList.remove('active');
        });

        // Add active class to current nav item
        if (navId && navId !== 'home') {
            const navElement = document.getElementById(navId);
            if (navElement) {
                navElement.classList.add('active');
            }
        }
    }

    /**
     * Update page title in browser
     * @param {string} title - Page title
     */
    updatePageTitle(title) {
        if (title) {
            document.title = title;
        } else {
            document.title = 'CSUN English Graduate Program Resources';
        }
    }

    /**
     * Show loading spinner while content loads
     */
    showLoadingSpinner() {
        document.getElementById('app-content').innerHTML = `
            <div class="text-center mt-5">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading page content...</p>
            </div>
        `;
    }

    /**
     * Show 404 error page
     */
    showErrorPage() {
        document.getElementById('app-content').innerHTML = `
            <div class="text-center mt-5">
                <h1>Page Not Found</h1>
                <p>Sorry, the page you're looking for doesn't exist.</p>
                <a href="/graduate-program/" class="btn btn-primary">Go Home</a>
            </div>
        `;
    }

    /**
     * Reinitialize components after page load
     * @param {string} pageName - Current page name
     * @param {Object} frontMatter - Page front matter
     */
    reinitializeComponents(pageName, frontMatter) {
        // Accept a third argument: isPageChange
        setTimeout(() => {
            const layout = frontMatter.layout || 'default';

            // Reinitialize Bootstrap TOC only for layouts that support it
            if (layout === 'toc' && typeof Toc !== 'undefined' && document.getElementById('toc')) {
                try {
                    Toc.init({
                        $nav: $("#toc"),
                        $scope: $("#page-content"),
                        headings: 'h2' // Only include h2 headings in TOC
                    });
                } catch (e) {
                    console.log('TOC initialization skipped:', e);
                }
            }

            // Initialize DataTables for course pages
            if (pageName.includes('courses-') && typeof future2 !== 'undefined') {
                this.initializeCourseTable();
            }

            // Only scroll to top if this is a real page change (not a hash navigation)
            if (arguments.length < 3 || arguments[2]) {
                window.scrollTo(0, 0);
            }
        }, 100);
    }

    /**
     * Initialize DataTables for course schedule
     */
    initializeCourseTable() {
        const tableContainer = document.getElementById('course-schedule-table');
        if (tableContainer && typeof future2 !== 'undefined') {
            try {
                // Create table element
                tableContainer.innerHTML = '<table class="table table-bordered table-hover table-light table-striped mb-3" id="schedule"></table>';

                // Use the first key in the future object to get the next semester's courses
                const nextSemester = future2[Object.keys(future2)[0]];
                if (nextSemester && nextSemester.courses) {
                    const courses = [];
                    for (const course of nextSemester.courses) {
                        courses.push([course.name, course.day, course.time, course.instructor]);
                    }
                    new DataTable("#schedule", {
                        data: courses,
                        info: false,
                        paging: false,
                        searching: false,
                        columns: [
                            { title: "Course" },
                            { title: "Day" },
                            { title: "Time" },
                            { title: "Instructor" }
                        ]
                    });
                }
            } catch (e) {
                console.log('Could not initialize course table:', e);
            }
        }
    }

    /**
     * Initialize back-to-top button functionality
     */
    initializeBackToTop() {
        const topBtn = document.getElementById("btn-back-to-top");

        if (topBtn) {
            // Show button when the user scrolls down 20px from the top
            window.onscroll = function () {
                if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
                    topBtn.classList.add("show");
                } else {
                    topBtn.classList.remove("show");
                }
            };

            // Scroll to top when clicked
            topBtn.addEventListener("click", function() {
                document.body.scrollTop = 0;
                document.documentElement.scrollTop = 0;
            });
        }
    }
}

// Initialize the static site generator when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.ssg = new StaticSiteGenerator();
});