const testDates = [
  "2026-06-04T07:43:47.82",
  "2026-06-04T07:43:50.156",
  "2026-06-04T07:40:18.3",
  "2026-06-04 13:10:17 IST"
];

function formatStepDateTime(ds) {
  if (!ds) return "";
  try {
    let date;

    if (typeof ds === 'string' && ds.endsWith(' IST')) {
      const bare = ds.slice(0, ds.length - 4).trim(); // strip " IST"
      date = new Date(bare.replace(' ', 'T') + 'Z'); 
      const [datePart, timePart] = bare.split(' ');
      const [y, m, d] = datePart.split('-').map(Number);
      const [hh, mm] = timePart.split(':');
      const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      return `${MONTHS[m - 1]} ${String(d).padStart(2, '0')} ${y}, ${hh}:${mm} +5:30`;
    }

    // Parse logic with fallback to UTC
    let cleanDs = ds;
    if (typeof cleanDs === 'string' && !cleanDs.includes('Z') && !cleanDs.includes('+')) {
      if (cleanDs.includes('T') || cleanDs.includes(':')) {
        // Standardize format to YYYY-MM-DDTHH:MM:SSZ
        const formatted = cleanDs.replace(' ', 'T');
        cleanDs = formatted.includes('Z') ? formatted : formatted + 'Z';
      }
    }

    date = new Date(cleanDs);
    if (isNaN(date.getTime())) return "";

    const ist = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const get = (type) => ist.find(p => p.type === type)?.value ?? '00';
    const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const monthIdx = parseInt(get('month'), 10) - 1;
    const monthStr = MONTHS[monthIdx] ?? 'JAN';
    const day = get('day');
    const year = get('year');
    const hr = get('hour');
    const min = get('minute');

    return `${monthStr} ${day} ${year}, ${hr}:${min} +5:30`;
  } catch (e) {
    return "ERROR: " + e.message;
  }
}

testDates.forEach(d => {
  console.log(`Original: ${d.padEnd(30)} => Formatted: ${formatStepDateTime(d)}`);
});
