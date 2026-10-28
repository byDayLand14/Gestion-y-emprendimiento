// Calendario y lista de compras. Estas funciones no prescriben actividad ni dietas.
const SESSION_OFFSETS = Object.freeze([0, 2, 4, 7, 9, 11, 14, 16, 18, 21, 23, 25]);
const ALLOWED_MINUTES = new Set([10, 20, 30]);
const clone = value => structuredClone(value);
const text = value => typeof value === 'string' && value.trim().length > 0;

function requireDate(value, label = 'La fecha') {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label} debe tener el formato AAAA-MM-DD.`);
  }
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`${label} no es válida.`);
  }
  return date;
}

function shiftDate(value, days) {
  const date = requireDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function resolvePlan(program, catalog) {
  if (!program || typeof program !== 'object') throw new Error('Primero elige un plan.');
  const plan = catalog?.plans?.find(item => item.id === program.planId);
  if (!plan) throw new Error('El plan elegido no está disponible. Elige otro plan.');
  if (!Array.isArray(plan.workouts) || !plan.workouts.length) {
    throw new Error('Este plan todavía no tiene sesiones disponibles.');
  }
  if (!ALLOWED_MINUTES.has(Number(program.minutes))) {
    throw new Error('Elige una duración de 10, 20 o 30 minutos.');
  }
  requireDate(program.startDate, 'La fecha de inicio');
  return plan;
}

function completedRows(program) {
  return Array.isArray(program.completed) ? program.completed : [];
}

/** Creates a four-week program, without changing the catalog. */
export function createProgram(planId, minutes, startDate, catalog) {
  const program = { planId, minutes: Number(minutes), startDate, completed: [], paused: false };
  resolvePlan(program, catalog);
  return program;
}

/**
 * Each session includes the chosen target minutes; the catalog workout is preserved.
 * Exercise volumes are not automatically multiplied when the target time changes.
 */
export function planSessions(program, catalog) {
  const plan = resolvePlan(program, catalog);
  const completed = new Set(completedRows(program).map(row => Number(row.sessionIndex)));
  return SESSION_OFFSETS.map((offset, index) => ({
    index,
    number: index + 1,
    week: Math.floor(index / 3) + 1,
    date: shiftDate(program.startDate, offset),
    minutes: Number(program.minutes),
    workout: clone(plan.workouts[index % plan.workouts.length]),
    status: completed.has(index) ? 'completed' : 'pending'
  }));
}

/** Returns the first unfinished session, or null when the twelve sessions are done. */
export function currentSession(program, catalog, today) {
  requireDate(today, 'La fecha de hoy');
  const session = planSessions(program, catalog).find(item => item.status === 'pending');
  if (!session) return null;
  return { ...session, due: !program.paused && session.date <= today, paused: Boolean(program.paused) };
}

/**
 * Adds one actual training record and completion marker, without mutating data.
 * The caller supplies the record id/date/duration and asks the athlete for effort.
 * Repeated completion of the same session is a no-op, even with another record id.
 */
export function completeSession(data, catalog, index, record) {
  const program = data?.program;
  const plan = resolvePlan(program, catalog);
  if (!Number.isInteger(index) || index < 0 || index >= SESSION_OFFSETS.length) {
    throw new Error('Elige una de las doce sesiones de tu plan.');
  }
  if (completedRows(program).some(row => Number(row.sessionIndex) === index)) return data;
  if (program.paused) throw new Error('Reanuda tu plan antes de completar una sesión.');
  if (!record || !text(record.id)) throw new Error('Falta el identificador del entrenamiento.');
  requireDate(record.date, 'La fecha del entrenamiento');
  const duration = Number(record.duration);
  const effort = Number(record.effort);
  if (!Number.isFinite(duration) || duration < 1 || duration > 1440) {
    throw new Error('La duración real debe estar entre 1 y 1440 minutos.');
  }
  if (!Number.isInteger(effort) || effort < 1 || effort > 10) {
    throw new Error('Indica tu esfuerzo del 1 al 10.');
  }
  const training = Array.isArray(data.training) ? data.training : [];
  if (training.some(row => row.id === record.id)) {
    throw new Error('Ese entrenamiento ya existe. Vuelve a abrir la sesión para guardarla.');
  }
  const session = planSessions(program, catalog)[index];
  const programId = program.instanceId || `${program.planId}:${program.startDate}`;
  const newRecord = {
    ...clone(record),
    name: text(record.name) ? record.name.trim() : session.workout.name,
    sport: text(record.sport) ? record.sport : plan.sport || 'Otro',
    duration,
    effort,
    programId,
    sessionIndex: index,
    workoutId: session.workout.id
  };
  return {
    ...data,
    training: [...training, newRecord],
    program: {
      ...program,
      completed: [...completedRows(program), { sessionIndex: index, trainingId: newRecord.id, date: newRecord.date }]
    }
  };
}

/**
 * Aggregates the selected meal rows. Filter dates before passing them to this function.
 * Equal ingredients with different units remain separate; no implicit g/kg conversion.
 */
export function recipeShopping(mealPlan, catalog) {
  if (!Array.isArray(mealPlan)) throw new Error('La planificación de comidas no es válida.');
  const grouped = new Map();
  for (const meal of mealPlan) {
    const recipe = catalog?.recipes?.find(item => item.id === meal.recipeId);
    if (!recipe) throw new Error('Una receta de tu planificación ya no está disponible. Revísala antes de crear la lista.');
    const servings = Number(meal.servings);
    const baseServings = Number(recipe.servings);
    if (!Number.isFinite(servings) || servings <= 0 || servings > 100 || !Number.isFinite(baseServings) || baseServings <= 0) {
      throw new Error('Revisa el número de porciones de tus recetas.');
    }
    if (!Array.isArray(recipe.ingredients)) throw new Error('Esta receta no tiene una lista de ingredientes válida.');
    for (const ingredient of recipe.ingredients) {
      const quantity = Number(ingredient.quantity);
      if (!text(ingredient.id) || !text(ingredient.name) || !text(ingredient.unit) || !Number.isFinite(quantity) || quantity < 0) {
        throw new Error('Revisa los ingredientes y unidades de la receta antes de generar la lista.');
      }
      if (quantity === 0) continue;
      const key = JSON.stringify([ingredient.id, ingredient.unit]);
      const row = grouped.get(key) || {
        key,
        id: ingredient.id,
        name: ingredient.name,
        unit: ingredient.unit,
        quantity: 0,
        recipeIds: []
      };
      row.quantity += quantity * servings / baseServings;
      if (!row.recipeIds.includes(recipe.id)) row.recipeIds.push(recipe.id);
      grouped.set(key, row);
    }
  }
  return [...grouped.values()]
    .map(row => ({ ...row, quantity: Number(row.quantity.toFixed(6)) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es') || a.unit.localeCompare(b.unit));
}
