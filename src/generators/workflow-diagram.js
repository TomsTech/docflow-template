/**
 * DocFlow Workflow Diagram Generator
 * Generate flowcharts from GitHub Actions YAML files
 */

import fse from 'fs-extra';
import { join, basename } from 'path';
import { glob } from 'glob';

/**
 * Generate workflow diagram from GitHub Actions YAML
 */
export async function generateWorkflowDiagram(workflowPath) {
  if (!await fse.pathExists(workflowPath)) {
    throw new Error(`Workflow file not found: ${workflowPath}`);
  }

  const content = await fse.readFile(workflowPath, 'utf-8');
  const workflow = parseGitHubActionsWorkflow(content);

  return {
    workflow,
    diagram: buildMermaidFlowchart(workflow),
    name: workflow.name || basename(workflowPath, '.yml')
  };
}

/**
 * Generate diagrams for all workflows in a directory
 */
export async function generateAllWorkflowDiagrams(cwd, options = {}) {
  const workflowsPath = options.workflowsPath || join(cwd, '.github', 'workflows');

  if (!await fse.pathExists(workflowsPath)) {
    throw new Error('No .github/workflows directory found');
  }

  const workflowFiles = await glob('*.{yml,yaml}', {
    cwd: workflowsPath,
    absolute: true
  });

  if (workflowFiles.length === 0) {
    throw new Error('No workflow files found in .github/workflows');
  }

  const diagrams = [];

  for (const file of workflowFiles) {
    try {
      const result = await generateWorkflowDiagram(file);
      diagrams.push(result);
    } catch (error) {
      console.warn(`  Warning: Failed to parse ${basename(file)}: ${error.message}`);
    }
  }

  return {
    diagrams,
    format: options.format || 'markdown',
    outputPath: options.output
  };
}

/**
 * Parse GitHub Actions workflow YAML (simplified parser)
 */
function parseGitHubActionsWorkflow(content) {
  const workflow = {
    name: '',
    triggers: [],
    jobs: []
  };

  // Parse workflow name
  const nameMatch = content.match(/^name:\s*(.+)$/m);
  if (nameMatch) {
    workflow.name = nameMatch[1].replace(/['"]/g, '').trim();
  }

  // Parse triggers (on:)
  const onMatch = content.match(/^on:\s*$/m);
  if (onMatch) {
    const onSection = extractSection(content, onMatch.index + onMatch[0].length);
    const triggerMatches = onSection.matchAll(/^\s{2}(\w+):/gm);
    for (const match of triggerMatches) {
      workflow.triggers.push(match[1]);
    }

    // Check for simple trigger format
    const simpleTrigger = content.match(/^on:\s*(\w+)\s*$/m);
    if (simpleTrigger) {
      workflow.triggers.push(simpleTrigger[1]);
    }
  }

  // Parse jobs
  const jobsMatch = content.match(/^jobs:\s*$/m);
  if (jobsMatch) {
    const jobsSection = extractSection(content, jobsMatch.index + jobsMatch[0].length);
    const jobMatches = jobsSection.matchAll(/^\s{2}([\w-]+):/gm);

    for (const match of jobMatches) {
      const jobName = match[1];
      const jobStartIndex = match.index;
      const nextJobMatch = jobsSection.slice(jobStartIndex + match[0].length).match(/^\s{2}[\w-]+:/m);
      const jobEndIndex = nextJobMatch
        ? jobStartIndex + match[0].length + nextJobMatch.index
        : jobsSection.length;

      const jobContent = jobsSection.slice(jobStartIndex, jobEndIndex);

      const job = {
        id: jobName,
        name: jobName,
        needs: [],
        steps: [],
        runsOn: '',
        condition: ''
      };

      // Parse job name
      const jobNameMatch = jobContent.match(/name:\s*(.+)$/m);
      if (jobNameMatch) {
        job.name = jobNameMatch[1].replace(/['"]/g, '').trim();
      }

      // Parse needs (dependencies)
      const needsMatch = jobContent.match(/needs:\s*\[([^\]]+)\]/);
      if (needsMatch) {
        job.needs = needsMatch[1].split(',').map(n => n.trim().replace(/['"]/g, ''));
      } else {
        const needsSingleMatch = jobContent.match(/needs:\s*(\w+)/);
        if (needsSingleMatch) {
          job.needs = [needsSingleMatch[1]];
        }
      }

      // Parse runs-on
      const runsOnMatch = jobContent.match(/runs-on:\s*(.+)$/m);
      if (runsOnMatch) {
        job.runsOn = runsOnMatch[1].replace(/['"]/g, '').trim();
      }

      // Parse if condition
      const ifMatch = jobContent.match(/if:\s*(.+)$/m);
      if (ifMatch) {
        job.condition = ifMatch[1].trim();
      }

      // Parse steps
      const stepsMatch = jobContent.match(/steps:/);
      if (stepsMatch) {
        const stepsSection = jobContent.slice(stepsMatch.index + stepsMatch[0].length);
        const stepMatches = stepsSection.matchAll(/^\s{4}-\s+name:\s*(.+)$/gm);

        for (const stepMatch of stepMatches) {
          const stepName = stepMatch[1].replace(/['"]/g, '').trim();

          // Find the uses or run for this step
          const stepStartIndex = stepMatch.index;
          const nextStepMatch = stepsSection.slice(stepStartIndex + stepMatch[0].length).match(/^\s{4}-\s+name:/m);
          const stepEndIndex = nextStepMatch
            ? stepStartIndex + stepMatch[0].length + nextStepMatch.index
            : stepsSection.length;

          const stepContent = stepsSection.slice(stepStartIndex, stepEndIndex);

          const step = {
            name: stepName,
            uses: '',
            run: '',
            condition: ''
          };

          const usesMatch = stepContent.match(/uses:\s*(.+)$/m);
          if (usesMatch) {
            step.uses = usesMatch[1].replace(/['"]/g, '').trim();
          }

          const runMatch = stepContent.match(/run:\s*(.+)$/m);
          if (runMatch) {
            step.run = runMatch[1].replace(/['"]/g, '').trim();
          }

          const stepIfMatch = stepContent.match(/if:\s*(.+)$/m);
          if (stepIfMatch) {
            step.condition = stepIfMatch[1].trim();
          }

          job.steps.push(step);
        }
      }

      workflow.jobs.push(job);
    }
  }

  return workflow;
}

/**
 * Extract a YAML section (helper for parsing)
 */
function extractSection(content, startIndex) {
  const lines = content.slice(startIndex).split('\n');
  const sectionLines = [];
  let baseIndent = null;

  for (const line of lines) {
    if (line.trim() === '') {
      sectionLines.push(line);
      continue;
    }

    const indent = line.match(/^\s*/)[0].length;

    if (baseIndent === null) {
      baseIndent = indent;
      sectionLines.push(line);
    } else if (indent >= baseIndent) {
      sectionLines.push(line);
    } else {
      break;
    }
  }

  return sectionLines.join('\n');
}

/**
 * Build Mermaid flowchart from workflow
 */
function buildMermaidFlowchart(workflow) {
  const lines = [];
  lines.push('```mermaid');
  lines.push('flowchart TD');
  lines.push('');

  // Start node (triggers)
  if (workflow.triggers.length > 0) {
    const triggers = workflow.triggers.join(', ');
    lines.push(`  START([${triggers}])`);
    lines.push('');
  } else {
    lines.push('  START([Workflow Start])');
    lines.push('');
  }

  // Job nodes
  for (const job of workflow.jobs) {
    const jobId = sanitizeId(job.id);
    const label = escapeLabel(job.name || job.id);

    // Job node with condition
    if (job.condition) {
      const condId = `${jobId}_cond`;
      lines.push(`  ${condId}{${escapeLabel(job.condition)}}`);
      lines.push(`  ${jobId}["${label}"]`);
    } else {
      lines.push(`  ${jobId}["${label}"]`);
    }

    // Add steps as subnodes (optional detail)
    if (job.steps.length > 0 && job.steps.length <= 5) {
      for (let i = 0; i < job.steps.length; i++) {
        const step = job.steps[i];
        const stepId = `${jobId}_step${i}`;
        const stepLabel = escapeLabel(step.name);

        if (step.condition) {
          const stepCondId = `${stepId}_cond`;
          lines.push(`  ${stepCondId}{${escapeLabel(step.condition)}}`);
          lines.push(`  ${stepId}["${stepLabel}"]`);
        } else {
          lines.push(`  ${stepId}["${stepLabel}"]`);
        }
      }
    }

    lines.push('');
  }

  // End node
  lines.push('  END([End])');
  lines.push('');

  // Connections
  const jobsWithoutDeps = workflow.jobs.filter(j => j.needs.length === 0);

  // Connect start to jobs without dependencies
  if (jobsWithoutDeps.length > 0) {
    for (const job of jobsWithoutDeps) {
      const jobId = sanitizeId(job.id);

      if (job.condition) {
        const condId = `${jobId}_cond`;
        lines.push(`  START --> ${condId}`);
        lines.push(`  ${condId} -->|true| ${jobId}`);
      } else {
        lines.push(`  START --> ${jobId}`);
      }
    }
  }

  // Connect jobs based on needs
  for (const job of workflow.jobs) {
    const jobId = sanitizeId(job.id);

    for (const need of job.needs) {
      const needId = sanitizeId(need);

      if (job.condition) {
        const condId = `${jobId}_cond`;
        lines.push(`  ${needId} --> ${condId}`);
        lines.push(`  ${condId} -->|true| ${jobId}`);
      } else {
        lines.push(`  ${needId} --> ${jobId}`);
      }
    }

    // Connect job to steps
    if (job.steps.length > 0 && job.steps.length <= 5) {
      for (let i = 0; i < job.steps.length; i++) {
        const stepId = `${jobId}_step${i}`;
        const prevStepId = i === 0 ? jobId : `${jobId}_step${i - 1}`;

        if (job.steps[i].condition) {
          const stepCondId = `${stepId}_cond`;
          lines.push(`  ${prevStepId} --> ${stepCondId}`);
          lines.push(`  ${stepCondId} -->|true| ${stepId}`);
        } else {
          lines.push(`  ${prevStepId} --> ${stepId}`);
        }
      }

      // Connect last step to end if no other job depends on this
      const lastStepId = `${jobId}_step${job.steps.length - 1}`;
      const isDependency = workflow.jobs.some(j => j.needs.includes(job.id));
      if (!isDependency) {
        lines.push(`  ${lastStepId} --> END`);
      }
    } else {
      // No steps or too many steps, connect job directly to end
      const isDependency = workflow.jobs.some(j => j.needs.includes(job.id));
      if (!isDependency) {
        lines.push(`  ${jobId} --> END`);
      }
    }
  }

  lines.push('');

  // Styling
  lines.push('  classDef jobNode fill:#1f77b4,stroke:#333,stroke-width:2px,color:#fff');
  lines.push('  classDef stepNode fill:#aec7e8,stroke:#333,stroke-width:1px');
  lines.push('  classDef condNode fill:#ff7f0e,stroke:#333,stroke-width:2px');

  for (const job of workflow.jobs) {
    const jobId = sanitizeId(job.id);
    lines.push(`  class ${jobId} jobNode`);

    if (job.condition) {
      lines.push(`  class ${jobId}_cond condNode`);
    }

    for (let i = 0; i < Math.min(job.steps.length, 5); i++) {
      const stepId = `${jobId}_step${i}`;
      lines.push(`  class ${stepId} stepNode`);

      if (job.steps[i].condition) {
        lines.push(`  class ${stepId}_cond condNode`);
      }
    }
  }

  lines.push('```');
  return lines.join('\n');
}

/**
 * Sanitize ID for Mermaid
 */
function sanitizeId(id) {
  return id
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/^(\d)/, 'n$1');
}

/**
 * Escape label text for Mermaid
 */
function escapeLabel(text) {
  return text
    .replace(/"/g, '#quot;')
    .replace(/\[/g, '#91;')
    .replace(/\]/g, '#93;')
    .replace(/\n/g, ' ')
    .trim();
}

/**
 * Save workflow diagrams to file
 */
export async function saveWorkflowDiagrams(result, outputPath, format = 'markdown') {
  const dir = join(outputPath, '..');
  await fse.ensureDir(dir);

  if (format === 'separate') {
    // Save each diagram to separate .mmd file
    for (const wf of result.diagrams) {
      const filename = outputPath.replace(/\.(md|mmd)$/, `-${sanitizeId(wf.name)}.mmd`);
      await fse.writeFile(filename, wf.diagram.replace(/```mermaid\n|\n```/g, ''));
      console.log(`  Saved: ${filename}`);
    }
  } else {
    // Save as markdown with embedded diagrams
    const lines = [];
    lines.push('# GitHub Actions Workflows\n');
    lines.push('> Auto-generated by DocFlow\n');

    for (const wf of result.diagrams) {
      lines.push(`## ${wf.name}\n`);

      // Workflow metadata
      if (wf.workflow.triggers.length > 0) {
        lines.push(`**Triggers**: ${wf.workflow.triggers.join(', ')}\n`);
      }

      lines.push(`**Jobs**: ${wf.workflow.jobs.length}\n`);

      // Job details
      lines.push('### Jobs\n');
      for (const job of wf.workflow.jobs) {
        lines.push(`- **${job.name}** (${job.id})`);
        if (job.runsOn) {
          lines.push(`  - Runs on: \`${job.runsOn}\``);
        }
        if (job.needs.length > 0) {
          lines.push(`  - Depends on: ${job.needs.join(', ')}`);
        }
        if (job.condition) {
          lines.push(`  - Condition: \`${job.condition}\``);
        }
        if (job.steps.length > 0) {
          lines.push(`  - Steps: ${job.steps.length}`);
        }
      }

      lines.push('');

      // Diagram
      lines.push('### Workflow Diagram\n');
      lines.push(wf.diagram);
      lines.push('');
    }

    await fse.writeFile(outputPath, lines.join('\n'));
    console.log(`  Saved: ${outputPath}`);
  }
}
