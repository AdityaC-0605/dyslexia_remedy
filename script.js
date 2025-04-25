// Sample text passage
const sampleText = "The sun is bright in the sky. Birds fly high above the trees. Children play in the park. They run and laugh together. The grass is green and soft. Flowers bloom in the garden. A cat sleeps on the wall. The wind blows gently. It is a beautiful day.";

// DOM Elements
const textContainer = document.getElementById('textContainer');
const startButton = document.getElementById('startReading');
const stopButton = document.getElementById('stopReading');
const statusMessage = document.getElementById('statusMessage');
const wordCount = document.getElementById('wordCount');
const remedySuggestions = document.getElementById('remedySuggestions');
const decreaseFontBtn = document.getElementById('decreaseFont');
const increaseFontBtn = document.getElementById('increaseFont');
const whiteBgBtn = document.getElementById('whiteBg');
const grayBgBtn = document.getElementById('grayBg');
const beigeBgBtn = document.getElementById('beigeBg');

// Speech Recognition Setup
let recognition;
let isListening = false;
let currentWordIndex = 0;
let words = [];
let isFirstWord = true;
let lastSpokenWord = '';
let spokenWords = [];
let recognitionTimeout;
let lastProcessedTime = 0;
const MIN_TIME_BETWEEN_WORDS = 300; // Minimum time between processing words (ms)

// Initialize the text display
function initializeText() {
    words = sampleText.split(' ');
    textContainer.innerHTML = words.map((word, index) => 
        `<span class="word" data-index="${index}">${word}</span>`
    ).join(' ');
    updateWordCount();
    // Highlight the first word when the page loads
    if (words.length > 0) {
        const firstWord = document.querySelector('.word[data-index="0"]');
        firstWord.classList.add('active');
    }
}

// Update word count display
function updateWordCount() {
    const correctWords = document.querySelectorAll('.word.correct').length;
    wordCount.textContent = `Words read: ${correctWords}/${words.length}`;
}

// Mark all remaining words as incorrect
function markRemainingWordsAsIncorrect() {
    const wordElements = document.querySelectorAll('.word');
    for (let i = currentWordIndex; i < words.length; i++) {
        wordElements[i].classList.add('incorrect');
        wordElements[i].classList.remove('active', 'correct');
    }
}

// Move to next word
function moveToNextWord() {
    const wordElements = document.querySelectorAll('.word');
    // Remove active state from current word
    wordElements[currentWordIndex].classList.remove('active');
    // Move to next word
    currentWordIndex++;
    // Highlight next word if available
    if (currentWordIndex < words.length) {
        wordElements[currentWordIndex].classList.add('active');
    }
}

// Check if a word is correctly pronounced
function isWordCorrectlyPronounced(spokenWord, targetWord) {
    // Remove punctuation and convert to lowercase
    spokenWord = spokenWord.toLowerCase().replace(/[.,!?]/g, '');
    targetWord = targetWord.toLowerCase().replace(/[.,!?]/g, '');
    
    // Exact match
    if (spokenWord === targetWord) {
        return true;
    }
    
    // Check for common variations
    const variations = {
        'the': ['da', 'duh', 'thee', 'th'],
        'is': ['iz', 'is', 'iz'],
        'are': ['ar', 'r', 'er'],
        'and': ['n', 'nd', 'an'],
        'in': ['inn', 'in', 'en'],
        'on': ['awn', 'on', 'un'],
        'at': ['at', 'et', 'ut'],
        'to': ['too', 'two', 'to', 'tu'],
        'for': ['for', 'fur', 'fer'],
        'of': ['ov', 'of', 'uv'],
        'a': ['a', 'ah', 'uh'],
        'an': ['an', 'en', 'un'],
        'this': ['dis', 'this', 'thiz'],
        'that': ['dat', 'that', 'thut'],
        'with': ['wit', 'with', 'wiv'],
        'from': ['from', 'frum', 'frm'],
        'by': ['by', 'bi', 'bai'],
        'as': ['as', 'az', 'uz'],
        'it': ['it', 'et', 'ut'],
        'its': ['its', 'itz', 'ets']
    };
    
    // Check if the target word has known variations
    if (variations[targetWord]) {
        return variations[targetWord].includes(spokenWord);
    }
    
    // Check for similar pronunciation
    const similarity = calculateSimilarity(spokenWord, targetWord);
    return similarity > 0.7; // Lowered threshold to 70% for better recognition
}

// Calculate similarity between two strings
function calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
        return 1.0;
    }
    
    return (longer.length - editDistance(longer, shorter)) / parseFloat(longer.length);
}

// Calculate edit distance between two strings
function editDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str1.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str2.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str1.length; i++) {
        for (let j = 1; j <= str2.length; j++) {
            if (str1[i-1] === str2[j-1]) {
                matrix[i][j] = matrix[i-1][j-1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i-1][j-1] + 1,
                    matrix[i][j-1] + 1,
                    matrix[i-1][j] + 1
                );
            }
        }
    }
    
    return matrix[str1.length][str2.length];
}

// Initialize speech recognition
function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            isListening = true;
            startButton.disabled = true;
            stopButton.disabled = false;
            statusMessage.textContent = "Listening... Read the text aloud.";
            spokenWords = [];
            lastProcessedTime = Date.now();
        };

        recognition.onend = () => {
            isListening = false;
            startButton.disabled = false;
            stopButton.disabled = true;
            statusMessage.textContent = "Stopped. Click to continue reading.";
        };

        recognition.onresult = (event) => {
            const result = event.results[event.results.length - 1];
            const transcript = result[0].transcript.trim().toLowerCase();
            
            if (result.isFinal) {
                const newWords = transcript.split(' ');
                spokenWords = spokenWords.concat(newWords);
                
                for (const spokenWord of newWords) {
                    if (currentWordIndex < words.length) {
                        const currentWord = words[currentWordIndex];
                        const wordElements = document.querySelectorAll('.word');
                        
                        // Check if enough time has passed since last word
                        const currentTime = Date.now();
                        if (currentTime - lastProcessedTime < MIN_TIME_BETWEEN_WORDS) {
                            continue;
                        }
                        
                        if (isWordCorrectlyPronounced(spokenWord, currentWord)) {
                            // Correct word
                            wordElements[currentWordIndex].classList.add('correct');
                            wordElements[currentWordIndex].classList.remove('incorrect');
                            // Move to next word immediately
                            moveToNextWord();
                            lastProcessedTime = currentTime;
                        } else {
                            // Incorrect word
                            wordElements[currentWordIndex].classList.add('incorrect');
                            wordElements[currentWordIndex].classList.remove('correct');
                            // Move to next word immediately
                            moveToNextWord();
                            lastProcessedTime = currentTime;
                        }
                        
                        updateWordCount();
                    }
                }
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            statusMessage.textContent = `Error: ${event.error}`;
        };
    } else {
        statusMessage.textContent = "Speech recognition is not supported in your browser.";
        startButton.disabled = true;
    }
}

// Event Listeners
startButton.addEventListener('click', () => {
    if (!isListening) {
        // Reset the state
        currentWordIndex = 0;
        spokenWords = [];
        const wordElements = document.querySelectorAll('.word');
        wordElements.forEach(el => {
            el.classList.remove('correct', 'incorrect', 'active');
        });
        // Highlight the first word
        if (wordElements.length > 0) {
            wordElements[0].classList.add('active');
        }
        recognition.start();
    }
});

stopButton.addEventListener('click', () => {
    if (isListening) {
        // Mark all remaining words as incorrect
        markRemainingWordsAsIncorrect();
        recognition.stop();
    }
});

// Font size controls
decreaseFontBtn.addEventListener('click', () => {
    const currentSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--font-size'));
    if (currentSize > 1) {
        document.documentElement.style.setProperty('--font-size', `${currentSize - 0.1}rem`);
    }
});

increaseFontBtn.addEventListener('click', () => {
    const currentSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--font-size'));
    if (currentSize < 2) {
        document.documentElement.style.setProperty('--font-size', `${currentSize + 0.1}rem`);
    }
});

// Background color controls
whiteBgBtn.addEventListener('click', () => {
    document.documentElement.style.setProperty('--background-color', '#ffffff');
});

grayBgBtn.addEventListener('click', () => {
    document.documentElement.style.setProperty('--background-color', '#f0f0f0');
});

beigeBgBtn.addEventListener('click', () => {
    document.documentElement.style.setProperty('--background-color', '#f5f5dc');
});

// Initialize the application
function init() {
    initializeText();
    initSpeechRecognition();
}

// Start the application when the page loads
window.addEventListener('load', init); 