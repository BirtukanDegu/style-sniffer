document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
    const DOMElements = {
        pageTitle: document.getElementById('pageTitle'), // Add this line
        fontColorsList: document.getElementById('fontColorsList'),
        backgroundColorsList: document.getElementById('backgroundColorsList'),
        fontFamiliesList: document.getElementById('fontFamiliesList'),
        loading: document.getElementById('loading'),
        results: document.getElementById('results'),
        error: document.getElementById('error')
    };

    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return unsafe;
        return unsafe
            .replace(/&/g, "&")
            .replace(/</g, "<")
            .replace(/>/g, ">")
            .replace(/"/g, '\\"')
            .replace(/'/g, "'");
    }

    function displayList(element, data, isColor = false) {
        element.innerHTML = ''; // Clear previous
        if (!data || Object.keys(data).length === 0) {
            const listItem = document.createElement('li');
            listItem.textContent = 'No data found.';
            listItem.style.opacity = "0.7";
            element.appendChild(listItem);
            return;
        }

        Object.keys(data).forEach(value => {
            const listItem = document.createElement('li');
            
            const valueInfoSpan = document.createElement('span');
            valueInfoSpan.className = 'value-info';

            if (isColor) {
                const swatch = document.createElement('span');
                swatch.className = 'color-swatch';
                swatch.style.backgroundColor = value;
                valueInfoSpan.appendChild(swatch);
            }

            const textSpan = document.createElement('span');
            textSpan.className = 'value-text';
            textSpan.title = value; // Show full value on hover if truncated
            textSpan.textContent = escapeHtml(value);
            valueInfoSpan.appendChild(textSpan);
            
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-button';
            copyButton.title = `Copy "${escapeHtml(value)}"`;
            copyButton.innerHTML = `<i class="fas fa-copy"></i>`;
            
            copyButton.addEventListener('click', () => {
                navigator.clipboard.writeText(value)
                    .then(() => {
                        copyButton.innerHTML = `<i class="fas fa-check"></i>`;
                        copyButton.classList.add('copied');
                        setTimeout(() => {
                            copyButton.innerHTML = `<i class="fas fa-copy"></i>`;
                            copyButton.classList.remove('copied');
                        }, 1500);
                    })
                    .catch(err => {
                        console.error('Failed to copy: ', err);
                        copyButton.textContent = 'Error';
                        setTimeout(() => {
                           copyButton.innerHTML = `<i class="fas fa-copy"></i>`;
                        }, 1500);
                    });
            });

            listItem.appendChild(valueInfoSpan);
            listItem.appendChild(copyButton);
            element.appendChild(listItem);
        });
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        if (currentTab && currentTab.id) {
            if (currentTab.url && (currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('https://chrome.google.com/webstore'))) {
                DOMElements.loading.style.display = 'none';
                DOMElements.results.style.display = 'none';
                DOMElements.error.style.display = 'block';
                DOMElements.error.querySelector('p').textContent = "Cannot analyze browser-internal pages or the Chrome Web Store due to security restrictions.";
                return;
            }

            chrome.scripting.executeScript(
                {
                    target: { tabId: currentTab.id },
                    files: ['content.js']
                },
                (injectionResults) => {
                    DOMElements.loading.style.display = 'none';
                    if (chrome.runtime.lastError || !injectionResults || injectionResults.length === 0 || !injectionResults[0].result) {
                        console.error("Script injection or execution failed:", chrome.runtime.lastError?.message, injectionResults);
                        DOMElements.results.style.display = 'none';
                        DOMElements.error.style.display = 'block';
                        DOMElements.error.querySelector('p').textContent = chrome.runtime.lastError?.message || "Failed to retrieve page data. The page might be restricted or too complex.";
                        return;
                    }
                    
                    DOMElements.results.style.display = 'grid';
                    const analysis = injectionResults[0].result;

                    if (!analysis) {
                        console.error("Analysis data is null or undefined.");
                        DOMElements.results.style.display = 'none';
                        DOMElements.error.style.display = 'block';
                        DOMElements.error.querySelector('p').textContent = "Analysis script returned no data. The page might not have analyzable content.";
                        return;
                    }

                    // Set the page title
                    if (DOMElements.pageTitle) { // Check if element exists
                        const titleText = escapeHtml(analysis.pageTitle) || 'No title available';
                        DOMElements.pageTitle.textContent = titleText;
                        DOMElements.pageTitle.title = titleText; // For tooltip if text is truncated
                    }

                    // Display the requested lists
                    displayList(DOMElements.fontColorsList, analysis.fontColors, true);
                    displayList(DOMElements.backgroundColorsList, analysis.backgroundColors, true);
                    displayList(DOMElements.fontFamiliesList, analysis.fontFamilies);
                }
            );
        } else {
            DOMElements.loading.style.display = 'none';
            DOMElements.results.style.display = 'none';
            DOMElements.error.style.display = 'block';
            DOMElements.error.querySelector('p').textContent = "Could not get active tab information.";
            console.error("Could not get active tab information.");
        }
    });
});