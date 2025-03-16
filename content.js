function getPageAnalysis() {
    const elements = Array.from(document.querySelectorAll('body *')); 
    const analysis = {
        fontColors: {},
        backgroundColors: {},
        fontFamilies: {},
        tagCounts: {},
        pageTitle: document.title,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        metaDescription: document.querySelector('meta[name="description"]')?.content || 'N/A',
        metaKeywords: document.querySelector('meta[name="keywords"]')?.content || 'N/A',
        imageCount: document.images.length,
        linkCount: document.links.length,
        scriptCount: document.scripts.length,
        stylesheetCount: document.styleSheets.length
    };

    elements.forEach(el => {
        if (el.offsetParent === null && el.nodeName !== 'SCRIPT' && el.nodeName !== 'STYLE' && el.nodeName !== 'LINK' && el.nodeName !== 'META' ) {
            return;
        }

        const computedStyle = window.getComputedStyle(el);

        // Font Colors
        const color = computedStyle.getPropertyValue('color');
        if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') { // Exclude fully transparent
            analysis.fontColors[color] = (analysis.fontColors[color] || 0) + 1;
        }

        // Background Colors
        const bgColor = computedStyle.getPropertyValue('background-color');
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') { // Exclude fully transparent
            analysis.backgroundColors[bgColor] = (analysis.backgroundColors[bgColor] || 0) + 1;
        }

        // Font Families
        const fontFamily = computedStyle.getPropertyValue('font-family');
        if (fontFamily) {
            const primaryFont = fontFamily.split(',')[0].trim().replace(/['"]/g, ''); 
            if (primaryFont && primaryFont.toLowerCase() !== 'inherit' && primaryFont.toLowerCase() !== 'initial') {
                 analysis.fontFamilies[primaryFont] = (analysis.fontFamilies[primaryFont] || 0) + 1;
            }
        }

        const tagName = el.tagName.toLowerCase();
        analysis.tagCounts[tagName] = (analysis.tagCounts[tagName] || 0) + 1;
    });

    // Function to get top N items from an object
    const getTopN = (obj, n = 5) => {
        return Object.entries(obj)
            .sort(([, a], [, b]) => b - a)
            .slice(0, n)
            .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
    };

    analysis.fontColors = getTopN(analysis.fontColors, 7);
    analysis.backgroundColors = getTopN(analysis.backgroundColors, 7);
    analysis.fontFamilies = getTopN(analysis.fontFamilies, 5);
    analysis.tagCounts = getTopN(analysis.tagCounts, 10);

    return analysis;
}

getPageAnalysis();