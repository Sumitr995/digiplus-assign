require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { connectDB } = require('../src/config/db.config');
const LogEntry = require('../src/models/LogEntry');
const Anomaly = require('../src/models/Anomaly');
const Explanation = require('../src/models/Explanation');
const { validateRow, normalizeRow } = require('../src/modules/validator');
const anomalyEngine = require('../src/modules/anomaly/engine');

async function seed() {
  await connectDB();

  await LogEntry.deleteMany({});
  await Anomaly.deleteMany({});
  await Explanation.deleteMany({});

  const csvPath = path.resolve(__dirname, '..', '..', 'Resources', 'log-data.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  const csvText = fs.readFileSync(csvPath, 'utf-8');
  const rawRows = parse(csvText, { columns: true, skip_empty_lines: true, relax_column_count: true, trim: true });

  console.log(`Read ${rawRows.length} rows from CSV`);

  const rejected = [];
  const valid = [];

  for (let i = 0; i < rawRows.length; i++) {
    const errs = validateRow(rawRows[i], i);
    if (errs) {
      rejected.push({ row: i + 1, reason: errs.join('; ') });
    } else {
      valid.push(normalizeRow(rawRows[i]));
    }
  }

  console.log(`Valid: ${valid.length}, Rejected: ${rejected.length}`);
  if (rejected.length > 0) {
    console.log('Rejected rows:', rejected.slice(0, 5));
    if (rejected.length > 5) console.log(`... and ${rejected.length - 5} more`);
  }

  const entries = await LogEntry.insertMany(valid);
  console.log(`Inserted ${entries.length} log entries`);

  const flagged = anomalyEngine.run(entries);
  console.log(`Anomalies detected: ${flagged.length}`);

  const rateBurstCount = flagged.filter(f => f.reasonCodes.includes('RATE_BURST')).length;
  const rareLocCount = flagged.filter(f => f.reasonCodes.includes('RARE_LOCATION')).length;
  const sessionAnomCount = flagged.filter(f => f.reasonCodes.includes('SESSION_ANOMALY')).length;
  const errorBurstCount = flagged.filter(f => f.reasonCodes.includes('ERROR_BURST')).length;
  const rareAgentCount = flagged.filter(f => f.reasonCodes.includes('RARE_USER_AGENT')).length;

  console.log(`  Rate Burst: ${rateBurstCount}`);
  console.log(`  Error Burst: ${errorBurstCount}`);
  console.log(`  Rare Location: ${rareLocCount}`);
  console.log(`  Rare UserAgent: ${rareAgentCount}`);
  console.log(`  Session Anomaly: ${sessionAnomCount}`);

  const anomalyDocs = flagged.map(f => ({
    logEntryId: f.logEntry._id,
    score: f.score,
    reasonCodes: f.reasonCodes,
    reasonSummary: f.reasonSummary,
    ruleVersion: '1.0',
  }));
  await Anomaly.insertMany(anomalyDocs);

  await LogEntry.updateMany(
    { _id: { $in: flagged.map(f => f.logEntry._id) } },
    { $set: { flagged: true } }
  );

  const ip53flagged = flagged.filter(f => f.logEntry.source === '15.6.62.53');
  console.log(`\nVerification:`);
  console.log(`  IP 15.6.62.53 flagged: ${ip53flagged.length > 0} (${ip53flagged.length} anomalies)`);
  if (ip53flagged.length > 0) {
    console.log(`    Reason: ${ip53flagged[0].reasonSummary}`);
    console.log(`    Score: ${ip53flagged[0].score}`);
    console.log(`    Codes: ${ip53flagged[0].reasonCodes.join(', ')}`);
  }

  const nkFlagged = flagged.filter(f => f.logEntry.location === 'North Korea');
  console.log(`  North Korea rows flagged: ${nkFlagged.length > 0} (${nkFlagged.length} anomalies)`);
  if (nkFlagged.length > 0) {
    console.log(`    Reason: ${nkFlagged[0].reasonSummary}`);
    console.log(`    Score: ${nkFlagged[0].score}`);
  }

  const multiIpCount = flagged.filter(f => f.reasonCodes.includes('SESSION_ANOMALY') && f.reasonSummary.includes('spans')).length;
  console.log(`  Multi-IP session anomalies: ${multiIpCount > 0 ? 'Yes (' + multiIpCount + ')' : 'No'}`);

  console.log('\nSeed complete.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});