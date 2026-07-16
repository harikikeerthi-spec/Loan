const fs = require('fs');
const path = require('path');

const logPath = path.join(
  'C:', 'Users', 'Lenovo', '.gemini', 'antigravity-ide', 'brain',
  '99a7a6cf-1e37-45f6-9c81-428f42ce78d2', '.system_generated', 'tasks', 'task-619.log'
);

if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  const errorLines = lines.filter(line => line.includes('42501') || line.includes('Supabase Error') || line.includes('relationship'));
  if (errorLines.length > 0) {
    console.log('Found relationship or permission errors in logs:');
    console.log(errorLines.join('\n'));
  } else {
    console.log('No relationship, permission, or Supabase query errors found in server logs!');
  }
} else {
  console.log('Log file not found');
}
