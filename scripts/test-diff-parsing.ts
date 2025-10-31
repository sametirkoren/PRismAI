// Test diff parsing with real GitHub diff format

const sampleDiff = `@@ -145,6 +147,26 @@ export async function reviewCodeWithClaude(
     }
   }
 
+  // Parse diff to extract actual line numbers
+  const parseDiffLineNumbers = (patch: string) => {
+    const lines = patch.split('\\n');
+    const lineInfo: Array<{lineNum: number, content: string, type: 'add' | 'remove' | 'context'}> = [];
+    let currentLine = 0;
+    
+    for (const line of lines) {
+      // Parse @@ header to get starting line number
+      const headerMatch = line.match(/^@@\\s+-\\d+,?\\d*\\s+\\+(\\d+),?\\d*\\s+@@/);
+      if (headerMatch) {
+        currentLine = parseInt(headerMatch[1]);
+        continue;
+      }
+      
+      if (line.startsWith('+')) {
+        lineInfo.push({ lineNum: currentLine, content: line.substring(1), type: 'add' });
+        currentLine++;
+      } else if (line.startsWith('-')) {
+        lineInfo.push({ lineNum: currentLine, content: line.substring(1), type: 'remove' });
+        // Don't increment for deletions
+      } else if (line.startsWith(' ')) {
+        lineInfo.push({ lineNum: currentLine, content: line.substring(1), type: 'context' });
+        currentLine++;
+      }
+    }
+    
+    return lineInfo;
+  };
+
   // Diff içeriğini daha iyi yapılandır
   const codeContent = prDetails.files
     .filter((file) => file.patch)`;

const parseDiffLineNumbers = (patch: string) => {
  const lines = patch.split('\n');
  const lineInfo: Array<{lineNum: number, content: string, type: 'add' | 'remove' | 'context'}> = [];
  let currentLine = 0;
  
  console.log('📝 Parsing diff...\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Parse @@ header to get starting line number
    const headerMatch = line.match(/^@@\s+-\d+,?\d*\s+\+(\d+),?\d*\s+@@/);
    if (headerMatch) {
      currentLine = parseInt(headerMatch[1]);
      console.log(`🔵 Chunk starts at line ${currentLine}`);
      continue;
    }
    
    if (line.startsWith('+')) {
      lineInfo.push({ lineNum: currentLine, content: line.substring(1), type: 'add' });
      console.log(`  ${currentLine} + ${line.substring(1).substring(0, 50)}`);
      currentLine++;
    } else if (line.startsWith('-')) {
      lineInfo.push({ lineNum: currentLine, content: line.substring(1), type: 'remove' });
      console.log(`  ${currentLine} - ${line.substring(1).substring(0, 50)}`);
      // Don't increment for deletions
    } else if (line.startsWith(' ')) {
      lineInfo.push({ lineNum: currentLine, content: line.substring(1), type: 'context' });
      currentLine++;
    }
  }
  
  return lineInfo;
};

console.log('🧪 Testing diff parsing...\n');
const result = parseDiffLineNumbers(sampleDiff);

console.log('\n📊 Results:');
console.log(`Total lines parsed: ${result.length}`);
console.log(`Added lines: ${result.filter(l => l.type === 'add').length}`);
console.log(`Removed lines: ${result.filter(l => l.type === 'remove').length}`);
console.log(`Context lines: ${result.filter(l => l.type === 'context').length}`);

// Find the range of added lines
const addedLines = result.filter(l => l.type === 'add');
if (addedLines.length > 0) {
  const firstAdded = addedLines[0].lineNum;
  const lastAdded = addedLines[addedLines.length - 1].lineNum;
  console.log(`\n✅ Added lines range: ${firstAdded}-${lastAdded}`);
}
