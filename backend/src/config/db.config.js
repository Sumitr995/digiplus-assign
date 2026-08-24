const mongoose = require('mongoose');
const dns = require('dns').promises;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment');
  }

  if (cached.conn) return cached.conn;
  // Also reuse if mongoose already connected (serverless warm)
  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return cached.conn;
  }

  if (!cached.promise) {
    // DNS override: ONLY use on local dev, never on Vercel/AWS Lambda.
    // Vercel's network blocks dns.setServers and breaks SRV lookup for Atlas.
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    const dnsServers = (process.env.MONGODB_DNS_SERVERS || '')
      .split(',')
      .map((server) => server.trim())
      .filter(Boolean);
    if (dnsServers.length && !isServerless) {
      try {
        dns.setServers(dnsServers);
      } catch (e) {
        console.warn('dns.setServers failed, ignoring:', e.message);
      }
    } else if (dnsServers.length && isServerless) {
      console.warn('MONGODB_DNS_SERVERS ignored on serverless (Vercel)');
    }

    const opts = {
      bufferCommands: false,
      // Important for Atlas + Vercel serverless: add timeouts
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 20000,
      // Ensure DB name even if URI ends with '/'
      dbName: process.env.MONGODB_DB_NAME || undefined,
    };
    // If URI missing DB name and no MONGODB_DB_NAME, fallback to 'digiplus'
    // mongoose will use 'test' by default which splits data. Force digiplus.
    if (!opts.dbName) {
      try {
        const parsed = new URL(uri.replace('mongodb+srv://', 'https://'));
        // pathname is /DB?query or just / or /?query
        const pathDb = parsed.pathname.replace('/', '').split('?')[0].trim();
        if (!pathDb) opts.dbName = 'digiplus';
      } catch (_) {
        opts.dbName = 'digiplus';
      }
    }

    cached.promise = mongoose.connect(uri, opts).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  return cached.conn;
}

module.exports = { connectDB };