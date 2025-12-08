#!/usr/bin/env node

/**
 * Test script for DocFlow diagram generators
 * Usage: node test-generators.js
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fse from 'fs-extra';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import generators
const generatorPath = join(__dirname, '../../src/generators/index.js');
const { generatePrismaERD, generateWorkflowDiagram } = await import(generatorPath);

async function main() {
  console.log('Testing DocFlow Diagram Generators\n');

  try {
    // Test 1: Prisma ERD
    console.log('Test 1: Generating Prisma ERD...');
    const prismaSchemaPath = join(__dirname, 'sample-prisma-schema.prisma');

    if (await fse.pathExists(prismaSchemaPath)) {
      const erdDiagram = await generatePrismaERD(prismaSchemaPath);
      console.log('✓ Successfully generated Prisma ERD');
      console.log('Preview (first 500 chars):');
      console.log(erdDiagram.substring(0, 500) + '...\n');
    } else {
      console.log('✗ Sample Prisma schema not found\n');
    }

    // Test 2: Workflow Diagram
    console.log('Test 2: Generating Workflow Diagram...');
    const workflowPath = join(__dirname, 'sample-workflow.yml');

    if (await fse.pathExists(workflowPath)) {
      const workflowResult = await generateWorkflowDiagram(workflowPath);
      console.log('✓ Successfully generated Workflow diagram');
      console.log(`Workflow: ${workflowResult.name}`);
      console.log(`Jobs: ${workflowResult.workflow.jobs.length}`);
      console.log(`Triggers: ${workflowResult.workflow.triggers.join(', ')}`);
      console.log('Preview (first 500 chars):');
      console.log(workflowResult.diagram.substring(0, 500) + '...\n');
    } else {
      console.log('✗ Sample workflow not found\n');
    }

    // Test 3: Save outputs
    console.log('Test 3: Saving diagram outputs...');
    const outputDir = join(__dirname, 'output');
    await fse.ensureDir(outputDir);

    if (await fse.pathExists(prismaSchemaPath)) {
      const erdDiagram = await generatePrismaERD(prismaSchemaPath);
      const erdPath = join(outputDir, 'sample-erd.md');
      await fse.writeFile(erdPath, `# Sample ERD\n\n${erdDiagram}`);
      console.log(`✓ Saved ERD to: ${erdPath}`);
    }

    if (await fse.pathExists(workflowPath)) {
      const workflowResult = await generateWorkflowDiagram(workflowPath);
      const workflowDiagramPath = join(outputDir, 'sample-workflow.md');
      await fse.writeFile(
        workflowDiagramPath,
        `# Sample Workflow: ${workflowResult.name}\n\n${workflowResult.diagram}`
      );
      console.log(`✓ Saved Workflow diagram to: ${workflowDiagramPath}`);
    }

    console.log('\nAll tests completed successfully!');
    console.log('Check the output/ directory for generated files.');

  } catch (error) {
    console.error('Error during tests:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
