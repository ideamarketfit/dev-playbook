#!/usr/bin/env node

import { executeWorkflow } from './common-function.js';
import { tool_page_workflow } from './configurations/tool-page-seo-workflow.js';
import { template_page_workflow } from './configurations/template-page-seo-workflow.js';

async function main() {
  const [workflowType, idInput] = process.argv.slice(2);
  
  if (!workflowType || !idInput) {
    console.error('Usage: yarn workflow <workflow-type> <rowId or startId-endId>');
    console.error('Examples:\n  yarn workflow tool-page 1\n  yarn workflow tool-page 1-20');
    process.exit(1);
  }

  let startId: number;
  let endId: number;

  if (idInput.includes('-')) {
    // Handle range format (e.g., "1-20")
    [startId, endId] = idInput.split('-').map(id => parseInt(id));
    
    if (isNaN(startId) || isNaN(endId) || startId > endId) {
      console.error('Invalid ID range. Format should be: startId-endId (e.g., 1-20)');
      process.exit(1);
    }
  } else {
    // Handle single index format (e.g., "1")
    startId = endId = parseInt(idInput);
    
    if (isNaN(startId)) {
      console.error('Invalid row ID. Must be a number.');
      process.exit(1);
    }
  }

  try {
    for (let rowId = startId; rowId <= endId; rowId++) {
      console.log(`\nProcessing row ID ${rowId}...`);
      console.log(`Running SEO workflow '${workflowType}' for row ID: ${rowId}...`);
      
      let workflow;
      let tableName;

      switch (workflowType) {
        case 'tool-page':
          workflow = tool_page_workflow;
          tableName = 'tool_page';
          break;
        case 'template-page':
          workflow = template_page_workflow;
          tableName = 'template_page';
          break;
        default:
          throw new Error(`Unknown workflow type: ${workflowType}`);
      }

      try {
        const result = await executeWorkflow(tableName, rowId, workflow);
        console.log(`Row ${rowId} completed successfully!`);
        console.log('Result:', JSON.stringify(result, null, 2));
      } catch (error) {
        console.error(`Failed for row ${rowId}:`, error instanceof Error ? error.message : 'Unknown error');
        continue; // Continue with next row even if current one fails
      }
      
      // Add a small delay between processing multiple rows
      if (rowId < endId) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\nAll rows processed!');
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error occurred');
    process.exit(1);
  }
}

main(); 