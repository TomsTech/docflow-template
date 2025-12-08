/**
 * DocFlow Template Utilities
 */

/**
 * Substitute variables in template content
 * Supports {{VAR}} and {{VAR:default}} syntax
 */
export function substituteVariables(content, variables) {
  // Match {{VAR}} or {{VAR:default}}
  return content.replace(/\{\{(\w+)(?::([^}]*))?\}\}/g, (match, name, defaultValue) => {
    if (variables[name] !== undefined) {
      return variables[name];
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    return match; // Keep original if not found
  });
}

/**
 * Extract variables from template
 */
export function extractVariables(content) {
  const matches = content.matchAll(/\{\{(\w+)(?::([^}]*))?\}\}/g);
  const variables = new Map();

  for (const match of matches) {
    const [, name, defaultValue] = match;
    if (!variables.has(name)) {
      variables.set(name, defaultValue || null);
    }
  }

  return Object.fromEntries(variables);
}

/**
 * Process template with context
 */
export function processTemplate(template, context) {
  let result = template;

  // Substitute variables
  result = substituteVariables(result, context.variables || {});

  // Process conditionals (simple if/endif)
  result = processConditionals(result, context);

  // Process loops (simple each/endeach)
  result = processLoops(result, context);

  return result;
}

/**
 * Process conditional blocks
 * Syntax: {{#if VAR}}...{{/if}}
 */
function processConditionals(content, context) {
  const pattern = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

  return content.replace(pattern, (match, varName, innerContent) => {
    const value = context.variables?.[varName] || context[varName];
    if (value) {
      return innerContent;
    }
    return '';
  });
}

/**
 * Process loop blocks
 * Syntax: {{#each ARRAY}}...{{/each}}
 */
function processLoops(content, context) {
  const pattern = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

  return content.replace(pattern, (match, arrayName, innerContent) => {
    const array = context.variables?.[arrayName] || context[arrayName];

    if (!Array.isArray(array)) {
      return '';
    }

    return array.map((item, index) => {
      let itemContent = innerContent;

      // Replace {{.}} with the item itself (for simple arrays)
      itemContent = itemContent.replace(/\{\{\.\}\}/g, item);

      // Replace {{@index}} with the index
      itemContent = itemContent.replace(/\{\{@index\}\}/g, index.toString());

      // Replace {{@first}} and {{@last}}
      itemContent = itemContent.replace(/\{\{@first\}\}/g, index === 0 ? 'true' : '');
      itemContent = itemContent.replace(/\{\{@last\}\}/g, index === array.length - 1 ? 'true' : '');

      // Replace {{item.property}} for objects
      if (typeof item === 'object') {
        for (const [key, value] of Object.entries(item)) {
          const propPattern = new RegExp(`\\{\\{item\\.${key}\\}\\}`, 'g');
          itemContent = itemContent.replace(propPattern, String(value));
        }
      }

      return itemContent;
    }).join('');
  });
}

/**
 * Generate slug from string
 */
export function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate title case
 */
export function titleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get current date in various formats
 */
export function getDateFormats() {
  const now = new Date();
  return {
    'YYYY-MM-DD': now.toISOString().split('T')[0],
    'DD/MM/YYYY': now.toLocaleDateString('en-AU'),
    'MMMM D, YYYY': now.toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' }),
    ISO: now.toISOString(),
    timestamp: now.getTime().toString(),
  };
}
