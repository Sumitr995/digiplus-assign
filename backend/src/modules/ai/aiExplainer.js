const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

function buildPrompt({ logEntry, reasonCodes, reasonSummary, score, contextStats }) {
  const systemInstruction = `You are an assistant that explains pre-determined anomaly detections.
Rules:
1. The anomaly decision is final and already made by a deterministic engine. You must not re-evaluate whether the entry is anomalous.
2. Do not classify or change the anomaly status.
3. Explain only the deterministic evidence provided.
4. Output MUST be valid JSON only, with exactly three keys: explanation, likelyRootCause, recommendedNextStep.
5. No markdown, no extra text.`;

  const userContent = `Deterministic anomaly evidence:
- LogEntry: ${JSON.stringify({
    timestamp: logEntry.timestamp,
    source: logEntry.source,
    eventType: logEntry.eventType,
    statusCode: logEntry.statusCode,
    severity: logEntry.severity,
    userAgent: logEntry.userAgent,
    sessionId: logEntry.sessionId,
    location: logEntry.location,
  })}
- Score: ${score}
- ReasonCodes: ${reasonCodes.join(', ')}
- ReasonSummary: ${reasonSummary}
- ContextStats: ${JSON.stringify(contextStats || {})}

Provide JSON:
{
  "explanation": "1-3 plain-English sentences explaining the deterministic evidence.",
  "likelyRootCause": "1-2 evidence-based sentences for likely cause.",
  "recommendedNextStep": "1-2 concrete actions."
}`;

  return { systemInstruction, userContent };
}

async function callGroq({ systemInstruction, userContent }, timeoutMs, model) {
  const apiKey = process.env.GROQ_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error('Missing GROQ_API_KEY');
    err.statusCode = 502;
    err.body = { error: 'AI_PROVIDER_ERROR', message: 'Explanation generation failed. Try again.' };
    throw err;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userContent },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const err = new Error(`Groq API error ${res.status}: ${text}`);
      err.statusCode = 502;
      err.body = { error: 'AI_PROVIDER_ERROR', message: 'Explanation generation failed. Try again.' };
      throw err;
    }

    const data = await res.json();
    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) {
      const err = new Error('Empty AI response');
      err.statusCode = 502;
      err.body = { error: 'AI_PROVIDER_ERROR', message: 'Explanation generation failed. Try again.' };
      throw err;
    }
    return content;
  } catch (err) {
    if (err.name === 'AbortError') {
      const e = new Error('AI request timed out');
      e.statusCode = 502;
      e.body = { error: 'AI_PROVIDER_ERROR', message: 'Explanation generation failed. Try again.' };
      throw e;
    }
    if (err.statusCode === 502) throw err;
    const e = new Error(`AI provider error: ${err.message}`);
    e.statusCode = 502;
    e.body = { error: 'AI_PROVIDER_ERROR', message: 'Explanation generation failed. Try again.' };
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch (_) {
    // try to extract JSON object substring
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (_) {
        return null;
      }
    }
    return null;
  }
}

async function generateExplanation({ logEntry, reasonCodes, reasonSummary, score, contextStats }) {
  const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS, 10) || 15000;
  const model = process.env.AI_MODEL || 'llama3-70b-8192';

  const { systemInstruction, userContent } = buildPrompt({ logEntry, reasonCodes, reasonSummary, score, contextStats });

  let raw = await callGroq({ systemInstruction, userContent }, timeoutMs, model);
  let parsed = tryParseJson(raw);

  if (!parsed || typeof parsed.explanation !== 'string' || typeof parsed.likelyRootCause !== 'string' || typeof parsed.recommendedNextStep !== 'string') {
    // retry once with stricter JSON reminder
    const retryUserContent = userContent + '\n\nIMPORTANT: Respond with ONLY valid JSON, no extra text, no markdown. Keys: explanation, likelyRootCause, recommendedNextStep.';
    raw = await callGroq({ systemInstruction, userContent: retryUserContent }, timeoutMs, model);
    parsed = tryParseJson(raw);
  }

  if (!parsed || typeof parsed.explanation !== 'string' || typeof parsed.likelyRootCause !== 'string' || typeof parsed.recommendedNextStep !== 'string') {
    const err = new Error('AI returned invalid JSON');
    err.statusCode = 502;
    err.body = { error: 'AI_PROVIDER_ERROR', message: 'Explanation generation failed. Try again.' };
    throw err;
  }

  return {
    explanation: parsed.explanation,
    likelyRootCause: parsed.likelyRootCause,
    recommendedNextStep: parsed.recommendedNextStep,
    model,
  };
}

module.exports = { generateExplanation };
