# 🔍 Development Debugging Setup Guide

This guide will help you set up proper debugging with source maps for the Singapore Handpan Studio website development.

## 🚀 Quick Fix - Enable Source Maps

### 1. Source Maps Configuration (Already Applied)

The project now includes:

✅ **CSS Source Maps** - Debug SCSS styles  
✅ **TypeScript Source Maps** - Debug .ts/.tsx files  
✅ **JavaScript Source Maps** - Debug .js/.jsx files  
✅ **Astro Component Maps** - Debug .astro files  

### 2. Restart Development Server

```bash
# Stop current dev server (Ctrl+C)
# Clear any cache and restart
npm run dev
```

## 🛠️ Browser Dev Tools Setup

### Chrome/Edge DevTools

1. **Open DevTools** (F12 or Ctrl+Shift+I)
2. **Go to Settings** (⚙️ icon or F1 in DevTools)
3. **Sources panel** → Enable these options:
   - ✅ "Enable JavaScript source maps"
   - ✅ "Enable CSS source maps"
   - ✅ "Automatically reveal files in sidebar"
4. **Network panel** → Enable:
   - ✅ "Preserve log"
   - ✅ "Disable cache (while DevTools is open)"

### Firefox Developer Tools

1. **Open Developer Tools** (F12)
2. **Settings** (⚙️ in top-right of DevTools)
3. **Advanced Settings**:
   - ✅ "Enable source maps"
   - ✅ "Show original sources"

### VS Code Integration

Add this to `.vscode/launch.json` for debugging:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome with Source Maps",
      "request": "launch",
      "type": "chrome",
      "url": "http://localhost:4321",
      "webRoot": "${workspaceFolder}/src",
      "sourceMaps": true,
      "smartStep": true,
      "skipFiles": [
        "<node_internals>/**",
        "node_modules/**"
      ]
    }
  ]
}
```

## 📁 Source Map File Structure

After enabling source maps, you should see:

```
DevTools Sources Panel:
├── localhost:4321/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EventCard.astro ← Original source
│   │   │   └── EventDetail.astro
│   │   ├── pages/
│   │   │   ├── events.astro ← Debug here
│   │   │   └── contacts.astro
│   │   └── styles/
│   │       ├── tokens.scss ← SCSS source maps
│   │       └── global.scss
│   └── node_modules/ (can be hidden)
```

## 🔧 Common Debugging Scenarios

### 1. Debugging Astro Components

**Set breakpoints in:**
- Component logic (frontmatter `---` section)
- Client-side scripts (`<script>` tags)
- Event handlers

**Example - Event Card Component:**
```astro
---
// You can set breakpoints here
const { event } = Astro.props;
console.log('Event data:', event); // This will show in console
---

<script>
  // Client-side debugging
  document.addEventListener('DOMContentLoaded', () => {
    debugger; // Hard breakpoint
    console.log('DOM loaded');
  });
</script>
```

### 2. Debugging SCSS Styles

**With source maps enabled:**
1. **Inspect element** in browser
2. **Styles panel** shows original SCSS file names
3. **Click on filename** to jump to source
4. **Edit styles** live in DevTools

**Example - See original file instead of compiled CSS:**
```
Before: main.css:1234
After:  EventCard.astro:45  ← Shows actual source
```

### 3. Debugging TypeScript/JavaScript

**Set breakpoints:**
- In `.ts` files in `src/utils/`
- In React components (`.tsx` files)
- In client-side scripts

### 4. Debugging API Calls (Storyblok)

**Network debugging:**
1. **Network tab** → Filter by "Fetch/XHR"
2. **Look for Storyblok API calls**
3. **Click on request** → See headers, response
4. **Set breakpoints** in API handling code

## 🐛 Advanced Debugging Techniques

### 1. Console Debugging

Add debug logging throughout your components:

```typescript
// In any .astro, .ts, or .tsx file
console.log('🔍 Debug:', variableName);
console.table(arrayData); // Nice table format
console.group('Event Processing');
console.log('Event:', event);
console.log('Processed:', processedEvent);
console.groupEnd();
```

### 2. Conditional Breakpoints

In DevTools Sources:
1. **Right-click on line number**
2. **Add conditional breakpoint**
3. **Enter condition**: `event.status === 'upcoming'`

### 3. Network Request Debugging

```javascript
// Monitor Storyblok API calls
fetch('/api/storyblok/events')
  .then(response => {
    debugger; // Breakpoint here
    return response.json();
  })
  .catch(error => {
    console.error('API Error:', error);
    debugger; // Breakpoint for errors
  });
```

### 4. Performance Debugging

```javascript
// Measure performance
console.time('Component Render');
// Your code here
console.timeEnd('Component Render');

// Memory usage
console.log('Memory:', performance.memory);
```

## 🔧 Development Environment Variables

Add to your `.env` for enhanced debugging:

```bash
# Enable verbose logging
DEBUG=true
VERBOSE_LOGGING=true

# Development mode
NODE_ENV=development

# Disable minification for better debugging
VITE_DEBUG=true
```

## 📱 Mobile Debugging

### Remote Debugging (Chrome)

1. **Enable USB Debugging** on Android device
2. **Connect device** to computer
3. **Chrome** → `chrome://inspect`
4. **Select device** → Open development site
5. **Debug as normal** in desktop DevTools

### iOS Safari Debugging

1. **Settings** → Safari → Advanced → Web Inspector
2. **Connect iPhone** to Mac
3. **Safari** → Develop → [Device Name] → Your Site
4. **Debug in Safari** Web Inspector

## 🚨 Troubleshooting

### Source Maps Not Loading

**Problem**: "Source map could not be loaded"

**Solutions**:
```bash
# 1. Clear browser cache
# DevTools → Application → Storage → Clear storage

# 2. Restart dev server
npm run dev

# 3. Hard refresh browser
Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

# 4. Check if files exist
ls -la .astro/  # Should contain source map files
```

### Breakpoints Not Working

**Check**:
1. ✅ Source maps enabled in browser settings
2. ✅ Files are being served from `localhost:4321`
3. ✅ Original source files appear in DevTools
4. ✅ Set breakpoints in **original source**, not compiled files

### Styles Not Showing Original File

**SCSS source maps troubleshooting**:
```bash
# 1. Verify SCSS compilation
npm run dev
# Check console for SCSS errors

# 2. Check browser DevTools settings
# Sources → Enable CSS source maps

# 3. Force SCSS recompilation
# Edit any .scss file and save
```

### Performance Issues with Source Maps

**In production**, source maps are disabled automatically.

**In development**, if too slow:
```javascript
// astro.config.mjs - Disable specific source maps
vite: {
  css: {
    devSourcemap: false, // Disable CSS source maps if slow
  }
}
```

## 🎯 Debugging Best Practices

### 1. Use Meaningful Console Messages

```javascript
// ❌ Bad
console.log(data);

// ✅ Good
console.log('🎵 Event loaded:', {
  title: event.title,
  date: event.date,
  status: event.status
});
```

### 2. Organize Debug Code

```javascript
// Create debug utility
const debug = {
  log: (message, data) => {
    if (import.meta.env.DEV) {
      console.log(`🔍 ${message}`, data);
    }
  },
  error: (message, error) => {
    console.error(`❌ ${message}`, error);
  },
  time: (label) => console.time(`⏱️ ${label}`),
  timeEnd: (label) => console.timeEnd(`⏱️ ${label}`)
};

// Usage
debug.log('Fetching events from Storyblok');
debug.time('API Call');
```

### 3. Use Browser DevTools Features

- **Elements** → Inspect and modify live DOM
- **Console** → Interactive JavaScript debugging
- **Sources** → Set breakpoints and step through code
- **Network** → Monitor API calls and resources
- **Performance** → Profile rendering and JavaScript
- **Application** → Check localStorage, cookies, service workers

## 🆘 Getting Help

### Debug Information to Share

When reporting issues, include:

```bash
# System info
node --version
npm --version

# Project info
npm run build 2>&1 | tee build.log

# Browser info
# DevTools → Console → Copy any error messages

# Source map status
# DevTools → Sources → Check if original files appear
```

### Common Debug Commands

```bash
# Check if source maps are generated
find . -name "*.map" -type f

# Verify development server is running with source maps
curl -I http://localhost:4321/src/pages/events.astro

# Check TypeScript compilation
npx tsc --noEmit --skipLibCheck
```

## 🎵 Ready to Debug!

With source maps enabled, you can now:

✅ **Set breakpoints** in original source files  
✅ **Debug SCSS styles** with original file names  
✅ **Step through TypeScript** code line by line  
✅ **Monitor API calls** to Storyblok  
✅ **Profile performance** issues  
✅ **Debug mobile** devices remotely  

**Happy debugging!** 🐛→🎵

---

*For more advanced debugging techniques, check the [Astro Debugging Guide](https://docs.astro.build/en/guides/troubleshooting/) and [Vite Debugging Docs](https://vitejs.dev/guide/debugging.html).*

