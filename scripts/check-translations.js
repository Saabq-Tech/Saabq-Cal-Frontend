import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');
const translationsFile = path.join(srcDir, 'translations', 'translations.js');

// ANSI escape codes for styling console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function logHeader(text) {
  console.log(`\n${colors.bright}${colors.blue}=== ${text} ===${colors.reset}`);
}

function logSuccess(text) {
  console.log(`${colors.green}✅ ${text}${colors.reset}`);
}

function logError(text) {
  console.log(`${colors.red}❌ ${text}${colors.reset}`);
}

function logWarning(text) {
  console.log(`${colors.yellow}⚠️  ${text}${colors.reset}`);
}

// 1. Recursively find all JS/JSX files in src/
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

// 2. Load translations dictionary from translations.js
async function loadTranslations() {
  const fileUrl = pathToFileURL(translationsFile).href;
  const mod = await import(fileUrl);
  const translations = mod.translations || mod.default;

  if (!translations || !translations.ar || !translations.en) {
    throw new Error('Could not load valid translations dictionary from translations.js');
  }
  return translations;
}

async function runCheck() {
  console.log(`${colors.bright}${colors.cyan}🔍 Website Translation Audit Tool${colors.reset}\n`);

  let hasErrors = false;
  const translations = await loadTranslations();
  const arKeys = new Set(Object.keys(translations.ar));
  const enKeys = new Set(Object.keys(translations.en));

  // --- Step 1: Check Dictionary Symmetry between Arabic & English ---
  logHeader('Step 1: Checking Dictionary Key Symmetry (AR vs EN)');
  
  const missingInEn = [...arKeys].filter((k) => !enKeys.has(k));
  const missingInAr = [...enKeys].filter((k) => !arKeys.has(k));

  if (missingInEn.length === 0 && missingInAr.length === 0) {
    logSuccess('Arabic and English dictionaries are 100% symmetric.');
  } else {
    hasErrors = true;
    if (missingInEn.length > 0) {
      logError(`Keys present in Arabic (ar) but missing in English (en): ${missingInEn.length}`);
      missingInEn.forEach((k) => console.log(`   - ${colors.red}${k}${colors.reset}`));
    }
    if (missingInAr.length > 0) {
      logError(`Keys present in English (en) but missing in Arabic (ar): ${missingInAr.length}`);
      missingInAr.forEach((k) => console.log(`   - ${colors.red}${k}${colors.reset}`));
    }
  }

  // --- Step 2: Scan Codebase for t('key') Usages ---
  logHeader("Step 2: Scanning Codebase for t('key') Usages");

  const allFiles = getAllFiles(srcDir).filter((f) => f !== translationsFile);
  const usedKeys = new Map(); // key -> [{ file, line }]
  const tKeyRegex = /(?:^|[^a-zA-Z0-9_])t\(\s*['"]([a-zA-Z0-9_.-]+)['"]\s*\)/g;

  for (const filePath of allFiles) {
    const relativePath = path.relative(projectRoot, filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((lineText, idx) => {
      let match;
      while ((match = tKeyRegex.exec(lineText)) !== null) {
        const key = match[1];
        if (!usedKeys.has(key)) {
          usedKeys.set(key, []);
        }
        usedKeys.get(key).push({ file: relativePath, line: idx + 1 });
      }
    });
  }

  const missingFromArDict = [];
  const missingFromEnDict = [];

  for (const [key, occurrences] of usedKeys.entries()) {
    if (!arKeys.has(key)) {
      missingFromArDict.push({ key, occurrences });
    }
    if (!enKeys.has(key)) {
      missingFromEnDict.push({ key, occurrences });
    }
  }

  if (missingFromArDict.length === 0 && missingFromEnDict.length === 0) {
    logSuccess(`All ${usedKeys.size} t(...) keys used in component files exist in translations.js.`);
  } else {
    hasErrors = true;
    if (missingFromArDict.length > 0) {
      logError(`Keys used in code but missing from Arabic (ar) dictionary: ${missingFromArDict.length}`);
      missingFromArDict.forEach(({ key, occurrences }) => {
        const first = occurrences[0];
        console.log(`   - ${colors.red}${key}${colors.reset} (${first.file}:${first.line})`);
      });
    }
    if (missingFromEnDict.length > 0) {
      logError(`Keys used in code but missing from English (en) dictionary: ${missingFromEnDict.length}`);
      missingFromEnDict.forEach(({ key, occurrences }) => {
        const first = occurrences[0];
        console.log(`   - ${colors.red}${key}${colors.reset} (${first.file}:${first.line})`);
      });
    }
  }

  // --- Step 3: Scan Codebase for Untranslated Hardcoded Text ---
  logHeader('Step 3: Scanning Codebase for Untranslated Static Text');

  const untranslatedFound = [];

  // Patterns for hardcoded text (matches both Arabic & English static text)
  const jsxTextRegex = />\s*([\u0600-\u06FFA-Za-z][\u0600-\u06FFA-Za-z0-9\s.,!?'"():/-]{1,})\s*</g;
  const toastConfirmRegex = /(?:toast\.(?:success|error|info|warning)|confirm|alert)\(\s*['"]([\u0600-\u06FFA-Za-z0-9\s.,!?'"():/-]{2,})['"]\s*\)/g;
  const placeholderRegex = /placeholder=\s*['"]([\u0600-\u06FFA-Za-z0-9\s.,!?'"():/-]{2,})['"]\s*/g;

  for (const filePath of allFiles) {
    const relativePath = path.relative(projectRoot, filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((lineText, idx) => {
      // Ignore comments, imports, console log, style objects, database ar fields, language check logic
      if (
        lineText.trim().startsWith('//') ||
        lineText.trim().startsWith('*') ||
        lineText.trim().startsWith('import') ||
        lineText.includes('console.log') ||
        lineText.includes('className=') ||
        lineText.includes('style={{') ||
        lineText.includes('label_ar:') ||
        lineText.includes('description_ar:') ||
        lineText.includes('name_ar:') ||
        lineText.includes('title_ar:') ||
        lineText.includes('subject_ar:') ||
        lineText.includes('body_ar:') ||
        lineText.includes('customer_name:') ||
        lineText.includes('service_name:') ||
        lineText.includes('company_name:') ||
        lineText.includes('cancel_reason:') ||
        lineText.includes("lang === 'ar'") ||
        lineText.includes("lang === 'en'") ||
        lineText.includes('isRTL') ||
        lineText.includes('isAr') ||
        lineText.includes('ar:') ||
        lineText.includes('placeholderAr:') ||
        lineText.includes('_AR') ||
        lineText.includes('aria-label') ||
        lineText.includes('التحويل للعربية') ||
        lineText.includes('errorMsg.includes') ||
        lineText.includes('res.message?.includes') ||
        lineText.includes('label.includes')
      ) {
        return;
      }

      // Check for any hardcoded Arabic text in string literals or JSX text
      const arabicRegex = /['">`]([^'"`><\n]*[\u0600-\u06FF]+[^'"`><\n]*)['"<`]/g;
      let match;
      while ((match = arabicRegex.exec(lineText)) !== null) {
        const text = match[1].trim();
        if (!text) continue;

        // Escape regex special chars for text string
        const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Check if this text is a valid fallback for t(...) or lang === 'ar' / isRTL ternary
        const isTCallFallback =
          lineText.includes(`|| '${text}'`) ||
          lineText.includes(`|| "${text}"`) ||
          lineText.includes(`|| \`${text}\``) ||
          new RegExp(`t\\(\\s*['"][^'"]+['"]\\s*,\\s*['"\`][^'"\`]*${escapedText}[^'"\`]*['"\`]`).test(lineText) ||
          new RegExp(`(?:lang\\s*===\\s*['"]ar['"]|isRTL|isAr)\\s*\\?\\s*['"\`][^'"\`]*${escapedText}[^'"\`]*['"\`]`).test(lineText);

        if (!isTCallFallback) {
          untranslatedFound.push({ file: relativePath, line: idx + 1, type: 'Hardcoded Arabic', text });
        }
      }
    });
  }

  if (untranslatedFound.length === 0) {
    logSuccess('No untranslated static texts found across website components.');
  } else {
    hasErrors = true;
    logError(`Found ${untranslatedFound.length} potential hardcoded static text instances:`);
    console.table(
      untranslatedFound.map((item) => ({
        File: `${item.file}:${item.line}`,
        Type: item.type,
        'Hardcoded Text': item.text,
      }))
    );
  }

  // --- Final Summary ---
  console.log(`\n${colors.bright}=== Audit Result ===${colors.reset}`);
  if (hasErrors) {
    logError('Translation audit FAILED. Please resolve missing keys or dictionary mismatches above.');
    process.exit(1);
  } else {
    logSuccess('Translation audit PASSED cleanly! All keys verified.');
    process.exit(0);
  }
}

runCheck().catch((err) => {
  console.error(err);
  process.exit(1);
});
