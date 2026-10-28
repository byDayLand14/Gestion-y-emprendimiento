// Reglas explicables sobre registros personales. No predicen rendimiento ni lesiones.
export function shiftDate(date, days) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
const total = (rows, key) => rows.reduce((sum, row) => sum + Number(row[key] || 0), 0);
const mean = (rows, key) => rows.length ? total(rows, key) / rows.length : null;
const readableHours = hours => {const minutes=Math.round(Number(hours)*60);return `${Math.floor(minutes/60)} h ${String(minutes%60).padStart(2,'0')} min`;};
const within = (rows, start, end) => rows.filter(row => row.date >= start && row.date <= end);
const valid = (value, min, max) => value !== '' && value != null && Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max;

export function analyze(data, date) {
  const training = data.training || [], rest = data.rest || [], checkins = data.checkins || [];
  const goals = data.goals || {};
  const dayOfWeek = new Date(`${date}T12:00:00Z`).getUTCDay();
  const monday = shiftDate(date, -(dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const thisWeek = within(training, monday, date);
  const restToday = rest.find(row => row.date === date);
  const checkin = checkins.find(row => row.date === date);
  const sleepTarget = valid(goals.sleepHours, 1, 24) ? Number(goals.sleepHours) : null;
  const recent = within(training, shiftDate(date, -6), date);
  const previous = within(training, shiftDate(date, -13), shiftDate(date, -7));
  const loadRows = rows => rows.filter(row => valid(row.effort, 1, 10) && valid(row.duration, 0.1, 1440));
  const currentLoadRows = loadRows(recent), previousLoadRows = loadRows(previous);
  const load = rows => rows.reduce((sum, row) => sum + Number(row.duration) * Number(row.effort), 0);
  const currentLoad = load(currentLoadRows), previousLoad = load(previousLoadRows);
  const actions = [];
  if (!restToday || !checkin) {
    actions.push({ tone: 'neutral', title: 'Empieza por cómo te sientes hoy',
      body: 'Completa una revisión breve. Así podremos relacionar cómo dormiste, tu energía y el entrenamiento que tienes previsto.',
      evidence: `${restToday ? 'Sueño registrado.' : 'Falta el sueño de hoy.'} ${checkin ? 'Revisión diaria disponible.' : 'Falta la revisión diaria.'} Los días sin datos no cuentan como días de descanso.`, action: 'checkin', label: 'Revisar mi día' });
  } else {
    const shortSleep = sleepTarget !== null && Number(restToday.hours) < sleepTarget;
    const lowRecovery = valid(restToday.recovery, 1, 5) && Number(restToday.recovery) <= 2;
    const lowEnergy = valid(checkin.energy, 1, 5) && Number(checkin.energy) <= 2;
    const hard = checkin.plannedIntensity === 'intense';
    const evidence = [`Sueño: ${readableHours(restToday.hours)}${sleepTarget !== null ? `; tu meta: ${readableHours(sleepTarget)}` : '; no has definido una meta'}`, `recuperación: ${restToday.recovery}/5`, `energía: ${checkin.energy}/5`, `sesión prevista: ${{intense:'intensa',moderate:'moderada',easy:'suave',none:'sin sesión'}[checkin.plannedIntensity] || 'sin indicar'}`].join(' · ');
    if (shortSleep || lowRecovery || lowEnergy) {
      actions.push({ tone: 'review', title: hard ? 'Revisa tu entrenamiento intenso de hoy' : 'Revisa cómo estás recuperándote',
        body: hard ? 'Planeaste una sesión intensa, pero indicaste poco descanso, energía o recuperación. Revisa la exigencia con tu entrenador antes de seguir el plan.' : 'Tus respuestas muestran que conviene revisar cómo te sientes antes de entrenar. Si el malestar continúa, consulta a un profesional.',
        evidence, action: 'checkin', label: 'Revisar mis respuestas' });
    } else {
      actions.push({ tone: 'steady', title: 'Tu revisión de hoy está completa',
        body: 'No registraste energía ni recuperación bajas' + (sleepTarget !== null ? ' y alcanzaste tu meta de sueño.' : '. Define tu meta de sueño para poder compararla.') + ' Esto no evalúa tu aptitud física ni garantiza que debas entrenar.',
        evidence, action: 'checkin', label: 'Corregir mis respuestas' });
    }
    if (checkin.mealPlan === 'off-plan' || checkin.mealPlan === 'unsure') {
      actions.push({ tone: 'review', title: 'Organiza tu siguiente comida',
        body: checkin.mealPlan === 'off-plan' ? 'Indicaste que no pudiste comer como planeabas. Piensa qué te faltó: tiempo, alimentos disponibles o preparación. Usa esa información para organizar tu siguiente comida.' : 'Si necesitas ayuda para planificar tus comidas según tu deporte, consulta a un nutricionista. Puedes guardar una nota con lo que quieres preguntarle.',
        evidence: `Revisión de hoy: ${checkin.mealPlan === 'off-plan' ? 'no pude seguir mi planificación' : 'necesito orientación'}. Energía declarada: ${checkin.energy}/5.`, action: 'nutrition', label: 'Ver mi alimentación' });
    }
  }
  if (currentLoadRows.length >= 3 && previousLoadRows.length >= 3 && previousLoad > 0) {
    const delta = (currentLoad - previousLoad) / previousLoad * 100;
    actions.push({ tone: 'neutral', title: `Tu carga registrada ${delta >= 0 ? 'aumentó' : 'disminuyó'} ${Math.abs(delta).toFixed(0)} %`,
      body: 'Revisa si este cambio coincide con tu plan y con cómo te sientes. Puedes llevar esta comparación a tu entrenador.',
      evidence: `${currentLoadRows.length} sesiones con esfuerzo en los últimos 7 días frente a ${previousLoadRows.length} en los 7 anteriores. La carga suma los minutos de cada sesión multiplicados por el esfuerzo que indicaste (1–10). Si faltan sesiones, la comparación es incompleta. No mide la fatiga ni el riesgo de lesión.`, action: 'training', label: 'Revisar sesiones' });
  }
  const weekly = { start: monday, end: shiftDate(monday, 6), sessions: thisWeek.length, minutes: total(thisWeek, 'duration'),
    targetSessions: valid(goals.weeklySessions, 1, 21) ? Number(goals.weeklySessions) : null,
    targetMinutes: valid(goals.weeklyMinutes, 1, 10080) ? Number(goals.weeklyMinutes) : null };
  const comparableSports = ['Atletismo', 'Ciclismo', 'Natación', 'Trail running'];
  const races = (data.races || []).filter(row => row.date <= date && valid(row.time, 0.001, 100000) && valid(row.distance, 0.001, 2000)).sort((a,b) => b.date.localeCompare(a.date));
  const latest = races[0];
  let comparison = null;
  if (latest && comparableSports.includes(latest.sport)) {
    const earlier = races.find(row => row.id !== latest.id && row.date < latest.date && row.sport === latest.sport && Number(row.distance) === Number(latest.distance));
    if (earlier) {
      const preparation = race => {
        const start = shiftDate(race.date, -7), end = shiftDate(race.date, -1);
        const sessions = within(training, start, end).filter(row => row.sport === race.sport);
        const nights = within(rest, start, end).filter(row => valid(row.hours, 0, 24));
        const habits = within(checkins, start, end).filter(row => ['on-plan','off-plan','unsure'].includes(row.mealPlan));
        return { start, end, sessions: sessions.length, minutes: total(sessions, 'duration'), sleep: mean(nights,'hours'), sleepDays: nights.length, mealDays: habits.length, mealOnPlan: habits.filter(row=>row.mealPlan==='on-plan').length };
      };
      comparison = { latest, earlier, differenceMinutes: Number(latest.time)-Number(earlier.time), percent: (Number(latest.time)-Number(earlier.time))/Number(earlier.time)*100,
        before: preparation(earlier), after: preparation(latest) };
    }
  }
  return { date, goals, restToday, checkin, actions, weekly, comparison, latest, load: { current: currentLoad, previous: previousLoad, currentCount: currentLoadRows.length, previousCount: previousLoadRows.length } };
}
