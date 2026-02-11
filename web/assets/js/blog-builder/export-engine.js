/**
 * Blog Builder - Export Engine
 * Converts canvas elements to semantic HTML
 */

class ExportEngine {
    constructor() {
        this.elementRenderers = {
            text: this.renderText.bind(this),
            heading: this.renderHeading.bind(this),
            image: this.renderImage.bind(this),
            video: this.renderVideo.bind(this),
            button: this.renderButton.bind(this),
            divider: this.renderDivider.bind(this),
            grid: this.renderGrid.bind(this)
        };
    }

    /**
     * Export to HTML
     */
    exportToHTML(elements) {
        const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);
        const htmlParts = [];

        sortedElements.forEach(element => {
            const renderer = this.elementRenderers[element.type];
            if (renderer) {
                const html = renderer(element);
                if (html) {
                    htmlParts.push(html);
                }
            }
        });

        return htmlParts.join('\n');
    }

    /**
     * Export to JSON (for re-editing)
     */
    exportToJSON(elements, metadata) {
        return {
            version: '1.0',
            metadata: metadata,
            elements: BuilderUtils.deepClone(elements),
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Render text element
     */
    renderText(element) {
        const { content, fontSize, fontColor, fontWeight, fontFamily, textAlign, lineHeight } = element.properties;
        const style = this.buildStyle({
            'font-size': `${fontSize}px`,
            'color': fontColor,
            'font-weight': fontWeight,
            'font-family': fontFamily,
            'text-align': textAlign,
            'line-height': lineHeight,
            'margin-bottom': '1rem'
        });

        return `<p style="${style}">${BuilderUtils.escapeHTML(content)}</p>`;
    }

    /**
     * Render heading element
     */
    renderHeading(element) {
        const { content, level, fontSize, fontColor, fontWeight, fontFamily, textAlign } = element.properties;
        const tag = level || 'h2';
        const style = this.buildStyle({
            'font-size': `${fontSize}px`,
            'color': fontColor,
            'font-weight': fontWeight,
            'font-family': fontFamily,
            'text-align': textAlign,
            'margin-bottom': '1.5rem',
            'margin-top': '1.5rem'
        });

        return `<${tag} style="${style}">${BuilderUtils.escapeHTML(content)}</${tag}>`;
    }

    /**
     * Render image element
     */
    renderImage(element) {
        const { src, alt, objectFit } = element.properties;
        if (!src) {
            return `<!-- Empty image element -->\n`;
        }

        const style = this.buildStyle({
            'width': '100%',
            'height': 'auto',
            'object-fit': objectFit,
            'border-radius': '0.5rem',
            'margin-bottom': '1.5rem',
            'max-width': typeof element.size.width === 'number' ? `${element.size.width}px` : '100%'
        });

        return `<figure style="margin-bottom: 1.5rem; margin-top: 1.5rem;">
    <img src="${BuilderUtils.escapeHTML(src)}" alt="${BuilderUtils.escapeHTML(alt)}" style="${style}" />
</figure>`;
    }

    /**
     * Render video element
     */
    renderVideo(element) {
        const { src, type, autoplay, controls } = element.properties;
        if (!src) {
            return '<!-- Empty video element -->\n';
        }

        if (type === 'embed') {
            // Assume YouTube or Vimeo embed
            return `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin-bottom: 1.5rem; border-radius: 0.5rem;">
    <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" src="${BuilderUtils.escapeHTML(src)}" allowfullscreen></iframe>
</div>`;
        } else {
            // HTML5 video
            const style = this.buildStyle({
                'width': '100%',
                'height': 'auto',
                'border-radius': '0.5rem',
                'margin-bottom': '1.5rem',
                'max-width': typeof element.size.width === 'number' ? `${element.size.width}px` : '100%'
            });

            return `<video style="${style}" ${autoplay ? 'autoplay' : ''} ${controls ? 'controls' : ''}>
    <source src="${BuilderUtils.escapeHTML(src)}" />
    Your browser does not support the video tag.
</video>`;
        }
    }

    /**
     * Render button element
     */
    renderButton(element) {
        const { text, backgroundColor, textColor, fontSize, fontWeight, padding, borderRadius, link } = element.properties;
        const style = this.buildStyle({
            'background-color': backgroundColor,
            'color': textColor,
            'font-size': `${fontSize}px`,
            'font-weight': fontWeight,
            'padding': padding,
            'border-radius': `${borderRadius}px`,
            'border': 'none',
            'cursor': 'pointer',
            'display': 'inline-block',
            'text-decoration': 'none',
            'margin-bottom': '1.5rem',
            'margin-top': '1rem'
        });

        if (link) {
            return `<a href="${BuilderUtils.escapeHTML(link)}" style="${style}" class="btn">${BuilderUtils.escapeHTML(text)}</a>`;
        } else {
            return `<button style="${style}" class="btn" onclick="alert('Button clicked')">${BuilderUtils.escapeHTML(text)}</button>`;
        }
    }

    /**
     * Render divider element
     */
    renderDivider(element) {
        const { color, thickness, margin, width } = element.properties;
        const style = this.buildStyle({
            'border': 'none',
            'border-top': `${thickness}px solid ${color}`,
            'margin-top': `${margin}px`,
            'margin-bottom': `${margin}px`,
            'width': typeof width === 'number' ? `${width}px` : width
        });

        return `<hr style="${style}" />`;
    }

    /**
     * Render grid element
     */
    renderGrid(element) {
        const { columns, gap, items } = element.properties;
        const style = this.buildStyle({
            'display': 'grid',
            'grid-template-columns': `repeat(${columns}, 1fr)`,
            'gap': `${gap}px`,
            'margin-bottom': '1.5rem',
            'margin-top': '1rem'
        });

        let gridContent = '';
        if (items && items.length > 0) {
            gridContent = items.map(item => `
    <div style="padding: ${gap / 2}px;">
        <div style="background: #f9f9f9; padding: 1rem; border-radius: 0.5rem;">
            ${BuilderUtils.escapeHTML(item.content || 'Grid item')}
        </div>
    </div>
            `).join('\n');
        }

        return `<div style="${style}">${gridContent}
</div>`;
    }

    /**
     * Build inline style string from object
     */
    buildStyle(styleObject) {
        return Object.entries(styleObject)
            .filter(([key, value]) => value !== undefined && value !== null)
            .map(([key, value]) => `${key}:${value}`)
            .join(';');
    }

    /**
     * Generate complete blog HTML with metadata
     */
    generateCompleteBlogHTML(elements, metadata) {
        const contentHTML = this.exportToHTML(elements);
        const title = BuilderUtils.escapeHTML(metadata.title || 'Untitled Blog');
        const excerpt = BuilderUtils.escapeHTML(metadata.excerpt || '');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f9f9f9;
        }
        .blog-container {
            max-width: 800px;
            margin: 2rem auto;
            padding: 2rem;
            background: white;
            border-radius: 0.5rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .blog-header {
            margin-bottom: 2rem;
            border-bottom: 2px solid #e5e5e5;
            padding-bottom: 1.5rem;
        }
        .blog-title {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        .blog-excerpt {
            font-size: 1.1rem;
            color: #666;
            font-style: italic;
        }
        .blog-content {
            line-height: 1.8;
        }
        .blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4, .blog-content h5, .blog-content h6 {
            margin-top: 1.5rem;
            margin-bottom: 0.5rem;
        }
        .blog-content img, .blog-content video {
            max-width: 100%;
            height: auto;
        }
    </style>
</head>
<body>
    <article class="blog-container">
        <header class="blog-header">
            <h1 class="blog-title">${title}</h1>
            ${excerpt ? `<p class="blog-excerpt">${excerpt}</p>` : ''}
        </header>
        <div class="blog-content">
${contentHTML}
        </div>
    </article>
</body>
</html>`;
    }
}

/**
 * Export
 */
window.ExportEngine = new ExportEngine();
