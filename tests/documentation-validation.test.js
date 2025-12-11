/**
 * DocFlow Documentation Validation Tests
 * Tests to ensure generated documentation meets minimum quality standards
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import fse from 'fs-extra';
import { join } from 'path';

// Import functions to test
import { detectProjectType, detectTechStack } from '../src/cli/utils/detect.js';
import { scanCodebase, extractSymbols, checkDocumentation } from '../src/generators/coverage.js';

/**
 * Project Type Detection Tests
 */
describe('detectProjectType', () => {
  test('should detect Node.js project from package.json', async () => {
    const tmpDir = join(process.cwd(), '.test-tmp-node');
    await fse.ensureDir(tmpDir);
    await fse.writeJson(join(tmpDir, 'package.json'), { name: 'test' });
    
    try {
      const type = await detectProjectType(tmpDir);
      assert.strictEqual(type, 'node');
    } finally {
      await fse.remove(tmpDir);
    }
  });

  test('should detect Python project from .py files', async () => {
    const tmpDir = join(process.cwd(), '.test-tmp-py');
    await fse.ensureDir(tmpDir);
    await fse.writeFile(join(tmpDir, 'main.py'), 'def hello(): pass');
    
    try {
      const type = await detectProjectType(tmpDir);
      assert.strictEqual(type, 'python');
    } finally {
      await fse.remove(tmpDir);
    }
  });

  test('should detect PowerShell project from .ps1 files', async () => {
    const tmpDir = join(process.cwd(), '.test-tmp-ps');
    await fse.ensureDir(tmpDir);
    await fse.writeFile(join(tmpDir, 'script.ps1'), 'function Get-Hello { }');
    
    try {
      const type = await detectProjectType(tmpDir);
      assert.strictEqual(type, 'powershell');
    } finally {
      await fse.remove(tmpDir);
    }
  });

  test('should detect Python from requirements.txt', async () => {
    const tmpDir = join(process.cwd(), '.test-tmp-py-req');
    await fse.ensureDir(tmpDir);
    await fse.writeFile(join(tmpDir, 'requirements.txt'), 'flask==2.0.0');
    
    try {
      const type = await detectProjectType(tmpDir);
      assert.strictEqual(type, 'python');
    } finally {
      await fse.remove(tmpDir);
    }
  });

  test('should return generic for empty directory', async () => {
    const tmpDir = join(process.cwd(), '.test-tmp-empty');
    await fse.ensureDir(tmpDir);
    
    try {
      const type = await detectProjectType(tmpDir);
      assert.strictEqual(type, 'generic');
    } finally {
      await fse.remove(tmpDir);
    }
  });
});

/**
 * Coverage Scanning Tests
 */
describe('scanCodebase', () => {
  test('should find Python files', async () => {
    const tmpDir = join(process.cwd(), '.test-tmp-scan-py');
    await fse.ensureDir(tmpDir);
    await fse.writeFile(join(tmpDir, 'app.py'), 'def main(): pass');
    await fse.writeFile(join(tmpDir, 'util.py'), 'def helper(): pass');
    
    try {
      const files = await scanCodebase(tmpDir);
      assert.ok(files.length >= 2, 'Should find Python files');
      assert.ok(files.some(f => f.includes('app.py')));
      assert.ok(files.some(f => f.includes('util.py')));
    } finally {
      await fse.remove(tmpDir);
    }
  });

  test('should find PowerShell files', async () => {
    const tmpDir = join(process.cwd(), '.test-tmp-scan-ps');
    await fse.ensureDir(tmpDir);
    await fse.writeFile(join(tmpDir, 'script.ps1'), 'function Test { }');
    
    try {
      const files = await scanCodebase(tmpDir);
      assert.ok(files.length >= 1, 'Should find PowerShell files');
      assert.ok(files.some(f => f.includes('.ps1')));
    } finally {
      await fse.remove(tmpDir);
    }
  });

  test('should exclude node_modules', async () => {
    const tmpDir = join(process.cwd(), '.test-tmp-exclude');
    await fse.ensureDir(join(tmpDir, 'node_modules'));
    await fse.writeFile(join(tmpDir, 'index.js'), 'export default {}');
    await fse.writeFile(join(tmpDir, 'node_modules', 'dep.js'), 'module.exports = {}');
    
    try {
      const files = await scanCodebase(tmpDir);
      assert.ok(!files.some(f => f.includes('node_modules')), 'Should exclude node_modules');
    } finally {
      await fse.remove(tmpDir);
    }
  });
});

/**
 * Symbol Extraction Tests
 */
describe('extractSymbols', () => {
  test('should extract Python functions', async () => {
    const content = `def hello():\n    return "world"\n\ndef goodbye():\n    pass`;
    const symbols = await extractSymbols('/test.py', content);
    
    assert.ok(symbols.length === 2, 'Should find 2 functions');
    assert.ok(symbols.some(s => s.name === 'hello'));
    assert.ok(symbols.some(s => s.name === 'goodbye'));
  });

  test('should extract Python classes', async () => {
    const content = `class MyClass:\n    def __init__(self):\n        pass`;
    const symbols = await extractSymbols('/test.py', content);
    
    assert.ok(symbols.some(s => s.name === 'MyClass' && s.type === 'class'));
  });

  test('should extract PowerShell functions', async () => {
    const content = `function Get-Data {\n    param()\n}\n\nfunction Set-Config {\n}`;
    const symbols = await extractSymbols('/test.ps1', content);
    
    assert.ok(symbols.length >= 2, 'Should find PowerShell functions');
    assert.ok(symbols.some(s => s.name === 'Get-Data'));
    assert.ok(symbols.some(s => s.name === 'Set-Config'));
  });

  test('should extract JavaScript functions', async () => {
    const content = `function hello() { }\n\nexport const world = () => { };`;
    const symbols = await extractSymbols('/test.js', content);
    
    assert.ok(symbols.some(s => s.name === 'hello'));
  });
});

/**
 * Documentation Check Tests
 */
describe('checkDocumentation', () => {
  test('should detect JSDoc comments', () => {
    const content = `/**\n * Hello function\n */\nfunction hello() { }`;
    const symbol = { name: 'hello', type: 'function', line: 4, file: '/test.js' };
    
    const isDocumented = checkDocumentation(symbol, content);
    assert.strictEqual(isDocumented, true, 'Should detect JSDoc');
  });

  test('should detect Python docstrings', () => {
    const content = `def hello():\n    """Hello docstring"""\n    pass`;
    const symbol = { name: 'hello', type: 'function', line: 1, file: '/test.py' };
    
    const isDocumented = checkDocumentation(symbol, content);
    assert.strictEqual(isDocumented, true, 'Should detect docstring');
  });

  test('should detect undocumented functions', () => {
    const content = 'function noDoc() { }';
    const symbol = { name: 'noDoc', type: 'function', line: 1, file: '/test.js' };
    
    const isDocumented = checkDocumentation(symbol, content);
    assert.strictEqual(isDocumented, false, 'Should detect missing docs');
  });
});
