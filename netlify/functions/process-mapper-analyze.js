const Anthropic = require('@anthropic-ai/sdk');

const SCHEMA = {
  type: 'object',
  properties: {
    purpose: { type: 'string', description: 'One sentence describing the purpose of the process discussed in the transcript.' },
    stakeholders: { type: 'array', items: { type: 'string' }, description: 'People or roles involved in the process, as named or implied in the transcript.' },
    tools: { type: 'array', items: { type: 'string' }, description: 'Tools and systems mentioned in the transcript.' },
    stages: { type: 'array', items: { type: 'string' }, description: 'The process stages in chronological order, as described in the transcript.' },
    decision_points: { type: 'array', items: { type: 'string' }, description: 'Moments where a choice or branch happens in the process.' },
    gaps: { type: 'array', items: { type: 'string' }, description: 'Things left ambiguous, unresolved, or undocumented in the transcript.' },
    questions: { type: 'array', items: { type: 'string' }, description: 'Follow-up questions worth asking in the next stakeholder session.' },
    mermaid: { type: 'string', description: 'A flowchart in mermaid flowchart TD syntax, one node per major stage in order, short node labels (2-4 words), using \\n for newlines within the string.' },
  },
  required: ['purpose', 'stakeholders', 'tools', 'stages', 'decision_points', 'gaps', 'questions', 'mermaid'],
  additionalProperties: false,
};

const PROMPT_PREFIX = `You are a business process analyst. Read the discovery call transcript below and produce a structured analysis.

Fields:
- purpose: one sentence describing the purpose of the process discussed
- stakeholders: people or roles involved
- tools: tools and systems mentioned
- stages: the process stages in order
- decision_points: moments where a choice or branch happens
- gaps: things left ambiguous or unresolved
- questions: follow-up questions worth asking next
- mermaid: a flowchart in mermaid flowchart TD syntax, one node per major stage in order, short node labels (2-4 words), using \\n for newlines within the string. This must be directly renderable by mermaid.js.

Transcript:
`;

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed.' }) };
  }

  let transcript;
  try {
    ({ transcript } = JSON.parse(event.body || '{}'));
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body.' }) };
  }

  if (!transcript || !transcript.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Transcript is required.' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server is not configured with an Anthropic API key.' }) };
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2000,
      output_config: {
        effort: 'medium',
        format: { type: 'json_schema', schema: SCHEMA },
      },
      messages: [{ role: 'user', content: PROMPT_PREFIX + transcript }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock) {
      return { statusCode: 502, body: JSON.stringify({ error: 'No analysis was returned.' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: textBlock.text,
    };
  } catch (err) {
    const message = err && err.message ? err.message : 'Failed to reach the Anthropic API.';
    return { statusCode: 502, body: JSON.stringify({ error: message }) };
  }
};
