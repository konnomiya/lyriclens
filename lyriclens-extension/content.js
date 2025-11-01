// content.js - LyricLens (Stable version)

console.log('🎵 LyricLens activated - Stable version');

const CONFIG = {
    mode: 'generic', // 'demo' or 'generic'
    demoVideoId: 'dIOjs3YRT_U',
    demoWords: ['強く', '連れて', '進め', '簡単に', '守れなかった', '夢も'],
    maxWordsPerLine: 4, // Maximum highlighted words per line in generic mode
    minWordLength: 2    // Minimum word length
};

// Vocabulary book management after configuration
const VOCAB_BOOK = {
    saveWord: function(word, translation, context) {
        const saved = JSON.parse(localStorage.getItem('lyriclens_vocab') || '{}');
        saved[word] = { 
            translation, 
            context,
            savedAt: new Date().toISOString(),
            reviewCount: 0
        };
        localStorage.setItem('lyriclens_vocab', JSON.stringify(saved));
        LEARNING_STATS.trackWord(word);
    },
    
    getSavedWords: function() {
        return JSON.parse(localStorage.getItem('lyriclens_vocab') || '{}');
    },
    
    removeWord: function(word) {
        const saved = this.getSavedWords();
        delete saved[word];
        localStorage.setItem('lyriclens_vocab', JSON.stringify(saved));
    },
    
    getWordCount: function() {
        return Object.keys(this.getSavedWords()).length;
    }
};

// Function to show vocabulary book
function showVocabBook() {
    // First close any existing old popup
    hideVocabBook();
    
    const savedWords = VOCAB_BOOK.getSavedWords();
    const wordCount = VOCAB_BOOK.getWordCount();
    
    const vocabModal = document.createElement('div');
    vocabModal.id = 'lyriclens-vocab-modal';
    vocabModal.innerHTML = `
        <div class="lyriclens-vocab-content">
            <div class="lyriclens-vocab-header">
                <h3>📚 My Vocabulary Book (${wordCount} words)</h3>
                <button class="lyriclens-close-vocab">&times;</button>
            </div>
            <div class="lyriclens-vocab-list">
                ${Object.entries(savedWords).map(([word, data]) => `
                    <div class="lyriclens-vocab-item">
                        <div class="vocab-word">${word}</div>
                        <div class="vocab-meaning">${data.translation}</div>
                        <div class="vocab-context">${data.context}</div>
                        <div class="vocab-date">Saved:  ${new Date(data.savedAt).toLocaleDateString()}</div>
                        <button class="vocab-remove-btn" data-word="${word}">Delete</button>
                    </div>
                `).join('') || '<p class="vocab-empty">No words saved yet～</p>'}
            </div>
            <div class="lyriclens-vocab-actions">
                <button class="vocab-export-btn">Export Vocabulary</button>
                <button class="vocab-close-btn">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(vocabModal);
    bindVocabModalEvents(vocabModal);
}

function bindVocabModalEvents(modal) {
    // Close button
    modal.querySelector('.lyriclens-close-vocab').addEventListener('click', hideVocabBook);
    modal.querySelector('.vocab-close-btn').addEventListener('click', hideVocabBook);
    
    // Export button
    modal.querySelector('.vocab-export-btn').addEventListener('click', exportVocabData);
    
    // Delete button 
    modal.querySelectorAll('.vocab-remove-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const word = this.getAttribute('data-word');
            VOCAB_BOOK.removeWord(word);
            
            // Only update content, don't create new popup
            refreshVocabContent(modal);
        });
    });
    
    // Click background to close
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            hideVocabBook();
        }
    });
}

// Refresh content only
function refreshVocabContent(modal) {
    const savedWords = VOCAB_BOOK.getSavedWords();
    const wordCount = VOCAB_BOOK.getWordCount();
    
    // Update header
    const header = modal.querySelector('.lyriclens-vocab-header h3');
    header.textContent = `📚 My Vocabulary Book (${wordCount} words)`;
    
    // Update vocabulary list
    const vocabList = modal.querySelector('.lyriclens-vocab-list');
    vocabList.innerHTML = Object.entries(savedWords).map(([word, data]) => `
        <div class="lyriclens-vocab-item">
            <div class="vocab-word">${word}</div>
            <div class="vocab-meaning">${data.translation}</div>
            <div class="vocab-context">${data.context}</div>
            <div class="vocab-date">Saved: ${new Date(data.savedAt).toLocaleDateString()}</div>
            <button class="vocab-remove-btn" data-word="${word}">Delete</button>
        </div>
    `).join('') || '<p class="vocab-empty">No words saved yet～</p>';
    
    // Rebind delete button events
    vocabList.querySelectorAll('.vocab-remove-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const word = this.getAttribute('data-word');
            VOCAB_BOOK.removeWord(word);
            refreshVocabContent(modal);
        });
    });
}

function hideVocabBook() {
    const modal = document.getElementById('lyriclens-vocab-modal');
    if (modal) modal.remove();
}

function exportVocabData() {
    const savedWords = VOCAB_BOOK.getSavedWords();
    const dataStr = JSON.stringify(savedWords, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lyriclens_vocab_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Cache system - enhanced cache
let translationCache = {};
let segmentationCache = {}; // New segmentation cache
let processedContainers = new Set(); // Track processed containers

// Learning statistics
const LEARNING_STATS = {
    sessionWords: new Set(),
    
    trackWord: function(word) {
        this.sessionWords.add(word);
    },
    
    getStats: function() {
        return {
            sessionWords: this.sessionWords.size || 0  // Numeric
        };
    }
};

// Main initialization
function init() {
    if (!isYouTubeVideo()) {
        console.log('LyricLens: Not on YouTube');
        return;
    }

    if (CONFIG.mode === 'demo' && !isTargetVideo()) {
        console.log('LyricLens: Not target video');
        return;
    }

    console.log('LyricLens: Starting subtitle observation');
    startImprovedObservation();
}

// Basic checks
function isYouTubeVideo() {
    return window.location.hostname.includes('youtube.com');
}

function isTargetVideo() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v') === CONFIG.demoVideoId;
}

// Improved subtitle observation
function startImprovedObservation() {
    let observer;
    
    const observeSubtitles = () => {
        // Clean up old observer
        if (observer) {
            observer.disconnect();
        }
        
        // Reset processing state to allow reprocessing
        processedContainers.clear();
        
        observer = new MutationObserver((mutations) => {
            let shouldProcess = false;
            
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    // Check if it's a subtitle container or contains subtitle container
                    if (node.nodeType === 1) {
                        if (node.classList?.contains('ytp-caption-segment')) {
                            shouldProcess = true;
                        } else if (node.querySelector('.ytp-caption-segment')) {
                            shouldProcess = true;
                        }
                    }
                });
            });
            
            if (shouldProcess) {
                processAllSubtitles();
            }
        });

        // Observe the entire document body for changes
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    // Initial observation
    observeSubtitles();
    
    // Listen for video seek events
    const video = document.querySelector('video');
    if (video) {
        video.addEventListener('seeked', () => {
            console.log('LyricLens: Video seek detected, resetting processing');
            processedContainers.clear();
            setTimeout(processAllSubtitles, 500); // Delay processing to ensure new subtitles load
        });
    }

    // Initial processing
    setTimeout(processAllSubtitles, 2000);
    
    // Periodic check for new subtitles (backup solution)
    setInterval(() => {
        processAllSubtitles();
    }, 3000);
}

// Improved function to process all subtitles
function processAllSubtitles() {
    const subtitleContainers = document.querySelectorAll('.ytp-caption-segment');
    console.log(`LyricLens: Found ${subtitleContainers.length} subtitle containers`);
    
    subtitleContainers.forEach(container => {
        if (!processedContainers.has(container)) {
            processSimpleSubtitles(container);
            processedContainers.add(container);
        }
    });
}

// Improved highlight function - add stricter checks
function highlightWordsInContainer(container, wordsToHighlight) {
    // Defensive check
    if (!wordsToHighlight || !Array.isArray(wordsToHighlight)) {
        console.warn('LyricLens: wordsToHighlight is not an array:', wordsToHighlight);
        return;
    }
    
    // Filter out empty values
    const validWords = wordsToHighlight.filter(word => word && word.trim());
    if (validWords.length === 0) {
        console.log('LyricLens: No valid words to highlight');
        return;
    }
    
    let html = container.innerHTML;
    let highlighted = false;
    
   // Replace each word to highlight
    validWords.forEach(word => {
        const regex = new RegExp(escapeRegExp(word), 'g');
        // Check if already highlighted to avoid duplicate highlighting
        if (!html.includes(`data-word="${word}"`)) {
            const highlightedWord = `<span class="lyriclens-highlight" data-word="${word}">${word}</span>`;
            html = html.replace(regex, highlightedWord);
            highlighted = true;
        }
    });
    
    if (highlighted) {
        container.innerHTML = html;
        attachSimpleHoverEvents();
        console.log('LyricLens: Highlighted words in container:', validWords);
    }
}

// Improved subtitle processing function
async function processSimpleSubtitles(container) {
    // Use more reliable identification method
    if (container.hasAttribute('data-lyriclens-processed')) {
        return;
    }
    
    container.setAttribute('data-lyriclens-processed', 'true');
    
    const text = container.textContent.trim();
    if (!text) {
        console.log('LyricLens: Empty subtitle text');
        return;
    }
    
    console.log('LyricLens: Processing subtitle:', text.substring(0, 50) + '...');
    
    let wordsToHighlight;
    
    if (CONFIG.mode === 'demo' && isTargetVideo()) {
        // Demo mode: use preset vocabulary
        wordsToHighlight = CONFIG.demoWords;
        console.log('LyricLens: Using demo words:', wordsToHighlight);
    } else {
        // Generic mode: auto-detect vocabulary - use cache
        wordsToHighlight = await getAutoDetectedWords(text);
        console.log('LyricLens: Using auto-detected words:', wordsToHighlight);
    }
    
    highlightWordsInContainer(container, wordsToHighlight);
}


// Improved auto word detection - add cache
async function getAutoDetectedWords(text) {
    // Generate cache key
    const cacheKey = text.trim().toLowerCase();
    
    // Check cache
    if (segmentationCache[cacheKey]) {
        console.log('LyricLens: Using cached segmentation for:', cacheKey);
        return segmentationCache[cacheKey];
    }
    
    try {
        const segments = await aiSegmentJapanese(text);
        const filtered = filterLearningWords(segments);
        
        // Cache result
        segmentationCache[cacheKey] = filtered;
        
        // Limit cache size
        if (Object.keys(segmentationCache).length > 50) {
            const keys = Object.keys(segmentationCache);
            delete segmentationCache[keys[0]];
        }
        
        return filtered;
    } catch (error) {
        console.log('LyricLens: AI segmentation failed, using fallback', error);
        const fallback = getFallbackWords(text);
        segmentationCache[cacheKey] = fallback; // Cache fallback result
        return fallback;
    }
}


// Fallback word segmentation (when auto segmentation fails)
function getFallbackWords(text) {
    // Simple segmentation by spaces and common separators
    const words = text.split(/[\sはがをにでと]+/)
        .filter(word => isMeaningfulWord(word))
        .slice(0, CONFIG.maxWordsPerLine);
    
    console.log('LyricLens: Using fallback words:', words);
    return words;
}

// Escape regex characterss
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Simple hover events
function attachSimpleHoverEvents() {
    document.querySelectorAll('.lyriclens-highlight').forEach(element => {
        // Remove existing events to avoid duplicate binding
        element.replaceWith(element.cloneNode(true));
    });

    // Rebind events
    document.querySelectorAll('.lyriclens-highlight').forEach(element => {
        element.addEventListener('mouseenter', handleSimpleMouseEnter);
        element.addEventListener('mouseleave', handleSimpleMouseLeave);
    });
}

let cardCloseTimer = null;

// Updated mouse hover handling
function handleSimpleMouseEnter(e) {
    if (cardCloseTimer) {
        clearTimeout(cardCloseTimer);
        cardCloseTimer = null;
    }
    
    const word = this.getAttribute('data-word');
    const card = showSimpleCard(word, e.clientX, e.clientY);
    
    if (card) {
        // Add mouse events to the card itself to extend hover area
        card.addEventListener('mouseenter', () => {
            if (cardCloseTimer) {
                clearTimeout(cardCloseTimer);
                cardCloseTimer = null;
            }
        });
        
        card.addEventListener('mouseleave', () => {
            // Delay closing when leaving the card itself
            cardCloseTimer = setTimeout(() => {
                hideSimpleCard();
            }, 1000);
        });
        
        showEnhancedTranslation(card, word);
    }
}

function handleSimpleMouseLeave() {
    // Delay closing (2 seconds)
    cardCloseTimer = setTimeout(() => {
        hideSimpleCard();
    }, 2000);
}

// Simplified card display 
function showSimpleCard(word, mouseX, mouseY) {
    const existingCard = document.getElementById('lyriclens-card');
    if (existingCard) existingCard.remove();

    const card = document.createElement('div');
    card.id = 'lyriclens-card';
    card.innerHTML = `
        <div class="lyriclens-card-header">
            <span class="lyriclens-word">${word}</span>
            <button class="lyriclens-close">&times;</button>
        </div>
        <div class="lyriclens-content">
            <div class="lyriclens-loading">
                <div class="loading-spinner"></div>
                Loading...
            </div>
        </div>
    `;

    document.body.appendChild(card);
    positionSimpleCard(card, mouseX, mouseY);
    
    card.querySelector('.lyriclens-close').addEventListener('click', hideSimpleCard);
    
    return card;
}

// Position card
function positionSimpleCard(card, mouseX, mouseY) {
    const rect = card.getBoundingClientRect();
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    
    let left = mouseX + 10;
    let top = mouseY + 10;

    if (left + rect.width > viewport.width - 10) left = mouseX - rect.width - 10;
    if (top + rect.height > viewport.height - 10) top = mouseY - rect.height - 10;

    card.style.left = left + 'px';
    card.style.top = top + 'px';
}

// Get translation with cache
function getCachedTranslation(word) {
    if (translationCache[word]) {
        console.log('LyricLens: Using cached translation for:', word);
        return translationCache[word];
    }
    
    const translation = getPresetTranslation(word);
    translationCache[word] = translation;
    return translation;
}

// Basic AI translation attempt - Translator API
async function tryAITranslation(word) {
    try {
        console.log('LyricLens: Trying AI translation for:', word);
        
        // Check if API is available
        if (typeof Translator === 'undefined' || typeof Translator === 'undefined') {
            throw new Error('AI API not available');
        }
        
        // Create translator
        const translator = await Translator.create({
            sourceLanguage: 'ja',
            targetLanguage: 'en'
        });
        
        // Execute translation
        const result = await translator.translate(word);
        console.log('LyricLens: AI translation result:', result);
        
        return {
            meaning: result,
            grammar: inferGrammarFromWord(word),
            context: 'AI translation from lyrics',
            source: 'ai'
        };
        
    } catch (error) {
        console.log('LyricLens: AI translation failed, using preset');
        return null; // Return null to indicate failure
    }
}

// Infer grammar from word
function inferGrammarFromWord(word) {
    if (word.endsWith('く')) return 'Adverb';
    if (word.endsWith('て')) return 'Verb (te-form)';
    if (word.endsWith('め')) return 'Verb (imperative)';
    if (word.endsWith('に')) return 'Adverb';
    if (word.includes('なかった')) return 'Verb (past negative)';
    if (word.endsWith('も')) return 'Noun + Particle';

    // 可以补充一些常见模式
    if (word.endsWith('たい')) return 'Verb (desire form)';
    if (word.endsWith('られる')) return 'Verb (potential/passive)';
    if (word.endsWith('させる')) return 'Verb (causative)';
    if (word.endsWith('そう')) return 'Adjective (seems like)';

    return 'Japanese word';
}

// Complete AI enhanced translation process
async function getFullAITranslation(word) {
    try {
        console.log('LyricLens: Starting full AI translation for:', word);
        
        // 1. First get basic translation
        const basicTranslation = await tryAITranslation(word);
        if (!basicTranslation) {
            throw new Error('Basic translation failed');
        }
        
        // 2. Then enhance with Prompt API
        const enhanced = await enhanceWithPromptAPI(word, basicTranslation.meaning);
        
        if (enhanced) {
            return {
                meaning: enhanced.natural_translation,
                grammar: enhanced.grammar_explanation,
                context: enhanced.context_meaning,
                source: 'full_ai'
            };
        } else {
            // Prompt API failed, return basic translation
            return basicTranslation;
        }
        
    } catch (error) {
        console.log('LyricLens: Full AI translation failed:', error);
        return null;
    }
}

// Improved translation display function - add complete cache
async function showEnhancedTranslation(card, word) {
    const content = card.querySelector('.lyriclens-content');
    if (!content) return;

    // Immediately display cached content (if exists)
    if (translationCache[word]) {
        const cached = translationCache[word];
        showCachedContent(content, word, cached);
        return;
    }

    // Display loading state
    const modeInfo = CONFIG.mode === 'generic' ? 
        '<div class="lyriclens-mode-badge">Auto Detection</div>' : 
        '<div class="lyriclens-mode-badge">Demo Mode</div>';

    content.innerHTML = `
        <div class="lyriclens-loading">
            <div class="loading-spinner"></div>
            <div class="loading-steps">
                <div class="loading-step">Analyzing "${word}"...</div>
            </div>
            ${modeInfo}
        </div>
    `;

    // Demo mode skip AI processing for quick UI overview
    if (CONFIG.mode === 'demo') {
        const preset = getPresetTranslation(word);
        translationCache[word] = {
            ...preset,
            timestamp: Date.now(),
            source: 'preset'
        };
        showPresetContent(content, word);
        return; 
    }

    try {
        // Try complete AI process
        const fullTranslation = await getFullAITranslation(word);
        
        if (fullTranslation) {
            // Cache AI result
            translationCache[word] = {
                ...fullTranslation,
                timestamp: Date.now()
            };
            showAIContent(content, word, fullTranslation);
        } else {
            // Complete AI failed, try basic AI
            const basicAITranslation = await tryAITranslation(word);
            
            if (basicAITranslation) {
                // Cache basic AI result
                translationCache[word] = {
                    ...basicAITranslation,
                    timestamp: Date.now()
                };
                showAIContent(content, word, basicAITranslation);
            } else {
                // All AI failed, use preset
                const preset = getPresetTranslation(word);
                translationCache[word] = {
                    ...preset,
                    timestamp: Date.now(),
                    source: 'preset'
                };
                showPresetContent(content, word);
            }
        }
        
    } catch (error) {
        console.log('LyricLens: Translation process failed:', error);
        const preset = getPresetTranslation(word);
        translationCache[word] = {
            ...preset,
            timestamp: Date.now(),
            source: 'preset'
        };
        showPresetContent(content, word);
    }
    // Clean expired cache (24 hours)
    cleanupExpiredCache();
}

// Unified display function
function showTranslationResult(content, word, translationData, badgeType, badgeText) {
    updateProgressDisplay(content); // Use unified update function
    
    content.innerHTML = `
        <div class="lyriclens-meaning">${translationData.meaning}</div>
        <div class="lyriclens-details">
            <div class="lyriclens-grammar">${translationData.grammar}</div>
            <div class="lyriclens-context">${translationData.context}</div>
            <div class="lyriclens-progress">
                <small id="progress-text">Loading...</small>
            </div>
            <div class="${badgeType}">${badgeText}</div>
        </div>
        <div class="lyriclens-actions">
            <button class="save-word-btn">💾 Save Word</button>
            <button class="view-vocab-btn">📚 View Vocabulary</button>
        </div>
    `;
    
    // Immediately update display
    updateProgressDisplay(content);
    
    bindTranslationActions(content, word, translationData);
}

// Specifically update progress display
function updateProgressDisplay(content) {
    const stats = LEARNING_STATS.getStats();
    const wordCount = VOCAB_BOOK.getWordCount();

    const sessionWords = stats.sessionWords || 0;
    const progressText = `Learned ${sessionWords} word(s) this session | Saved ${wordCount} word(s)`;
    
    const progressElement = content.querySelector('.lyriclens-progress small');
    if (progressElement) {
        progressElement.textContent = progressText;
    }
}

// Event binding
function bindTranslationActions(content, word, translationData) {
    const saveBtn = content.querySelector('.save-word-btn');
    const viewVocabBtn = content.querySelector('.view-vocab-btn');
    
    // Check if already saved
    const savedWords = VOCAB_BOOK.getSavedWords();
    if (savedWords[word]) {
        saveBtn.textContent = '✅ Saved';
        saveBtn.disabled = true;
    }
    
    saveBtn.addEventListener('click', () => {
        VOCAB_BOOK.saveWord(word, translationData.meaning, translationData.context);
        LEARNING_STATS.trackWord(word);
        
        saveBtn.textContent = '✅ Saved';
        saveBtn.disabled = true;
        
        // Use unified update function
        updateProgressDisplay(content);
    });
    
    viewVocabBtn.addEventListener('click', showVocabBook);
}

function showAIContent(content, word, translation) {
    const badgeType = translation.source === 'full_ai' ? 'lyriclens-badge lyriclens-ai-enhanced-badge' : 'lyriclens-badge lyriclens-ai-badge';
    const badgeText = translation.source === 'full_ai' ? 'AI Enhanced' : 'AI Translation';
    
    showTranslationResult(content, word, translation, badgeType, badgeText);
}

function showPresetContent(content, word) {
    const preset = getCachedTranslation(word);
    showTranslationResult(content, word, preset, 'lyriclens-badge lyriclens-preset-badge', 'Preset Data');
}

function showCachedContent(content, word, cachedData) {
    let badgeType, badgeText;
    
    if (cachedData.source === 'full_ai') {
        badgeType = 'lyriclens-badge lyriclens-ai-enhanced-badge';
        badgeText = 'AI Enhanced';
    } else if (cachedData.source === 'ai') {
        badgeType = 'lyriclens-badge lyriclens-ai-badge';
        badgeText = 'AI Analysis';
    } else {
        badgeType = 'lyriclens-badge lyriclens-cache-badge';
        badgeText = 'Cached Data';
    }
    
    showTranslationResult(content, word, cachedData, badgeType, badgeText);
    console.log('LyricLens: Using cached translation for:', word);
}

// Updated showSimpleTranslation function
function showSimpleTranslation(card, word) {
    const content = card.querySelector('.lyriclens-content');
    if (!content) return;

    // Use cache
    const translation = getCachedTranslation(word);
    
    // Display immediately (simulate fast response)
    setTimeout(() => {
        if (document.body.contains(card)) {
            content.innerHTML = `
                <div class="lyriclens-meaning">${translation.meaning}</div>
                <div class="lyriclens-details">
                    <div class="lyriclens-grammar">${translation.grammar}</div>
                    <div class="lyriclens-context">${translation.context}</div>
                    <div class="lyriclens-cache-badge">Cached</div>
                </div>
            `;
        }
    }, 300); // Shorter delay to demonstrate cache advantage
}

// Use Prompt API to enhance translation results
async function enhanceWithPromptAPI(word, basicTranslation) {
    try {
        console.log('LyricLens: Enhancing with Prompt API for:', word);
        
        const session = await LanguageModel.create();
        
        const result = await session.prompt(
            `Japanese word: "${word}"
Basic translation: "${basicTranslation}"  
Context: Japanese song lyrics, like Anime song, JPop, etc.

Provide analysis in VALID JSON format only:
{
    "natural_translation": "single natural English translation",
    "grammar_explanation": "brief grammar note", 
    "context_meaning": "meaning in song context"
}

CRITICAL REQUIREMENTS:
- Return ONLY the JSON object, nothing else
- No additional text before or after the JSON
- No code blocks or markdown formatting
- Ensure all quotes are properly closed
- No trailing commas
- Valid JSON syntax only`
        );
        
        console.log('LyricLens: Prompt API raw result:', result);
        return parsePromptResult(result, basicTranslation);
        
    } catch (error) {
        console.log('LyricLens: Prompt API enhancement failed:', error);
        return null;
    }
}

// Specifically fix translation field JSON issues
function fixTranslationField(jsonString) {
    return jsonString
        // Fix: multiple translations separated by spaces "word1" "word2" "word3"
        .replace(/"natural_translation":\s*"([^"]*(?:"\s*"[^"]*)*)"/g, (match, translations) => {
            // If multiple quoted translations found
            if (translations.match(/"[^"]*"\s*"[^"]*"/)) {
                const translationArray = translations.match(/"[^"]*"/g)
                    .map(t => t.replace(/^"|"$/g, '').trim())
                    .filter(t => t.length > 0);
                return `"natural_translation": ${JSON.stringify(translationArray)}`;
            }
            return match;
        })
        // Fix: multiple comma-separated translations without array "word1", "word2", "word3"
        .replace(/"natural_translation":\s*"([^"]*(?:",\s*"[^"]*)*)"/g, (match, translations) => {
            if (translations.includes('", "')) {
                const translationArray = translations.split(/",\s*"/)
                    .map(t => t.trim().replace(/^"|"$/g, ''))
                    .filter(t => t.length > 0);
                return `"natural_translation": ${JSON.stringify(translationArray)}`;
            }
            return match;
        })
        // Fix: multiple comma-separated words "word1, word2, word3"
        .replace(/"natural_translation":\s*"([^"]*)"/g, (match, translation) => {
            if (translation.includes(',') && translation.split(',').length > 2) {
                const translationArray = translation.split(',')
                    .map(t => t.trim().replace(/^"|"$/g, ''))
                    .filter(t => t.length > 0);
                return `"natural_translation": ${JSON.stringify(translationArray)}`;
            }
            return match;
        });
}

// Natural language parsing as backup
function parseNaturalLanguageResult(result, fallbackTranslation, originalWord) {
    const lines = result.split('\n').map(line => line.trim()).filter(line => line);
    
    let translation = fallbackTranslation;
    let grammar = inferGrammarFromWord(originalWord);
    let context = 'From song lyrics';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();
        
        // Find translation
        if ((lowerLine.includes('translation') || lowerLine.includes('meaning')) && 
            !lowerLine.includes('grammar') && !lowerLine.includes('context')) {
            // Try to extract from current line
            const parts = line.split(/[：:]/);
            if (parts.length > 1) {
                let extracted = parts[1].trim().replace(/^["']|["']$/g, '');
                // Choose the first one
                if (extracted.includes(',') || extracted.includes('"')) {
                    extracted = extracted.split(/[,"]/)[0].trim();
                }
                translation = extracted || translation;
            } 
            // Or extract from next line
            else if (i + 1 < lines.length && !lines[i + 1].includes(':') && !lines[i + 1].includes('grammar') && !lines[i + 1].includes('context')) {
                let extracted = lines[i + 1].trim().replace(/^["']|["']$/g, '');
                if (extracted.includes(',') || extracted.includes('"')) {
                    extracted = extracted.split(/[,"]/)[0].trim();
                }
                translation = extracted || translation;
            }
        }
        
        // Find grammar explanation
        if (lowerLine.includes('grammar') || lowerLine.includes('form') || lowerLine.includes('verb') || lowerLine.includes('particle')) {
            const parts = line.split(/[：:]/);
            if (parts.length > 1) {
                grammar = parts[1].trim();
            }
        }
        
        // Find context meaning
        if (lowerLine.includes('context') || lowerLine.includes('song') || lowerLine.includes('lyric') || lowerLine.includes('anime')) {
            const parts = line.split(/[：:]/);
            if (parts.length > 1) {
                context = parts[1].trim();
            }
        }
    }
    
    return {
        natural_translation: translation,
        grammar_explanation: grammar,
        context_meaning: context,
        source: 'prompt_text_fallback'
    };
}

function formatTranslation(translation) {
    if (!translation) return null;
    
    if (Array.isArray(translation)) {
        // If array, take first meaningful translation
        return translation.find(t => t && t.trim().length > 0) || translation[0];
    }
    
    if (typeof translation === 'string') {
        // If string, clean and return
        return translation.trim();
    }
    
    return String(translation);
}

// Improved JSON cleaning function
function fixJsonFormat(jsonString) {
    return jsonString
        // Remove extra quotes at beginning and end
        .replace(/^\"|\"$/g, '')
        // Fix: extra characters at end of object
        .replace(/\}\s*\"\s*$/, '}')
        // Fix: extra characters at beginning of object 
        .replace(/^\s*\"\s*\{/, '{')
        // Ensure braces match
        .replace(/^[^{]*\{/, '{')
        .replace(/\}[^}]*$/, '}')
        // Remove possible extra content
        .replace(/\}\s*[^}\s]*$/, '}');
}

// Update parsePromptResult function
function parsePromptResult(result, fallbackTranslation, originalWord = '') {
    try {
        console.log('LyricLens: Parsing prompt result for word:', originalWord);
        
        if (!result || typeof result !== 'string') {
            console.log('LyricLens: Invalid result, using fallback');
            return createFallbackResponse(fallbackTranslation, originalWord);
        }
        
        // First clean and fix
        let cleanedResult = result
            .replace(/^```json\s*/, '')
            .replace(/\s*```$/, '')
            .trim();

        console.log('LyricLens: Initial cleaned result:', cleanedResult);

        // Specifically fix JSON format issues
        cleanedResult = fixJsonFormat(cleanedResult);
        
        // Fix translation field
        cleanedResult = fixTranslationField(cleanedResult);
        
        // Fix other common JSON errors
        cleanedResult = cleanedResult
            // Fix trailing commas
            .replace(/,\s*\n\s*}/g, '\n}')
            // Fix missing commas
            .replace(/"\s*\n\s*"/g, '",\n"')
            // Ensure strings properly closed
            .replace(/"([^"]*)$/, '"$1"')
            // Remove extra characters outside object
            .replace(/^[^{]*/, '')
            .replace(/[^}]*$/, '');

        console.log('LyricLens: Final cleaned result:', cleanedResult);

        // Check if still has valid JSON structure
        if (!cleanedResult.trim().startsWith('{') || !cleanedResult.trim().endsWith('}')) {
            console.log('LyricLens: No valid JSON structure found, using natural language parsing');
            return parseNaturalLanguageResult(result, fallbackTranslation, originalWord);
        }
        
        // Try to parse fixed JSON
        try {
            const parsed = JSON.parse(cleanedResult);
            return {
                natural_translation: formatTranslation(parsed.natural_translation) || fallbackTranslation,
                grammar_explanation: parsed.grammar_explanation || parsed.grammar || inferGrammarFromWord(originalWord),
                context_meaning: parsed.context_meaning || parsed.context || 'From song lyrics',
                source: 'prompt_enhanced'
            };
        } catch (e) {
            console.log('LyricLens: JSON parse failed, trying natural language parsing. Error:', e.message);
            console.log('LyricLens: Problematic JSON:', cleanedResult);
            return parseNaturalLanguageResult(result, fallbackTranslation, originalWord);
        }
        
    } catch (error) {
        console.error('LyricLens: Failed to parse prompt result:', error);
        return createFallbackResponse(fallbackTranslation, originalWord);
    }
}

// Create fallback response
function createFallbackResponse(fallbackTranslation, originalWord) {
    return {
        natural_translation: fallbackTranslation,
        grammar_explanation: inferGrammarFromWord(originalWord),
        context_meaning: 'From song lyrics',
        source: 'fallback'
    };
}

// Hide card
function hideSimpleCard() {
    const card = document.getElementById('lyriclens-card');
    if (card) card.remove();
}

// Clean expired cache
function cleanupExpiredCache() {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    Object.keys(translationCache).forEach(word => {
        if (now - translationCache[word].timestamp > twentyFourHours) {
            delete translationCache[word];
        }
    });
}

// Check if word is meaningful
function isMeaningfulWord(word) {
    if (word.length < CONFIG.minWordLength) return false;
    
    // Exclude very common particles and conjunctions
    const basicWords = ['は', 'が', 'を', 'に', 'で', 'と', 'の', 'も', 'や', 'か', 'ば', 'へ', 'から', 'まで', 'より','です', 'ます', 'だ', 'である'];
    if (basicWords.includes(word)) return false;
    
    // Exclude numbers
    if (/^\d+$/.test(word)) return false;
    
    // Exclude symbols
    if (/^[!?。、・…]+$/.test(word)) return false;
    
    return true;
}

// Filter learning words
function filterLearningWords(words) {
    const scoredWords = words.map(word => ({
        word: word,
        score: calculateWordScore(word)
    }));
    
    // Top K based on score
    const topWords = scoredWords
        .sort((a, b) => b.score - a.score)
        .slice(0, CONFIG.maxWordsPerLine)
        .map(item => item.word);
    
    console.log('LyricLens: Filtered learning words:', topWords);
    return topWords;
}

// AI segmentation function - Prompt API
async function aiSegmentJapanese(text) {
    try {
        console.log('LyricLens: Using AI for segmentation');

        // Check if API is available
        if (typeof LanguageModel === 'undefined') {
            throw new Error('LanguageModel API not available');
        }
            
        const session = await LanguageModel.create();
        
        const result = await session.prompt(
            `Segment this Japanese text into individual vocabulary words for language learning:\n"${text}"\n\n` +
            `CRITICAL: Ensure accurate segmentation for language learning:\n` +
            `Focus on words that are useful for learners (nouns, verbs, adjectives, important particles).\n` +
            `Return as a JSON array of strings.\n` +
            `Example: ["言葉", "勉強", "する", "楽しい"]` +
            `Do not include any explanations or additional text.`
        );
        
        console.log('LyricLens: AI segmentation raw result:', result);
        return parseAISegmentationResult(result);
        
    } catch (error) {
        console.log('LyricLens: AI segmentation failed:', error);
        return getFallbackWords(text);
    }
}

// Parse segmentation result
function parseAISegmentationResult(result) {
    try {
        // Try to extract JSON array
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed)) {
                return parsed.filter(word => word && word.trim().length > 0);
            }
        }
        
        // If it is not a valid JSON, split lines
        const lines = result.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('[') && !line.startsWith('{'));
        
        return lines.slice(0, CONFIG.maxWordsPerLine);
        
    } catch (error) {
        console.log('LyricLens: Failed to parse AI segmentation result');
        return getFallbackWords(text);
    }
}

// Preset translation data
function getPresetTranslation(word) {
    const translations = {
        '強く': {
            meaning: 'strongly, powerfully',
            grammar: 'Adverb',
            context: 'Expressing determination in lyrics'
        },
        '連れて': {
            meaning: 'take along, bring with',
            grammar: 'Verb (te-form)',
            context: 'Asking to journey together'
        },
        '進め': {
            meaning: 'advance, move forward',
            grammar: 'Verb (imperative)',
            context: 'Encouragement to keep going'
        },
        '簡単に': {
            meaning: 'easily, simply',
            grammar: 'Adverb',
            context: 'Describing something done without difficulty'
        },
        '守れなかった': {
            meaning: "couldn't protect",
            grammar: 'Verb (past negative)',
            context: 'Expressing regret over failure'
        },
        '夢も': {
            meaning: 'even dreams',
            grammar: 'Noun + Particle',
            context: 'Including dreams among what was lost'
        }
    };
    
    return translations[word] || {
        meaning: word,
        grammar: 'Japanese word',
        context: 'From song lyrics'
    };
}

// Score word for learning
function calculateWordScore(word) {
    let score = 0;
    
    // Length score: Assume that phrases/words in moderate length are more helpful
    if (word.length >= 2 && word.length <= 4) score += 2;
    else if (word.length > 4) score += 1;
    
    // Kanji score
    const kanjiCount = (word.match(/\p{Script=Han}/gu) || []).length;
    score += kanjiCount * 3;
    
    // Katakana score (foreign words)
    if (isKatakana(word)) score += 2;
    
    // Verb
    if (isLikelyVerb(word)) score += 2;
    
    // Adjective
    if (isLikelyAdjective(word)) score += 2;
    
    // Avoid common conjunctions
    const commonParticles = ['は', 'が', 'を', 'に', 'で', 'と', 'の', 'も'];
    if (commonParticles.includes(word)) score -= 5;
    
    return Math.max(score, 0);
}

function isKatakana(text) {
    return /^[\u30A0-\u30FF]+$/.test(text);
}

// Check if it is verb
function isLikelyVerb(word) {
    const verbEndings = ['る', 'う', 'く', 'ぐ', 'す', 'つ', 'ぬ', 'ぶ', 'む'];
    return verbEndings.some(ending => word.endsWith(ending));
}

// Check if it is adjective
function isLikelyAdjective(word) {
    return word.endsWith('い') || word.endsWith('な');
}

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}