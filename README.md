# CSUN English Graduate Program Website

A modern static site generator website built with markdown content and client-side rendering.

## Architecture

This website uses a **client-side static site generator** approach:

- **Content**: Written in Markdown files with YAML front matter
- **Rendering**: Client-side using markdown-it JavaScript library
- **Routing**: Page.js for single-page application navigation
- **Styling**: Bootstrap 5 for responsive design
- **Interactivity**: DataTables for course schedules, Bootstrap TOC for navigation

## File Structure

```
/
├── index.html                          # Main application template
├── pages/                              # Markdown content files
│   ├── home.md                         # Home page content
│   ├── about.md                        # About page content
│   ├── new-students.md                 # New students information
│   ├── prospective-students.md         # Prospective students information
│   ├── courses-spring-2026.md          # Spring 2026 courses
│   ├── courses-fall-2025.md            # Fall 2025 courses
│   └── courses-spring-2025.md          # Spring 2025 courses
├── js/
│   ├── static-site-generator.js        # Main SSG logic
│   └── bootstrap-toc.min.js            # Table of contents
├── css/                                # Stylesheets
│   ├── bootstrap-toc.min.css
│   └── styles.css
├── future-offerings.js                 # Course data
├── legacy/                             # Legacy files (moved from old system)
│   ├── router.js                       # Old router
│   ├── navigation.js                   # Old navigation
│   ├── partials/                       # Old navigation partials
│   ├── templates/                      # Old HTML templates
│   └── *.html                          # Old HTML files
└── README.md                           # This file
```

## How It Works

### 1. Content Management
- All page content is stored in markdown files in the `pages/` directory
- Each markdown file has YAML front matter for metadata:
  ```yaml
  ---
  title: "Page Title"
  layout: "default"
  nav_id: "navigationId"
  ---
  ```

### 2. Static Site Generation
- `js/static-site-generator.js` handles all SSG functionality
- Loads markdown files via fetch API
- Parses YAML front matter
- Renders markdown to HTML using markdown-it
- Updates page content dynamically

### 3. Routing
- Uses Page.js for client-side routing
- Clean URLs (e.g., `/graduate-program/about`)
- Legacy redirects for backwards compatibility
- Browser history support

### 4. Features
- **Table of Contents**: Auto-generated from headings
- **Course Tables**: Dynamic DataTables from JavaScript data
- **Responsive Design**: Bootstrap 5 mobile-first approach
- **Performance**: Content caching and lazy loading

## Adding Content

### New Page
1. Create a markdown file in `pages/` directory:
   ```markdown
   ---
   title: "New Page Title"
   layout: "default"
   nav_id: "newPage"
   ---

   # Page Content

   Your markdown content here.
   ```

2. Add route in `js/static-site-generator.js`:
   ```javascript
   page('/graduate-program/new-page', () => this.loadPage('new-page'));
   ```

3. Add navigation link in `index.html` (if needed):
   ```html
   <a id="newPage" class="nav-link" href="/graduate-program/new-page">New Page</a>
   ```

### Editing Content
Simply edit the markdown files in the `pages/` directory. Changes will be reflected immediately when the page is refreshed or navigated to.

## Development

### Local Development
1. Start a local web server:
   ```bash
   python3 -m http.server 8000
   ```
2. Open http://localhost:8000 in your browser

### Dependencies
All dependencies are loaded from CDNs:
- Bootstrap 5.3.3
- Bootstrap Icons
- DataTables 2.1.8
- Page.js 1.11.6
- markdown-it 14.1.0
- jQuery 3.7.1 (slim)

## Benefits

### For Content Editors
- **Easy editing**: Standard markdown syntax
- **Version control**: All content in git
- **No build process**: Direct file editing
- **Structured metadata**: YAML front matter

### For Developers
- **Modern architecture**: ES6+ JavaScript
- **Maintainable**: Separation of concerns
- **Extensible**: Component-based approach
- **Performance**: Client-side caching

### For Users
- **Fast navigation**: No page reloads
- **Mobile friendly**: Responsive design
- **Accessible**: Semantic HTML structure
- **SEO friendly**: Clean URLs and proper titles

## Legacy Files

The `legacy/` directory contains files from the previous implementation:
- Old router and navigation system
- HTML templates (now replaced by markdown)
- Partial templates
- Test files

These files are kept for reference but are not used by the current system.

## Browser Support

- Modern browsers with ES6+ support
- JavaScript must be enabled
- Requires fetch API support

This implementation provides a modern, efficient way to manage the graduate program website while maintaining all existing functionality and improving the content editing experience.
