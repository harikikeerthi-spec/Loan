const fs = require('fs');
const file = 'c:\\Projects\\Sun Glade\\Loan\\frontend\\components\\staff\\ApplicationDetailView.tsx';
let content = fs.readFileSync(file, 'utf8');

const target =   const formatUploadAge = (timestamp?: string) => {
    if (!timestamp) return " Upload time unavailable\;
 const uploadedDate = new Date(timestamp);
 if (Number.isNaN(uploadedDate.getTime())) return \Upload time unavailable\;

 const diffMs = Date.now() - uploadedDate.getTime();
 const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
 if (diffMinutes < 1) return \Uploaded just now\;
 if (diffMinutes < 60) return \Uploaded \ minute\ ago\;

 const diffHours = Math.floor(diffMinutes / 60);
 if (diffHours < 24) return \Uploaded \ hour\ ago\;

 const diffDays = Math.floor(diffHours / 24);
 if (diffDays < 7) return \Uploaded \ day\ ago\;

 const diffWeeks = Math.floor(diffDays / 7);
 return \Uploaded \ week\ ago\;
 };;

const replacement = const formatUploadAge = (timestamp?: string) => {
 if (!timestamp) return \Upload time unavailable\;
 let safeTimestamp = timestamp;
 if (!timestamp.endsWith(\Z\) && !timestamp.includes(\+\) && !timestamp.match(/-\\\\d{2}:\\\\d{2}$/)) {
 safeTimestamp = timestamp + \Z\;
 }
 const uploadedDate = new Date(safeTimestamp);
 if (Number.isNaN(uploadedDate.getTime())) return \Upload time unavailable\;
 const formattedDate = new Intl.DateTimeFormat(\en-IN\, { timeZone: \Asia/Kolkata\, day: \2-digit\, month: \short\, year: \numeric\, hour: \2-digit\, minute: \2-digit\, hour12: true }).format(uploadedDate);
 const diffMs = Date.now() - uploadedDate.getTime();
 const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
 let relative = \\;
 if (diffMinutes < 1) relative = \just now\;
 else if (diffMinutes < 60) relative = \\ minute\ ago\;
 else {
 const diffHours = Math.floor(diffMinutes / 60);
 if (diffHours < 24) relative = \\ hour\ ago\;
 else {
 const diffDays = Math.floor(diffHours / 24);
 if (diffDays < 7) relative = \\ day\ ago\;
 else {
 const diffWeeks = Math.floor(diffDays / 7);
 relative = \\ week\ ago\;
 }
 }
 }
 return \\ (\)\;
 };;

content = content.replace(target.replace(/\\r\\n/g, '\\n'), replacement);
content = content.replace(target, replacement);
fs.writeFileSync(file, content);
