/**
 * DocFlow ERD Generator
 * Generate Entity Relationship Diagrams from Prisma schemas, TypeORM entities, or SQL files
 */

import fse from 'fs-extra';
import { join } from 'path';
import { glob } from 'glob';

/**
 * Parse Prisma schema file and generate Mermaid ERD
 */
export async function generatePrismaERD(schemaPath) {
  if (!await fse.pathExists(schemaPath)) {
    throw new Error(`Prisma schema not found at: ${schemaPath}`);
  }

  const content = await fse.readFile(schemaPath, 'utf-8');
  const models = parsePrismaModels(content);
  return buildMermaidERD(models);
}

/**
 * Parse TypeORM entities and generate Mermaid ERD
 */
export async function generateTypeORMERD(entitiesPath) {
  if (!await fse.pathExists(entitiesPath)) {
    throw new Error(`Entities path not found: ${entitiesPath}`);
  }

  const entityFiles = await glob('**/*.entity.{ts,js}', {
    cwd: entitiesPath,
    absolute: true
  });

  if (entityFiles.length === 0) {
    throw new Error('No TypeORM entity files found');
  }

  const entities = [];
  for (const file of entityFiles) {
    const content = await fse.readFile(file, 'utf-8');
    const entity = parseTypeORMEntity(content);
    if (entity) {
      entities.push(entity);
    }
  }

  return buildMermaidERD(entities);
}

/**
 * Parse SQL DDL and generate Mermaid ERD
 */
export async function generateSQLERD(sqlPath) {
  if (!await fse.pathExists(sqlPath)) {
    throw new Error(`SQL file not found: ${sqlPath}`);
  }

  const content = await fse.readFile(sqlPath, 'utf-8');
  const tables = parseSQLTables(content);
  return buildMermaidERD(tables);
}

/**
 * Auto-detect schema type and generate ERD
 */
export async function generateERD(cwd, options = {}) {
  const results = {
    diagrams: [],
    format: options.format || 'markdown',
    outputPath: options.output
  };

  // Try Prisma
  const prismaPath = join(cwd, 'prisma', 'schema.prisma');
  if (await fse.pathExists(prismaPath)) {
    const diagram = await generatePrismaERD(prismaPath);
    results.diagrams.push({
      type: 'prisma',
      name: 'Prisma Schema',
      content: diagram
    });
  }

  // Try TypeORM
  const typeormPaths = [
    join(cwd, 'src', 'entities'),
    join(cwd, 'entities'),
    join(cwd, 'src', 'database', 'entities')
  ];

  for (const path of typeormPaths) {
    if (await fse.pathExists(path)) {
      try {
        const diagram = await generateTypeORMERD(path);
        results.diagrams.push({
          type: 'typeorm',
          name: 'TypeORM Entities',
          content: diagram
        });
        break;
      } catch (e) {
        // Try next path
      }
    }
  }

  // Try SQL
  const sqlFiles = await glob('**/*.sql', {
    cwd,
    ignore: ['**/node_modules/**', '**/migrations/**'],
    absolute: true
  });

  for (const sqlFile of sqlFiles.slice(0, 1)) { // Only first SQL file
    try {
      const diagram = await generateSQLERD(sqlFile);
      results.diagrams.push({
        type: 'sql',
        name: `SQL Schema (${sqlFile.split(/[/\\]/).pop()})`,
        content: diagram
      });
    } catch (e) {
      // Skip this file
    }
  }

  if (results.diagrams.length === 0) {
    throw new Error('No database schemas found. Supported: Prisma, TypeORM, SQL DDL');
  }

  return results;
}

/**
 * Parse Prisma models from schema content
 */
function parsePrismaModels(content) {
  const models = [];
  const modelRegex = /model\s+(\w+)\s*{([^}]+)}/g;
  let match;

  while ((match = modelRegex.exec(content)) !== null) {
    const [, name, body] = match;
    const fields = [];
    const relations = [];

    // Parse fields
    const fieldLines = body.split('\n').filter(line => line.trim() && !line.trim().startsWith('@@'));

    for (const line of fieldLines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) continue;

      // Field pattern: name Type @attributes
      const fieldMatch = trimmed.match(/^(\w+)\s+(\w+(\[\])?(\?)?)\s*(.*)?$/);
      if (fieldMatch) {
        const [, fieldName, fieldType, isArray, isOptional, attributes] = fieldMatch;
        const cleanType = fieldType.replace(/[\[\]?]/g, '');

        // Check if it's a relation
        if (cleanType !== cleanType.toLowerCase() &&
            !['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Decimal', 'Bytes'].includes(cleanType)) {
          relations.push({
            name: fieldName,
            type: cleanType,
            cardinality: isArray ? 'many' : 'one',
            optional: !!isOptional
          });
        } else {
          const isPrimary = attributes?.includes('@id');
          const isUnique = attributes?.includes('@unique');

          fields.push({
            name: fieldName,
            type: cleanType,
            isPrimary,
            isUnique,
            isOptional: !!isOptional,
            isArray: !!isArray
          });
        }
      }
    }

    models.push({ name, fields, relations });
  }

  return models;
}

/**
 * Parse TypeORM entity from file content
 */
function parseTypeORMEntity(content) {
  // Extract entity name from @Entity decorator or class name
  const entityMatch = content.match(/@Entity\(['"]?(\w+)?['"]?\)\s*export\s+class\s+(\w+)/);
  if (!entityMatch) return null;

  const name = entityMatch[1] || entityMatch[2];
  const fields = [];
  const relations = [];

  // Parse columns
  const columnRegex = /@(Column|PrimaryGeneratedColumn|PrimaryColumn|CreateDateColumn|UpdateDateColumn)\(([^)]*)\)\s+(\w+)(?:\?)?:\s*(\w+)/g;
  let match;

  while ((match = columnRegex.exec(content)) !== null) {
    const [, decorator, options, fieldName, fieldType] = match;
    fields.push({
      name: fieldName,
      type: fieldType,
      isPrimary: decorator.includes('Primary'),
      isUnique: options?.includes('unique: true'),
      isOptional: content.includes(`${fieldName}?:`)
    });
  }

  // Parse relations
  const relationRegex = /@(OneToOne|OneToMany|ManyToOne|ManyToMany)\(\s*\(\)\s*=>\s*(\w+)/g;
  while ((match = relationRegex.exec(content)) !== null) {
    const [, relationType, targetEntity] = match;

    // Find the field name (next line typically)
    const fieldMatch = content.slice(match.index).match(/@(OneToOne|OneToMany|ManyToOne|ManyToMany)[^}]+\}\)\s+(\w+)/);
    if (fieldMatch) {
      relations.push({
        name: fieldMatch[2],
        type: targetEntity,
        cardinality: relationType.includes('Many') ? 'many' : 'one'
      });
    }
  }

  return { name, fields, relations };
}

/**
 * Parse SQL DDL tables
 */
function parseSQLTables(content) {
  const tables = [];
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?\s*\(([^;]+)\);?/gi;
  let match;

  while ((match = tableRegex.exec(content)) !== null) {
    const [, name, body] = match;
    const fields = [];
    const relations = [];

    // Parse columns
    const lines = body.split(',').map(l => l.trim());

    for (const line of lines) {
      if (line.toUpperCase().includes('PRIMARY KEY') ||
          line.toUpperCase().includes('FOREIGN KEY') ||
          line.toUpperCase().includes('CONSTRAINT') ||
          line.toUpperCase().includes('UNIQUE KEY') ||
          line.toUpperCase().includes('KEY ')) {

        // Handle foreign keys
        const fkMatch = line.match(/FOREIGN\s+KEY\s*\(`?(\w+)`?\)\s*REFERENCES\s+`?(\w+)`?/i);
        if (fkMatch) {
          relations.push({
            name: fkMatch[1],
            type: fkMatch[2],
            cardinality: 'one'
          });
        }
        continue;
      }

      const colMatch = line.match(/`?(\w+)`?\s+(\w+(?:\([^)]+\))?)/i);
      if (colMatch) {
        const [, fieldName, fieldType] = colMatch;
        const isPrimary = line.toUpperCase().includes('PRIMARY KEY');
        const isUnique = line.toUpperCase().includes('UNIQUE');
        const isOptional = !line.toUpperCase().includes('NOT NULL');

        fields.push({
          name: fieldName,
          type: fieldType.split('(')[0],
          isPrimary,
          isUnique,
          isOptional
        });
      }
    }

    tables.push({ name, fields, relations });
  }

  return tables;
}

/**
 * Build Mermaid ERD from parsed entities
 */
function buildMermaidERD(entities) {
  const lines = [];
  lines.push('```mermaid');
  lines.push('erDiagram');
  lines.push('');

  // Define entities
  for (const entity of entities) {
    if (entity.fields.length === 0) continue;

    lines.push(`  ${entity.name} {`);

    for (const field of entity.fields) {
      const type = mapTypeToMermaid(field.type);
      const key = field.isPrimary ? 'PK' : field.isUnique ? 'UK' : '';
      const optional = field.isOptional ? '?' : '';
      const array = field.isArray ? '[]' : '';

      const keyStr = key ? ` ${key}` : '';
      const comment = `"${field.name}${optional}${array}"`;

      lines.push(`    ${type} ${field.name}${keyStr} ${comment}`);
    }

    lines.push('  }');
    lines.push('');
  }

  // Define relationships
  for (const entity of entities) {
    for (const relation of entity.relations) {
      const target = entities.find(e => e.name === relation.type);
      if (!target) continue;

      // Determine relationship type
      const targetHasBackRef = target.relations.some(r => r.type === entity.name);

      let relationSymbol;
      if (relation.cardinality === 'many') {
        relationSymbol = targetHasBackRef ? '}o--o{' : '}o--||';
      } else {
        relationSymbol = targetHasBackRef && target.relations.find(r => r.type === entity.name)?.cardinality === 'many'
          ? '||--o{'
          : '||--||';
      }

      lines.push(`  ${entity.name} ${relationSymbol} ${relation.type} : "${relation.name}"`);
    }
  }

  lines.push('```');
  return lines.join('\n');
}

/**
 * Map database types to Mermaid types
 */
function mapTypeToMermaid(type) {
  const typeMap = {
    'String': 'string',
    'Int': 'int',
    'Float': 'float',
    'Boolean': 'boolean',
    'DateTime': 'datetime',
    'Json': 'json',
    'Decimal': 'decimal',
    'number': 'int',
    'string': 'string',
    'boolean': 'boolean',
    'Date': 'datetime',
    'VARCHAR': 'string',
    'TEXT': 'string',
    'INTEGER': 'int',
    'BIGINT': 'bigint',
    'DECIMAL': 'decimal',
    'FLOAT': 'float',
    'BOOLEAN': 'boolean',
    'TIMESTAMP': 'datetime',
    'DATETIME': 'datetime',
    'DATE': 'date'
  };

  return typeMap[type] || type.toLowerCase();
}

/**
 * Save ERD diagram to file
 */
export async function saveERD(result, outputPath, format = 'markdown') {
  const dir = join(outputPath, '..');
  await fse.ensureDir(dir);

  if (format === 'separate') {
    // Save each diagram to separate .mmd file
    for (let i = 0; i < result.diagrams.length; i++) {
      const diagram = result.diagrams[i];
      const filename = outputPath.replace(/\.(md|mmd)$/, `-${diagram.type}.mmd`);
      await fse.writeFile(filename, diagram.content.replace(/```mermaid\n|\n```/g, ''));
      console.log(`  Saved: ${filename}`);
    }
  } else {
    // Save as markdown with embedded diagrams
    const lines = [];
    lines.push('# Entity Relationship Diagrams\n');
    lines.push('> Auto-generated by DocFlow\n');

    for (const diagram of result.diagrams) {
      lines.push(`## ${diagram.name}\n`);
      lines.push(diagram.content);
      lines.push('');
    }

    await fse.writeFile(outputPath, lines.join('\n'));
    console.log(`  Saved: ${outputPath}`);
  }
}
