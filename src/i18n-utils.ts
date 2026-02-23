/**
 * Shorthand for chrome.i18n.getMessage.
 * Falls back to the key itself if message is not found.
 */
export function t(key: string, substitutions?: string | string[]): string {
  return chrome.i18n.getMessage(key, substitutions) || key;
}

const MSG_PATTERN = /__MSG_(\w+)__/g;

/**
 * Replace all __MSG_key__ placeholders in the current document.
 * Chrome only auto-substitutes these in manifest.json and CSS files,
 * so HTML needs this manual pass.
 */
export function localizeHtml(): void {
  // Text content of elements
  const elements = document.querySelectorAll("[data-i18n]");
  for (const el of elements) {
    const key = el.getAttribute("data-i18n")!;
    el.textContent = t(key);
  }

  // Replace __MSG_key__ in text nodes and common attributes
  replaceInTextNodes(document.body);
  replaceInAttributes(document.querySelectorAll("[title], [placeholder], [aria-label]"));
}

function replaceMsg(text: string): string {
  return text.replace(MSG_PATTERN, (_, key) => t(key));
}

function replaceInTextNodes(root: Node): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }
  for (const node of nodes) {
    if (node.nodeValue && MSG_PATTERN.test(node.nodeValue)) {
      node.nodeValue = replaceMsg(node.nodeValue);
    }
  }
}

function replaceInAttributes(elements: NodeListOf<Element>): void {
  for (const el of elements) {
    for (const attr of ["title", "placeholder", "aria-label"]) {
      const val = el.getAttribute(attr);
      if (val && MSG_PATTERN.test(val)) {
        el.setAttribute(attr, replaceMsg(val));
      }
    }
  }
}
