const fs = require("fs");
const path = require("path");

const eventcatalogPath = path.join(
  __dirname,
  "node_modules",
  "@eventcatalog",
  "core",
  "dist",
  "eventcatalog.js"
);

const updatedCopyCore = `
var copyCore = () => {
  ensureDir(core);
  if (eventCatalogDir === core) {
    return;
  }
  // --- PATCH: Ensure envPrefix is always present in vite config (outside define) ---
  const astroConfigPath = path.join(core, 'astro.config.mjs');
  if (fs.existsSync(astroConfigPath)) {
    let config;
    try {
      config = fs.readFileSync(astroConfigPath, 'utf8');
    } catch (error) {
      console.error("Error reading astro.config.mjs:", error);
      return;
    }
    // Remove any misplaced envPrefix inside define
    config = config.replace(/(define:\\s*{[^}]*),?\\s*envPrefix:[^,}]+/s, '$1');

    const envPrefixRegex = /envPrefix:\s*['"][^'"]*VITE_[^'"]*['"]/;

    // Add envPrefix outside define if not present
    if (envPrefixRegex.test(config)) {
      config = config.replace(
        /(vite:\\s*{[\\s\\S]*?)(\\n\\s*worker:)/,
        (match, beforeWorker, workerLine) => {
          return \`\${beforeWorker}\\n    envPrefix: 'VITE_',\${workerLine}\`;
        }
      );
      try {
        fs.writeFileSync(astroConfigPath, config, 'utf8');
        console.log("Updated astro.config.mjs with envPrefix.");
      } catch (error) {
        console.error("Error writing to astro.config.mjs:", error);
      }
    }
  } else {
    console.log("astro.config.mjs not found at:", astroConfigPath);
  }

  // --- PATCH: Inject custom session logic and replace signOut import in Header.astro ---
  const headerAstroPathForPatch = path.join(core, "src", "components", "Header.astro");
  if (!fs.existsSync(headerAstroPathForPatch)) {
    console.log("Header.astro not found at:", headerAstroPathForPatch);
    return;
  }

  let content;
  try {
    content = fs.readFileSync(headerAstroPathForPatch, "utf8");
    console.log("Successfully read Header.astro");
  } catch (error) {
    console.error("Error reading Header.astro:", error);
    return;
  }

  // --- Replace signOut import from auth-astro/client with Amplify imports ---
  const amplifyImports = [
    'import "../amplifyClient.ts";',
    'import { signOut } from "@aws-amplify/auth";'
  ].join('\\n');

  // Simpler regex to match the signOut import anywhere in the file
  const signOutImportRegex = /import\s*\{\s*signOut\s*\}\s*from\s*['"]auth-astro\\/client['"]\\s*;/\g;
  const hasSignOutImport = signOutImportRegex.test(content);

    // --- Inject or replace signout-btn event listener ---
    const signOutEventListener = [
      'document',
      '  .getElementById("signout-btn")',
      '  ?.addEventListener("click", async () => {',
      '    try {',
      '      await signOut();',
      '      document.cookie = "userEmail=; Max-Age=0; path=/";',
      '      document.cookie = "idToken=; Max-Age=0; path=/";',
      '      document.location.href = "/sign-in";',
      '    } catch (e) {',
      '      await signOut();',
      '    }',
      '  });'
    ].join('\\n');


  // Find the target <script> tag (one containing signout-btn or the first one)
  const scriptTagRegex = /(<script\\b[^>]*>)([\\s\\S]*?)(document\\s*\\.\\s*getElementById\\s*\\(\\s*"signout-btn"\\s*\\)\\s*\\?\\.\\s*addEventListener\\s*\\(\\s*"click"\\s*,\\s*async\\s*\\(\\s*\\)\\s*=>\\s*\\{[\s\S]*?await\\s+signOut\\s*\\(\\s*\\)\\s*;\\s*[\s\S]*?\\}\\s*\\)\\s*;)([\\s\\S]*?)(<\\/\script>)/;
  const scriptTags = content.match(/<script\\b[^>]*>[\\s\\S]*?<\\/script>/g);

  if (scriptTagRegex.test(content)) {
    content = content.replace(scriptTagRegex, \`$1$2\${signOutEventListener}$4$5\`);
    console.log("Replaced signout-btn event listener in Header.astro.");
  } else if (scriptTags) {
    // If no signout-btn listener exists, add it to the first script tag
    content = content.replace(
      scriptTagRegex,
      \`$1$2\n\${signOutEventListener}\n$4$5\`
    );
    console.log("Added signout-btn event listener to the first <script> tag in Header.astro.");
  }


  if (hasSignOutImport) {
    console.log("Found auth-astro signOut import. Attempting replacement...");
    content = content.replace(signOutImportRegex, amplifyImports);
    console.log("Replaced auth-astro signOut import with Amplify imports.");
  } else {
    console.log("No auth-astro signOut import found in Header.astro.");
    // Check if Amplify imports are already present to avoid duplicates
    if (!content.includes('import { signOut } from "@aws-amplify/auth";')) {
      // Find all <script> tags and add imports to the first one
      const scriptStartRegex = /(<script\\b[^>]*>)/;
      if (scriptStartRegex.test(content)) {
        content = content.replace(
          scriptStartRegex,
          \`$1\\n\${amplifyImports}\\n\`
        );
        console.log("Added Amplify imports to the first <script> tag in Header.astro.");
      }

    }
  }

  // --- Inject custom session logic ---
  const sessionRegex = /let session\\s*=\\s*null;[\\s\\S]*?const logo\\s*=\\s*{/m;
  const injectionLogic = [
    'let session = null;',
    'if (isAuthEnabled()) {',
    '  session = await getSession(Astro.request);',
    '} else {',
    '  // Inject email from cookie when isAuthEnabled is false',
    '  const cookieEmail = Astro.cookies.get("userEmail")?.value;',
    '  if (cookieEmail) {',
    '    session = {',
    '      user: {',
    '        email: cookieEmail,',
    '        name: cookieEmail.split("@")[0] || "User", // Fallback name from email',
    '        image: null // You can add a fallback image URL if needed',
    '      }',
    '    };',
    '  }',
    '}',
    'const logo = {'
  ].join('\\n');

  if (sessionRegex.test(content)) {
    content = content.replace(sessionRegex, injectionLogic);
    console.log("Header.astro updated with custom session logic (replaced existing session block).");
  } else if (!content.includes('session = await getSession(Astro.request);')) {
    // Inject session logic in the frontmatter
    const frontmatterEndRegex = /---[\\s\\S]*?---/;
    if (frontmatterEndRegex.test(content)) {
      content = content.replace(
        frontmatterEndRegex,
        (match) => \`\${match}\\n\${injectionLogic}\`
      );   
      console.log("Header.astro injected with custom session logic in frontmatter.");
    } else {
      // If no frontmatter, add one with the session logic
      content = \`---\\n\${injectionLogic}\\n---\\n\${content}\`;
      console.log("Created new frontmatter with custom session logic in Header.astro.");
    }
  } else {
    console.log("Session logic already present in Header.astro.");
  }

// Write the updated content back to the file
  try {
    fs.writeFileSync(headerAstroPathForPatch, content, "utf8");
    console.log("Successfully wrote updated content to Header.astro.");
  } catch (error) {
    console.error("Error writing to Header.astro:", error);
  }

};
`;

async function patchEventCatalog() {
  try {
    let content = fs.readFileSync(eventcatalogPath, "utf8");
    const copyCoreRegex = /var copyCore\s*=\s*\(\)\s*=>\s*{[\s\S]*?};/;

    if (!copyCoreRegex.test(content)) {
      console.error("No copyCore function found in eventcatalog.js");
      return;
    }

    content = content.replace(copyCoreRegex, updatedCopyCore);
    await fs.writeFileSync(eventcatalogPath, content, "utf8");
    console.log(
      "Updated eventcatalog.js with custom session logic and signOut import."
    );
  } catch (err) {
    console.log("Got error", err);
  }
}

patchEventCatalog();
