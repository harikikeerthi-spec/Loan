require('dotenv').config({ path: 'c:\\Projects\\Sun Glade\\Loan\\frontend\\.env.local' });
require('dotenv').config({ path: 'c:\\Projects\\Sun Glade\\Loan\\server\\.env' });

const { fetchUniversityData } = require('c:\\Projects\\Sun Glade\\Loan\\frontend\\lib\\aiSearchService.ts'.replace('.ts', ''));

// We can't directly require a .ts file easily without ts-node.
// Let's use ts-node to execute this.
