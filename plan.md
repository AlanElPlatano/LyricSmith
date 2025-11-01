# Rocksmith Lyric Synchronizer
## Project Specification Document

### Project Overview
A web-based tool to simplify the process of replacing phonetically-transcribed lyrics in Rocksmith 2014 EOF XML files with correct characters from different alphabets (Cyrillic, Japanese, special characters, etc.).

---

## Problem Statement

**Current Workflow Pain Points:**
- EOF (Editor On Fire) doesn't support many special characters (Cyrillic, Chinese, Japanese, extended Latin like ő, ö)
- Users must manually replace every syllable in the exported XML file
- Process takes 1+ hours for songs in non-Latin alphabets
- Error-prone and tedious

**Solution:**
A visual syllable-matching interface where users can quickly align correctly-spelled lyrics with EOF's timing data.

---

## Technical Stack

### Core Technologies
- **Framework**: React 18+ with Vite
- **Language**: JavaScript/TypeScript
- **Styling**: Tailwind CSS (or CSS Modules)
- **Deployment**: GitHub Pages (static hosting)
- **Build Tool**: Vite

### File Handling
- **Import**: FileReader API for XML and TXT files
- **Export**: Blob API + download trigger for modified XML
- **Parsing**: DOMParser for XML, String operations for TXT

### State Management
- React useState/useReducer for local state
- No external state library needed (single-page, no complex routing)

---

## XML Format Understanding

### Input Format (EOF Export)
```xml
<?xml version='1.0' encoding='UTF-8'?>
<vocals count="13">
<!-- EOF v1.8RC13 (7-22-2025) -->
  <vocal time="30.438" note="254" length="0.264" lyric="Pri-"/>
  <vocal time="30.763" note="254" length="0.263" lyric="mer"/>
  <vocal time="31.087" note="254" length="0.263" lyric="teks"/>
  <vocal time="31.411" note="254" length="0.649" lyric="ta+"/>
  ...
</vocals>
```

### Lyric Format Rules
1. **Hyphen (`-`)**: Indicates continuation to next syllable in same word
   - Example: `"Pri-"` → next syllable is part of same word
   - No hyphen = word ends, space should follow

2. **Plus (`+`)**: Marks end of lyric line (line break)
   - Example: `"ta+"` → new line starts with next syllable

3. **Note Attribute**: `"254"` for unpitched lyrics and other numbers for pitched lyrics (preserve in output)

4. **Timing Attributes**: `time`, `length` remain unchanged in output

---

## Application Structure

### Main Components

#### 1. Import Section
```
┌─────────────────────────────────────────────────────────┐
│  [Import XML File]  [Import TXT File]                   │
│  Or paste XML:    │  Or paste plain text:              │
│  [Text Area]      │  [Text Area]                       │
└─────────────────────────────────────────────────────────┘
```

#### 2. Control Bar with syllable count
```
┌─────────────────────────────────────────────────────────┐
│  [Undo] [Redo]        Original: 143 | Current: 143      │
│                                        [Export XML]      │
└─────────────────────────────────────────────────────────┘
```

#### 3. Syllable Matching Interface (Main Area)
```
Scrollable container showing all lyric lines:

Line 1:
  [First] [lyr-] [ic] [line] [of] [my] [song+]  ← XML (lighter bg)
  [F] [i] [r] [s] [t] [l] [y] [r] [i] [c]      ← Plain (darker bg)

Line 2:
  [Sec-] [ond] [lyr-] [ic] [line+]
  [S] [e] [c] [o] [n] [d]

... (continues for entire song)
```
**CRITICAL**: Where each syllable will get assigned to its corresponding syllable from the top row (e.g. the content of the 5th syllable from the bottom row will be placed on the same spot the 5th syllable from the top row when written back into XML). So the UI must understand that these syllables should be placed on the same space vertically, the wider of the 2 syllables (top or bottom) will decide the width and the shorter one will be centered horizontally in this space.

### Visual Design Specifications

#### Syllable Buttons
- **Theme**: Toggle for light and dark modes
- **Height**: Fixed (e.g., 40px) for all buttons
- **Width**: `min-width: 50px` + dynamic based on content
- **Font**: Monospace (e.g., `font-family: 'Courier New', monospace`)
- **Padding**: `8px 12px`
- **Margin**: `4px` between buttons
- **Border**: `1px solid`
- **Hover**: Slight darkening + pointer cursor
- **Active/Selected**: Distinct highlight color

#### Layout
- **Container**: Full-width, scrollable vertically
- **Line Spacing**: 24px between line pairs
- **Row Spacing**: 8px between top/bottom rows
- **Max Width**: 1200px centered
- **Row layout**: If a lyric line exceeds the length

---

## Core Functionality

### 1. File Import & Parsing

#### XML Import
```javascript
function parseXMLFile(xmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  
  // Extract header (everything before <vocals>)
  const header = xmlString.substring(0, xmlString.indexOf('<vocals'));
  
  // Extract vocals
  const vocalElements = xmlDoc.getElementsByTagName('vocal');
  const vocals = Array.from(vocalElements).map(v => ({
    time: v.getAttribute('time'),
    note: v.getAttribute('note'),
    length: v.getAttribute('length'),
    lyric: v.getAttribute('lyric'),
    originalLyric: v.getAttribute('lyric') // Preserve original
  }));
  
  return { header, vocals, count: vocals.length };
}
```

#### Plain Text Import
```javascript
function parsePlainText(text) {
  // Split by lines (assumes line breaks match XML '+' markers)
  return text.split('\n').filter(line => line.trim().length > 0);
}
```

### 2. Line Grouping Logic

```javascript
function groupVocalsIntoLines(vocals) {
  const lines = [];
  let currentLine = [];
  
  for (let i = 0; i < vocals.length; i++) {
    currentLine.push(i); // Store index reference
    
    if (vocals[i].lyric.endsWith('+')) {
      lines.push(currentLine);
      currentLine = [];
    }
  }
  
  // Handle last line if no '+' at end
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  return lines; // Array of arrays of indices
}
```

### 3. Alphabet Detection

```javascript
function detectAlphabet(text) {
  // Check for Cyrillic
  if (/[\u0400-\u04FF]/.test(text)) return 'cyrillic';
  
  // Check for CJK (Chinese/Japanese/Korean)
  if (/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'cjk';
  
  // Check for Arabic
  if (/[\u0600-\u06FF]/.test(text)) return 'arabic';
  
  // Default to Latin
  return 'latin';
}

function syllabizeText(text, alphabet) {
  if (alphabet === 'latin') {
    // Attempt syllable detection for Latin scripts
    // (Can use heuristics or just split by vowel groups)
    return text.split(/(?=[aeiou])/i); // Simplified
  } else {
    // For non-Latin, split into individual characters
    return text.split('');
  }
}
```

### 4. Syllable Merging (Core Interaction)

```javascript
function mergeSyllables(syllables, clickedIndex, rowType) {
  // Cannot merge last syllable
  if (clickedIndex >= syllables.length - 1) return syllables;
  
  const newSyllables = [...syllables];
  const current = syllables[clickedIndex];
  const next = syllables[clickedIndex + 1];
  
  // Merge logic based on row type
  if (rowType === 'xml') {
    // Remove hyphen from current if exists, merge with next
    const cleaned = current.replace(/-$/, '');
    newSyllables[clickedIndex] = cleaned + next;
  } else {
    // Plain text: just concatenate (no hyphens)
    newSyllables[clickedIndex] = current + next;
  }
  
  // Remove the next element
  newSyllables.splice(clickedIndex + 1, 1);
  
  return newSyllables;
}
```

### 5. Mapping & Export

```javascript
function mapSyllablesToXML(xmlVocals, lineGroups, plainTextLines) {
  const updatedVocals = [...xmlVocals];
  
  for (let lineIdx = 0; lineIdx < lineGroups.length; lineIdx++) {
    const vocalIndices = lineGroups[lineIdx];
    const plainSyllables = plainTextLines[lineIdx]; // User-adjusted
    
    // Map 1:1 from plain text to XML vocals
    for (let i = 0; i < vocalIndices.length; i++) {
      const vocalIdx = vocalIndices[i];
      const originalLyric = updatedVocals[vocalIdx].lyric;
      
      // Preserve hyphen and '+' markers
      let newLyric = plainSyllables[i] || '';
      
      // Add hyphen if original had one
      if (originalLyric.endsWith('-')) {
        newLyric += '-';
      }
      
      // Add '+' if original had one (line ending)
      if (originalLyric.endsWith('+')) {
        newLyric += '+';
      }
      
      updatedVocals[vocalIdx].lyric = newLyric;
    }
  }
  
  return updatedVocals;
}

function exportXML(header, vocals, originalCount) {
  let xml = header + `<vocals count="${originalCount}">\n`;
  xml += `<!-- EOF v1.8RC13 (7-22-2025) -->\n`;
  
  vocals.forEach(v => {
    xml += `  <vocal time="${v.time}" note="${v.note}" ` +
           `length="${v.length}" lyric="${v.lyric}"/>\n`;
  });
  
  xml += `</vocals>`;
  return xml;
}
```

---

## State Management Structure

```javascript
const initialState = {
  // Raw imports
  xmlData: null,        // { header, vocals, count }
  plainTextRaw: '',     // Original plain text input
  
  // Processed data
  lineGroups: [],       // [[0,1,2], [3,4,5], ...] vocal indices per line
  plainTextLines: [],   // [['П','р','и'], ['В','т','о'], ...] per line
  
  // UI state
  xmlSyllables: [],     // Current state of XML syllables (for display)
  alphabet: 'latin',    // Detected alphabet
  
  // Metadata
  originalSyllableCount: 0,
  currentSyllableCount: 0,
  
  // History for undo/redo
  history: [],
  historyIndex: -1
};

// Actions
const actions = {
  IMPORT_XML: 'import_xml',
  IMPORT_PLAIN_TEXT: 'import_plain_text',
  MERGE_SYLLABLE: 'merge_syllable',
  UNDO: 'undo',
  REDO: 'redo',
  EXPORT: 'export'
};
```

---

## User Workflow

1. **Import Files**
   - User uploads/pastes XML file from EOF
   - User uploads/pastes plain text with correct lyrics

2. **Automatic Processing**
   - App parses XML into syllables
   - App detects alphabet of plain text
   - App splits plain text into syllables/characters
   - App groups both into matching line structures
   - App displays all lines in scrollable interface

3. **Manual Adjustment**
   - User clicks syllable buttons to merge adjacent syllables
   - Top row: Merges XML syllables, removes hyphens
   - Bottom row: Merges plain text syllables/characters
   - User adjusts until counts match (or intentionally differ)

4. **Export**
   - User clicks "Export XML"
   - App maps bottom row syllables to top row positions
   - App preserves hyphens and '+' markers based on original XML
   - App generates new XML file for download

---

## Edge Cases & Considerations

### Syllable Count Mismatches
- **Behavior**: Allow export even if counts don't match
- **UI**: Show warning indicator if counts differ
- **Mapping**: Map left-to-right, truncate or leave empty if mismatch

### Special Characters in XML
- **Encoding**: Ensure UTF-8 encoding preserved
- **Escaping**: Handle XML entities (`&`, `<`, `>`, `"`, `'`)

### Empty Lines
- **Behavior**: Preserve empty `<vocal>` elements if present in original

### Multiple '+' Markers
- **Assumption**: Only last syllable in line should have '+'
- **Validation**: Warn if multiple '+' detected in same line

### Undo/Redo
- **History Depth**: Limit to last 50 actions
- **State Snapshots**: Store full syllable arrays per action

---

## Development Phases

### Phase 1: Core Parsing (Week 1)
- [ ] XML parser with vocal extraction
- [ ] Plain text line splitting
- [ ] Alphabet detection
- [ ] Character/syllable splitting logic

### Phase 2: UI Foundation (Week 1-2)
- [ ] File import interface
- [ ] Syllable button components
- [ ] Line grouping display
- [ ] Basic styling with Tailwind

### Phase 3: Interaction Logic (Week 2)
- [ ] Click-to-merge functionality
- [ ] State management with useReducer
- [ ] Syllable count tracking
- [ ] Visual feedback on hover/click

### Phase 4: Undo/Export (Week 2-3)
- [ ] Undo/redo implementation
- [ ] Syllable-to-XML mapping
- [ ] XML export with preserved formatting
- [ ] Download trigger

### Phase 5: Polish & Testing (Week 3)
- [ ] Responsive design
- [ ] Error handling
- [ ] User testing with real EOF files
- [ ] Documentation

### Phase 6: Deployment (Week 3)
- [ ] GitHub Pages setup
- [ ] CI/CD pipeline
- [ ] README with usage instructions
- [ ] Release v1.0

---

## GitHub Repository Structure

```
rocksmith-lyric-sync/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── ImportSection.jsx
│   │   ├── ControlBar.jsx
│   │   ├── SyllableLine.jsx
│   │   └── SyllableButton.jsx
│   ├── utils/
│   │   ├── xmlParser.js
│   │   ├── textProcessor.js
│   │   ├── alphabetDetector.js
│   │   └── exporter.js
│   ├── hooks/
│   │   └── useUndoRedo.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .gitignore
├── package.json
├── vite.config.js
├── index.html
└── README.md
```

---

## Future Enhancements (Post-MVP)

- **Auto-alignment suggestions** based on phonetic similarity
- **Keyboard shortcuts** (Ctrl+Z for undo, Ctrl+S for export)
- **Drag-and-drop** syllable reordering
- **Multi-file batch processing**
- **Export to .exe** using Electron for offline use

---

## Success Criteria

✅ Users can replace lyrics in <5 minutes (vs 60+ minutes manually)  
✅ Supports any UTF-8 character set  
✅ Zero installation required (web-based)  
✅ Intuitive UI requiring no documentation  
✅ Preserves all XML timing and formatting  

---

**Last Updated**: 2025-10-31  
**Version**: 1.0 (Specification Phase)