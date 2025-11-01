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

## How we built it
**Technical Architecture:**
- **Frontend**: Vanilla JavaScript with DOM manipulation for real-time subtitle processing
- **AI Translation Pipeline**: 
  - **First Layer**: Translator API for basic word translation
  - **Second Layer**: Prompt API enhances translations with grammar explanations and song context analysis
- **AI Segmentation**: Prompt API for intelligent Japanese text segmentation to identify learning-worthy vocabulary
- **Caching System**: Multi-layer caching (translation, segmentation) for performance optimization
- **Storage**: LocalStorage for vocabulary book persistence
- **YouTube Integration**: MutationObserver for real-time subtitle detection and processing

**Key Features:**
- Real-time subtitle monitoring with container tracking
- Smart word scoring algorithm prioritizing kanji, verbs, and adjectives
- Responsive hover cards with progress tracking
- Export functionality for vocabulary data

## Challenges we ran into
**Technical Challenges:**
- **Real-time Processing**: Balancing performance while processing subtitles without affecting YouTube playback
- **API Reliability**: Handling failures gracefully when AI services are unavailable
- **JSON Parsing**: Dealing with inconsistent JSON responses from Prompt API, requiring robust error handling
- **Subtitle Timing**: Managing rapid subtitle changes and video seek events

**Language Processing Challenges:**
- Accurate Japanese word segmentation without external libraries
- Distinguishing meaningful vocabulary from common particles
- Providing contextually appropriate translations for song lyrics

## Accomplishments that we're proud of
- **Seamless Integration**: Created non-intrusive learning experience native to YouTube
- **Dual AI Pipeline**: Successful Translator API → Prompt API enhancement workflow
- **Intelligent Word Detection**: Effective scoring algorithms for vocabulary identification
- **Performance Optimization**: Smooth real-time processing through sophisticated caching
- **User Experience**: Intuitive vocabulary management system

## What we learned
**Technical Insights:**
- Importance of robust error handling with multiple AI APIs
- Effective caching and state management in browser extensions
- DOM mutation observation techniques for dynamic content
- Japanese language processing nuances

**Product Insights:**
- Users prefer minimal interface disruption while learning
- Contextual learning through music improves vocabulary retention
- Balance between automation and user control in learning tools

## What's next for LyricLens 
**What's Next: Building the Future of Music-Driven Learning**

- **Enhanced Segmentation & Grammar**：
    - Achieve higher segmentation accuracy.
    - Expand analysis to cover more complex grammatical constructs.

- **Product & Ecosystem**
  - **Multi-Language Expansion**: Bringing the LyricLens experience to Korean, Chinese, and other popular music markets.
  - **Platform Ubiquity**: Expanding from YouTube to platforms like Netflix, Bilibili and Niconico, reaching learners wherever they are.

LyricLens demonstrates that AI-powered education can be both powerful and respectful—powerful in its analytical capabilities, respectful in its privacy preservation and user experience design. It's not just another language tool; it's a new paradigm for incidental learning through cultural content.