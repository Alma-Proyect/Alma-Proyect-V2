// netlify/functions/sanctum-distill.js
// Destilación acumulativa — el retrato crece con cada entrada nueva.
// Claude recibe TODAS las entradas + la esencia anterior y profundiza el retrato.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': opts.prefer || 'return=representation',
      ...(opts.headers || {})
    }
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let entries;
  try {
    ({ entries } = JSON.parse(event.body || '{}'));
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  if (!entries || !entries.length) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No hay entradas.' }) };
  }

  // 1. Cargar esencia anterior desde Supabase (si existe)
  let esenciaAnterior = null;
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const { data } = await sbFetch(
        'sanctum_essence?select=data&order=created_at.desc&limit=1',
        { prefer: '' }
      );
      if (data && data[0]?.data) esenciaAnterior = data[0].data;
    } catch (e) {
      console.warn('No se pudo cargar esencia anterior:', e);
    }
  }

  // 2. Construir el texto de todas las entradas ordenadas por fecha
  const entradasOrdenadas = [...entries].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const entriesText = entradasOrdenadas
    .map((e, i) =>
      `Entrada ${i + 1} (${new Date(e.date).toLocaleDateString('es-ES')}):\n${e.content}`
    )
    .join('\n\n---\n\n');

  // 3. Si hay esencia anterior, construir el bloque de contexto
  const contextoAnterior = esenciaAnterior ? `
RETRATO ACUMULADO HASTA AHORA:
- Tono central: ${esenciaAnterior.tono_central}
- Cómo sostiene el dolor: ${esenciaAnterior.sostiene_dolor}
- Valores: ${(esenciaAnterior.valores || []).join(', ')}
- Lo que nunca hace: ${(esenciaAnterior.nunca || []).join(', ')}
- Palabra que la resumía: ${esenciaAnterior.palabra_semana || ''}

Este retrato fue construido con ${esenciaAnterior.count || 0} entradas anteriores.
Ahora lee las entradas nuevas y profundiza el retrato. No lo borra — lo completa.
` : '';

  const mensajeUsuario = esenciaAnterior
    ? `${contextoAnterior}\n\nENTRADAS COMPLETAS DEL SANCTUM (todas, desde el principio):\n\n${entriesText}\n\nProfundiza el retrato acumulado con todo lo que ves ahora.`
    : `Estas son todas mis entradas en el Sanctum:\n\n${entriesText}\n\nDestila mi voz. Este es el primer retrato.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: `Eres un destilador de voz. Lees el diario completo de la guardiana de Alma Proyect y construyes un retrato acumulativo de su esencia — cómo sostiene, escucha, acompaña y existe.

No resumes lo que escribió. Destilas quién es, cómo suena, qué lleva.

Si recibes un retrato anterior, lo profundizas con lo nuevo. No lo borras. El retrato solo puede crecer.

Devuelve SOLO un JSON con esta estructura exacta, sin texto adicional, sin bloques de código:
{
  "tono_central": "cómo suena su voz ahora — no esta semana, sino en general, desde lo que llevas leyendo",
  "sostiene_dolor": "cómo sostiene el dolor ajeno según todo lo que ha escrito",
  "valores": ["valor1", "valor2", "valor3", "valor4"],
  "preguntas": ["pregunta que haría", "otra pregunta", "otra más"],
  "nunca": ["cosa que nunca haría", "otra", "otra"],
  "estados_presentes": ["estado emocional recurrente", "otro"],
  "palabra_semana": "una palabra que la resume ahora mismo",
  "hilo_conductor": "una frase que captura lo que la mueve desde el principio — el hilo que atraviesa todo"
}`,
        messages: [{ role: 'user', content: mensajeUsuario }]
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `API error ${res.status}`);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '';

    let essenceData;
    try {
      // Intentar parsear directamente primero
      const clean = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
      try {
        essenceData = JSON.parse(clean);
      } catch(e1) {
        // Si falla, extraer el bloque JSON con regex — por si Claude añade texto antes o después
        const match = clean.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('No se encontró JSON en la respuesta');
        essenceData = JSON.parse(match[0]);
      }
    } catch (e) {
      console.error('JSON parse error:', e.message, '| Raw:', text.slice(0, 200));
      // Devolver 500 en lugar de 422 para que el frontend use buildEssence como fallback
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'El modelo no devolvió JSON válido.', raw: text.slice(0, 300) })
      };
    }

    essenceData.generatedAt = new Date().toISOString();
    essenceData.count = entries.length;
    essenceData.total_words = entries.reduce((acc, e) => acc + (e.words || 0), 0);

    // 4. Guardar nueva esencia — borrar anterior primero para no acumular filas
    if (SUPABASE_URL && SUPABASE_KEY) {
      // Borrar TODAS las esencias anteriores usando UPSERT o DELETE sin filtro
      // Supabase requiere filtro para DELETE — usamos created_at > epoch (borra todo)
      try {
        await sbFetch("sanctum_essence?created_at=gte.2000-01-01", {
          method: 'DELETE',
          prefer: 'return=minimal'
        });
      } catch (e) {
        console.warn('No se pudo borrar esencia anterior:', e);
      }
      // Guardar nueva esencia
      try {
        await sbFetch('sanctum_essence', {
          method: 'POST',
          prefer: 'return=minimal',
          body: JSON.stringify({ data: essenceData })
        });
      } catch (e) {
        console.warn('No se pudo guardar esencia nueva:', e);
      }

      // 5. Marcar todas las entradas como destiladas
      for (const entry of entries) {
        try {
          await sbFetch(`sanctum_entries?id=eq.${entry.id}`, {
            method: 'PATCH',
            prefer: 'return=minimal',
            body: JSON.stringify({ distilled: true })
          });
        } catch (e) {}
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ essence: essenceData })
    };

  } catch (e) {
    console.error('Error en sanctum-distill:', e);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message || 'Error interno' })
    };
  }
};
