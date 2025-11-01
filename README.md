## Inspiration
Learning Japanese through music has always been popular, but traditional methods lack real-time, contextual understanding. We noticed that while watching Japanese music videos with lyrics, learners often have to constantly switch between the video, dictionary apps, and grammar guides to look up unfamiliar words and structures. This disruptive workflow breaks the immersion and turns an enjoyable activity into a chore.

LyricLens was born from the desire to transform this passive listening into active learning. It eliminates the need for constant context-switching by automatically providing AI-powered translations and grammar explanations directly within the YouTube subtitles you're already watching.

Demo Link: https://youtu.be/d1WJjmLj62c

## What it does
LyricLens is a Chrome extension that intelligently enhances YouTube Japanese music video subtitles. It automatically:
- **Detects and highlights** key vocabulary words in near real-time subtitles
- **Provides instant translations** with a hover interface showing word meaning, grammar explanation, and song context
- **Builds personalized vocabulary books** where users can save and review learned words
- **Offers dual modes**: Demo mode with curated word lists for quick start, and generic mode with AI-powered automatic word segmentation

# Testing Instructions for LyricLens

## Prerequisites
1. Chrome Dev/Canary channel (Version ≥ 143.0.7498.2)
2. Minimum 22 GB free storage space
3. Non-metered internet connection
4. Integrated/discrete GPU with 4GB+ VRAM

## Setup Steps

1. **Enable Prompt API and Translation API **
   - Navigate to `chrome://flags/#prompt-api-for-gemini-nano`
   - Select "Enabled"
   - Search for “Experimental translation API”
   - Select "Enabled"
   - Relaunch Chrome

2. **Install Extension**
   - Clone repository: `git clone https://github.com/konnomiya/lyriclens.git`
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the folder "lyriclens-extension" in the cloned directory

## Testing Features

1. **Full Functionality with AI Capabilities**
   - Ensure in content.js file, mode is 'generic' (this is by default)
   - Open any Japanese music video with Japanese subtitles provided on Youtube (e.g. https://www.youtube.com/watch?v=dIOjs3YRT_U)
   - Enable Subtitles on the video
   - Hover over highlighted words
   - Check translations, grammar, context provided
   - Click 'Save Word'to save a word
   - Click 'View Vocabulary' to check the vocabulary book with saved words
   - Click 'Export Vocabulary' to export the saved words in JSON

2. **Quick Overview with UI without AI Capabilities**
   - Ensure in content.js file, mode is 'demo'
   - Open demo video on Youtube (https://www.youtube.com/watch?v=dIOjs3YRT_U)
   - Enable Subtitles on the video
   - Hover over highlighted words
   - Highlighted words are selected based on a preset list with static translations without AI interaction
   - Check translations, grammar, context provided
   - Click 'Save Word'to save a word
   - Click 'View Vocabulary' to check the vocabulary book with saved words
   - Click 'Export Vocabulary' to export the saved words in JSON

## Current Known Limitations
- ⚠️ AI segmentation may occasionally produce inaccurate results
- We use fallback validation to minimize errors  
- Focus is on providing meaningful learning context despite imperfections
- Future improvements could be: Integrate specialized Japanese NLP libraries
- Requires initial model download (~few minutes)

## Disclaimer
Special thanks to @夏目-p1c for the authorized use of the "Gurenge" fan-made video.
All other music videos and songs depicted in this demo are copyright of their respective original creators.

---
Built with passion for music, language, and the belief that technology should serve human curiosity. 🎵
