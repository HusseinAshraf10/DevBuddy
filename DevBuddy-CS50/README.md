# DevBuddy

## Video Demo
https://youtu.be/Tns45NPafMg

## Description

DevBuddy is a Chrome Extension created as my final project for CS50. The main purpose of this extension is to help programming students understand technical terms while reading articles, documentation, or tutorials online.

When learning programming, it is very common to encounter new words such as "API", "framework", "loop", or "recursion". Usually, students have to open a new tab and search for the meaning of the term, which interrupts the learning process. DevBuddy solves this problem by providing quick definitions directly inside the webpage.

The extension works in two main ways. First, it provides an instant tooltip definition feature. When the user highlights a programming term on any webpage, DevBuddy checks if the selected word exists in its built-in dictionary. If the term is found, a tooltip appears near the cursor showing the meaning. This makes it easier to understand concepts without leaving the page.

Second, DevBuddy includes a popup interface that allows users to search for terms manually. The popup also supports saving favorite terms, adding custom definitions, editing saved entries, and removing terms when they are no longer needed. This creates a personal mini-dictionary that can grow over time.

The goal of DevBuddy is to make learning technical vocabulary faster, smoother, and more interactive during everyday browsing.

## How the Extension Works

DevBuddy is built using JavaScript, HTML, CSS, and the Chrome Extensions API.

The project consists of two main components:

1. A content script that runs directly inside web pages.
2. A popup interface that appears when clicking the extension icon.

The content script listens for text selection events. When the user selects a word, the script normalizes the text (lowercasing, trimming spaces, and cleaning edge punctuation), then searches for the term in the dictionary. If a match is found, the tooltip is displayed with modern styling. The tooltip closes when the user presses ESC or clears the selection.

The popup interface provides additional features such as searching for terms, managing favorites, and adding new custom entries. Favorites are stored using Chrome local storage, meaning the data remains available even after restarting the browser.

## Features

- Instant tooltip definitions when selecting technical terms on any webpage
- Popup search feature for manual term lookup
- Favorites system for saving important terms
- Ability to add custom terms and meanings
- Edit and remove saved terms easily
- Tooltip closes with ESC
- Clean and modern tooltip design with animations

## Files Overview

This project includes the following main files:

- `manifest.json`  
  The main configuration file for the Chrome Extension. It defines permissions, scripts, icons, and extension behavior.

- `content.js`  
  The content script responsible for detecting selected text inside webpages and displaying tooltip definitions.

- `popup.html`  
  The HTML structure of the popup interface that opens when clicking the extension icon.

- `popup.js`  
  Handles the popup logic, including searching terms, managing favorites, saving to local storage, editing entries, and updating the interface.

- `dictionary.json`  
  A built-in database of programming-related terms and their definitions.

- `tooltip.css`  
  Contains the styling for the tooltip, including colors, borders, animations, and layout.

- `icons/`  
  A folder containing the extension icons used in the Chrome toolbar and extension menu.

## Design Decisions

One important design decision was keeping the extension simple and focused. Instead of building a full online dictionary, DevBuddy uses a lightweight local JSON file for fast lookups. This makes the extension work instantly without needing an internet connection or external API.

Another decision was adding a favorites feature. Many students repeatedly encounter the same technical words, so allowing users to build their own list of saved terms makes the extension more useful long-term.

The tooltip interface was designed to be minimal but visually clear. It appears near the cursor, stays within screen boundaries, and disappears easily when no longer needed.

## Challenges

One challenge was handling text selection correctly. Webpages contain many different elements and punctuation patterns, so the extension needed reliable normalization before matching selected text to dictionary keys.

Another challenge was implementing a clean favorites system. The popup needed to support adding new terms, editing existing ones, and syncing changes properly using Chrome storage.

Positioning the tooltip was also slightly difficult because it must remain visible even when the user selects a word near the edge of the screen.

I used online documentation and AI tools for suggestions and debugging during development.

## How to Run the Project

To install and run DevBuddy locally:

1. Open Google Chrome and go to:

   `chrome://extensions/`

2. Enable **Developer Mode** in the top-right corner.

3. Click **Load unpacked**.

4. Select the project folder containing `manifest.json`.

5. The DevBuddy extension will appear in the toolbar.

6. Visit any webpage, highlight a technical term, and a tooltip definition will appear.

## Conclusion

DevBuddy is a practical tool for programming students who want quick access to definitions while studying online. It combines instant term explanations with a personal favorites dictionary, making technical learning more efficient and enjoyable. This project allowed me to practice JavaScript, Chrome Extension development, storage management, and user interface design as part of my CS50 final project.
