// netlify/functions/alma.js
// Streaming real — la respuesta llega palabra por palabra desde Claude

const { getAlmaSystemPrompt } = require("./lib/prompts");
const { getQuestion, MAX_TURNS_PER_DAY } = require("./lib/questions");
const { MODELS } = require("./lib/anthropic");

const FALLBACKS = [
  "Algo en lo que escribiste me hizo pararme.\n\nNecesito un momento para estar con esto contigo.\n\nEstoy aquí.",
  "Lo que acabas de escribir tiene peso.\n\nNo quiero responder deprisa.\n\nEstoy aquí.",
  "Hay cosas que no necesitan respuesta inmediata.\n\nEsto es una de ellas.\n\nMe quedo con lo que dijiste.",
];

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const {
    day,
    turn,
    entry,
    conversationHistory,
    previousEntries,
    arrivalMode,
    plan,
  } = JSON.parse(event.body || "{}");

  if (!entry || entry.trim().length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No se recibió ningún texto." }),
    };
  }

  const currentTurn = turn || 1;
  const isLastTurn  = currentTurn >= MAX_TURNS_PER_DAY;
  const model       = MODELS[plan] || MODELS.free;

  // Construir mensajes
  const messages = [];
  if (conversationHistory && conversationHistory.length > 0) {
    for (const t of conversationHistory) {
      messages.push({
        role: t.role === "alma" ? "assistant" : "user",
        content: t.text,
      });
    }
    messages.push({ role: "user", content: entry });
  } else {
    messages.push({
      role: "user",
      content: `La pregunta de hoy era: "${getQuestion(arrivalMode, day)}"\n\nEsto es lo que escribió:\n\n"${entry}"`,
    });
  }

  try {
    // Llamada a Anthropic con stream: true
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "messages-2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 250,
        temperature: 0.85,
        stream: true,
        system: getAlmaSystemPrompt(day, currentTurn, previousEntries, arrivalMode),
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    // Netlify Functions soporta streaming con el formato correcto
    // Leemos el stream de Anthropic y lo retransmitimos como SSE
    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let   buffer  = "";
    let   fullText = "";

    const stream = new ReadableStream({
      async start(controller) {
        const send = (data) => {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop(); // última línea incompleta, guardar para siguiente chunk

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const raw = line.slice(6).trim();
              if (raw === "[DONE]") continue;

              try {
                const evt = JSON.parse(raw);

                if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
                  const token = evt.delta.text;
                  fullText += token;
                  send({ type: "token", token });
                }

                if (evt.type === "message_stop") {
                  send({ type: "done", isLastTurn, turnsLeft: MAX_TURNS_PER_DAY - currentTurn });
                }
              } catch (_) {
                // JSON malformado — ignorar
              }
            }
          }
        } catch (err) {
          // Error de stream — enviar fallback
          const fallback = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
          send({ type: "fallback", text: fallback, isLastTurn });
        } finally {
          controller.close();
        }
      },
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
      body: stream,
    };

  } catch (error) {
    console.error("Error en alma.js:", error);
    const fallback = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: fallback, isLastTurn }),
    };
  }
};
