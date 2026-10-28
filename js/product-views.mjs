import { analyze, shiftDate } from './analysis.mjs';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));
const num = n => Number(n).toLocaleString('es-EC', { maximumFractionDigits: 1 });
const duration = hours => {
  const minutes = Math.round(Number(hours) * 60);
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`;
};
const raceTime = minutes => {
  const seconds = Math.round(Number(minutes) * 60);
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor(seconds / 60) % 60;
  return `${hours ? `${hours} h ` : ''}${mins} min ${String(seconds % 60).padStart(2, '0')} s`;
};
const dateLabel = date => new Date(`${date}T12:00:00Z`).toLocaleDateString('es-EC', {
  day: 'numeric', month: 'short', timeZone: 'UTC'
});
const button = (attr, label, secondary = false) => `<button class="button ${secondary ? 'secondary' : ''}" ${attr}>${label}</button>`;
const explanation = (title, text) => `<details class="evidence"><summary>${title}</summary><p>${esc(text)}</p></details>`;

function targetCard(label, value, target, unit) {
  const reached = target && value >= target;
  const remaining = target ? Math.max(0, target - value) : null;
  return `<div class="target-card">
    <span>${label}</span>
    <strong>${num(value)} <small>${target ? `de ${num(target)} ` : ''}${unit}</small></strong>
    ${target ? `<progress max="${target}" value="${Math.min(value, target)}" aria-label="${label}"></progress>
      <p>${reached ? 'Meta alcanzada. Sigue la planificación que acordaste.' : `Te faltan ${num(remaining)} ${unit} para tu meta semanal.`}</p>` : '<p>Aún no elegiste una meta.</p>'}
  </div>`;
}

export function weeklyPanel(data, today) {
  const { weekly: w } = analyze(data, today);
  const hasGoals = w.targetSessions && w.targetMinutes;
  return `<section class="card weekly-panel">
    <div class="card-heading"><div><div class="eyebrow">${dateLabel(w.start)} – ${dateLabel(w.end)}</div><h2>Tu semana</h2></div>
      ${button('data-goals', hasGoals ? 'Cambiar mis metas' : 'Elegir mis metas', true)}
    </div>
    <div class="target-grid">
      ${targetCard('Entrenamientos realizados', w.sessions, w.targetSessions, 'sesiones')}
      ${targetCard('Tiempo de entrenamiento', w.minutes, w.targetMinutes, 'min')}
    </div>
    ${explanation('Cómo se cuenta tu avance', 'La semana va de lunes a domingo. Se suman únicamente los entrenamientos que registraste hasta hoy. Un día sin registros no se interpreta como un día sin actividad. Reparte tu meta según tu planificación, sin intentar completarla de golpe.')}
  </section>`;
}

export function decisionCenter(data, today) {
  const a = analyze(data, today);
  const needsReview = !a.checkin || !a.restToday;
  const visibleActions = a.actions.filter(item => !(needsReview && item.action === 'checkin'));
  return `<section class="decision-intro">
    <div><div class="eyebrow">TU DÍA, PASO A PASO</div><h2>¿Cómo te sientes hoy?</h2>
      <p class="subtitle">Cuéntanos cómo dormiste y qué tienes previsto. Te ayudamos a ver qué conviene revisar.</p></div>
    ${button('data-checkin', a.checkin ? 'Actualizar mis respuestas' : 'Completar mi revisión')}
  </section>
  <div class="decision-grid">${visibleActions.map(item => `<article class="card decision-card ${item.tone}">
    <span class="pill">${item.tone === 'review' ? 'Algo para revisar' : item.tone === 'steady' ? 'Revisión completada' : 'Tu siguiente paso'}</span>
    <h3>${esc(item.title)}</h3><p>${esc(item.body)}</p>
    ${explanation('Ver el motivo', item.evidence)}
    ${item.action === 'checkin' ? '' : `<a class="text-button" href="#${{ nutrition: 'alimentacion', training: 'entrenamiento' }[item.action]}">${esc(item.label)} →</a>`}
  </article>`).join('')}</div>
  ${weeklyPanel(data, today)}`;
}

export function comparisonPanel(data, today, compact = false) {
  const a = analyze(data, today), c = a.comparison;
  if (!c) {
    const incompatible = a.latest && !['Atletismo', 'Ciclismo', 'Natación', 'Trail running'].includes(a.latest.sport);
    return `<section class="card comparison-panel">
      <div class="eyebrow">TUS COMPETENCIAS</div><h2>Compara tu preparación</h2>
      <p class="subtitle">${incompatible ? 'La comparación por tiempo está disponible para atletismo, ciclismo, natación y trail.' : 'Añade dos competencias del mismo deporte y distancia, realizadas en fechas diferentes.'}</p>
      ${compact ? '' : '<p class="hint">Verás el cambio de tiempo y cómo fueron tus entrenamientos, sueño y organización alimentaria durante los siete días anteriores a cada competencia.</p>'}
      <a class="text-button" href="#competencias">${a.latest ? 'Revisar mis competencias' : 'Añadir mi primera competencia'} →</a>
    </section>`;
  }
  const seconds = Math.abs(Math.round(c.differenceMinutes * 60));
  const delta = `${Math.floor(seconds / 60)} min ${String(seconds % 60).padStart(2, '0')} s`;
  const headline = c.differenceMinutes === 0 ? 'Registraste el mismo tiempo' : `${delta} ${c.differenceMinutes < 0 ? 'menos' : 'más'} de tiempo`;
  const summary = `${esc(c.latest.sport)} · ${num(c.latest.distance)} km`;
  const times = `<div class="comparison-times">
    <div><span>Antes · ${dateLabel(c.earlier.date)}</span><strong>${raceTime(c.earlier.time)}</strong><p>${esc(c.earlier.name)}</p></div>
    <div><span>Ahora · ${dateLabel(c.latest.date)}</span><strong>${raceTime(c.latest.time)}</strong><p>${esc(c.latest.name)}</p></div>
  </div>`;
  if (compact) {
    return `<section class="card comparison-panel compact-result">
      <div class="card-heading"><div><div class="eyebrow">${summary}</div><h2>Tu último resultado</h2></div></div>
      <p class="result-change">${headline}</p>${times}
      <p class="subtitle">Revisa qué cambió en tu preparación antes de estas dos competencias.</p>
      <a class="button secondary" href="#analisis">Ver mi progreso →</a>
    </section>`;
  }
  const sleepDelta = c.before.sleepDays >= 3 && c.after.sleepDays >= 3 ? Math.round((c.after.sleep - c.before.sleep) * 60) : null;
  const sleepText = sleepDelta === null ? 'Faltan registros de sueño para describir un cambio: se necesitan al menos tres días en cada semana.' : `En los días registrados, tu sueño promedio ${sleepDelta === 0 ? 'se mantuvo igual' : sleepDelta > 0 ? `aumentó ${sleepDelta} min` : `disminuyó ${Math.abs(sleepDelta)} min`}.`;
  const trainingDelta = c.after.minutes - c.before.minutes;
  const trainingText = trainingDelta === 0 ? 'Registraste el mismo tiempo de entrenamiento en ambas semanas.' : `Registraste ${num(Math.abs(trainingDelta))} min ${trainingDelta > 0 ? 'más' : 'menos'} de entrenamiento en la semana previa a tu última competencia.`;
  return `<section class="card comparison-panel">
    <div class="eyebrow">${summary} · MISMO DEPORTE Y DISTANCIA</div><h2>Qué cambió entre tus competencias</h2>
    <p class="result-change">${headline}<small>${num(Math.abs(c.percent))} % ${c.differenceMinutes < 0 ? 'menos' : c.differenceMinutes > 0 ? 'más' : 'de cambio'}</small></p>
    ${times}
    <div class="analysis-takeaway"><h3>Lo que puedes revisar</h3><p>${sleepText} ${trainingText}</p></div>
    <details class="history-details"><summary>Ver los datos de preparación</summary>
      <p class="hint">Se comparan los siete días anteriores a cada competencia. Los días sin respuesta quedan identificados.</p>
      <div class="table-wrap"><table><thead><tr><th>QUÉ COMPARAS</th><th>${esc(c.earlier.name)}</th><th>${esc(c.latest.name)}</th></tr></thead><tbody>
        <tr><td>Semana anterior</td><td>${dateLabel(c.before.start)} – ${dateLabel(c.before.end)}</td><td>${dateLabel(c.after.start)} – ${dateLabel(c.after.end)}</td></tr>
        <tr><td>Entrenamientos de ${esc(c.latest.sport)}</td><td>${c.before.sessions} sesiones · ${num(c.before.minutes)} min</td><td>${c.after.sessions} sesiones · ${num(c.after.minutes)} min</td></tr>
        <tr><td>Sueño promedio</td><td>${c.before.sleep === null ? 'Sin datos' : duration(c.before.sleep)}<br><small>${c.before.sleepDays} de 7 días registrados</small></td><td>${c.after.sleep === null ? 'Sin datos' : duration(c.after.sleep)}<br><small>${c.after.sleepDays} de 7 días registrados</small></td></tr>
        <tr><td>Días que seguiste tu plan de comidas</td><td>${c.before.mealDays ? `${c.before.mealOnPlan} de ${c.before.mealDays} días respondidos` : 'Sin respuestas'}</td><td>${c.after.mealDays ? `${c.after.mealOnPlan} de ${c.after.mealDays} días respondidos` : 'Sin respuestas'}</td></tr>
      </tbody></table></div>
    </details>
    ${explanation('Qué significa esta comparación', 'Los cambios aparecen juntos, pero no demuestran que una forma de comer o dormir haya causado el resultado. Revisa también el recorrido, el clima y la estrategia de carrera. Los días sin registros no confirman inactividad. Esta comparación no calcula el riesgo de lesión.')}
  </section>`;
}

export function nutritionPanel(data, today) {
  const rows = (data.checkins || []).filter(r => r.date >= shiftDate(today, -6) && r.date <= today);
  const answered = rows.filter(r => ['on-plan', 'off-plan', 'unsure'].includes(r.mealPlan));
  const followed = answered.filter(r => r.mealPlan === 'on-plan');
  const enough = answered.length >= 3;
  const off = answered.filter(r => r.mealPlan === 'off-plan');
  const title = !enough ? 'Empieza con una respuesta al día' : off.length ? 'Revisa qué te está dificultando comer como planeabas' : 'Mantén la organización que te está ayudando';
  const nextStep = !enough ? 'Responde durante al menos tres días para empezar a ver qué se repite.' : off.length ? `En ${off.length} de ${answered.length} días respondidos no pudiste seguir tu plan. Anota qué te faltó: tiempo, preparación o alimentos disponibles.` : 'Si cambia tu entrenamiento, revisa tu plan de comidas con un nutricionista.';
  return `<section class="card">
    <div class="card-heading"><div><div class="eyebrow">COMIDAS Y ORGANIZACIÓN</div><h2>¿Cómo va tu alimentación?</h2></div>
      ${button('data-checkin', 'Responder sobre hoy', true)}</div>
    <p class="subtitle">Empieza contando si pudiste comer como tenías previsto. El registro de alimentos es opcional.</p>
    <div class="target-grid"><div class="target-card"><span>Seguiste tu plan de comidas</span><strong>${followed.length} <small>de ${answered.length} días respondidos</small></strong><p>Últimos siete días · ${7 - answered.length} sin respuesta.</p></div>
      <div class="target-card"><span>Tu siguiente paso</span><h3>${title}</h3><p>${nextStep}</p></div></div>
    ${explanation('Qué puedes saber con estas respuestas', 'Este seguimiento muestra cómo te organizas, no si tu dieta cubre tus necesidades. No calcula calorías ni prepara una dieta. Los días sin respuesta no se cuentan como incumplimientos. Si necesitas un plan de alimentación deportivo, consulta a un nutricionista.')}
  </section>`;
}

export function recoveryPanel(data, today) {
  const rows = (data.rest || []).filter(r => r.date >= shiftDate(today, -6) && r.date <= today);
  const goal = Number(data.goals?.sleepHours) || null;
  const reached = goal ? rows.filter(r => Number(r.hours) >= goal).length : null;
  return `<section class="card">
    <div class="card-heading"><h2>¿Cómo has dormido esta semana?</h2>${button('data-checkin', 'Registrar cómo dormí', true)}</div>
    <div class="target-grid"><div class="target-card"><span>Tu promedio de sueño</span><strong>${rows.length ? duration(rows.reduce((n, r) => n + Number(r.hours), 0) / rows.length) : 'Sin registros aún'}</strong><p>Últimos siete días · ${rows.length} registrados y ${7 - rows.length} sin información.</p></div>
      <div class="target-card"><span>Tu meta de sueño por noche</span><strong>${goal ? duration(goal) : 'Aún sin definir'}</strong><p>${goal ? `La alcanzaste en ${reached} de ${rows.length} días registrados.` : 'Elige tu propia referencia para comparar tus días.'}</p>${button('data-goals', goal ? 'Cambiar mi meta' : 'Elegir mi meta', true)}</div></div>
    ${explanation('Cómo se usa tu meta de sueño', 'La eliges tú, idealmente con orientación profesional. Se compara con tu sueño registrado y con lo que cuentas sobre tu energía y recuperación. Los días sin registro no entran en el promedio. Esta referencia no es una prescripción médica.')}
  </section>`;
}
