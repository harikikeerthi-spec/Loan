/**
 * Backfill parents table from already-verified documents.
 * Reads OCR data from UserDocument.verificationMetadata for father_*, mother_*, coapplicant_* docs
 * and populates the parents table.
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function backfill() {
  console.log('Starting parents table backfill from verified documents...\n');

  const { data: docs, error } = await supabase
    .from('UserDocument')
    .select('*')
    .eq('status', 'verified')
    .or('docType.ilike.father_%,docType.ilike.mother_%,docType.ilike.coapplicant_%');

  if (error) {
    console.error('Error fetching documents:', error);
    return;
  }

  console.log('Found ' + (docs && docs.length || 0) + ' verified parent/coapplicant documents\n');

  let updated = 0;
  let inserted = 0;
  let skipped = 0;

  for (const doc of (docs || [])) {
    const docType = doc.docType || '';
    let relation = null;
    if (docType.startsWith('father_')) relation = 'father';
    else if (docType.startsWith('mother_')) relation = 'mother';
    else if (docType.startsWith('coapplicant_')) relation = 'coapplicant';

    if (!relation || !doc.userId) { skipped++; continue; }

    let meta = doc.verificationMetadata || {};
    if (typeof meta === 'string') { try { meta = JSON.parse(meta); } catch { meta = {}; } }

    const details = meta.details || {};
    const extractedFields = details.extractedFields || {};

    const extractedName = extractedFields.full_name || extractedFields.name || extractedFields.holder_name || extractedFields.holderName;
    const extractedAadhaar = extractedFields.aadhaar_number || extractedFields.aadhar_number;
    const extractedPan = extractedFields.pan_number;

    console.log('Processing: ' + docType + ' user=' + doc.userId);
    console.log('  Name=' + (extractedName||'N/A') + '  Aadhaar=' + (extractedAadhaar||'N/A') + '  PAN=' + (extractedPan||'N/A'));

    const { data: existing } = await supabase
      .from('parents').select('*').eq('userId', doc.userId).eq('relation', relation).maybeSingle();

    const payload = { userId: doc.userId, relation, updatedAt: new Date().toISOString() };
    if (extractedName) payload.name = extractedName;
    if (extractedAadhaar) payload.aadharNumber = extractedAadhaar;
    if (extractedPan) payload.panNumber = extractedPan;

    if (existing) {
      payload.name = payload.name || existing.name;
      payload.aadharNumber = payload.aadharNumber || existing.aadharNumber;
      payload.panNumber = payload.panNumber || existing.panNumber;
      const { error: e } = await supabase.from('parents').update(payload).eq('id', existing.id);
      if (e) console.error('  Update error:', e.message);
      else { console.log('  Updated ' + relation); updated++; }
    } else {
      payload.id = doc.userId + '_' + relation + '_' + Date.now();
      const { error: e } = await supabase.from('parents').insert(payload);
      if (e) console.error('  Insert error:', e.message);
      else { console.log('  Inserted ' + relation); inserted++; }
    }
  }

  console.log('\n=== Done: updated=' + updated + ' inserted=' + inserted + ' skipped=' + skipped + ' ===');

  const { data: all } = await supabase.from('parents').select('*');
  console.log('\nParents table (' + (all && all.length || 0) + ' records):');
  for (const p of (all || [])) {
    console.log('  [' + p.relation + '] userId=' + p.userId + '  name=' + (p.name||'-') + '  aadhaar=' + (p.aadharNumber||'-') + '  pan=' + (p.panNumber||'-'));
  }
}

backfill().catch(console.error);

