import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProgram, planSessions, currentSession, completeSession, recipeShopping } from '../js/plan-engine.mjs';

const catalog = {
  plans: [{ id: 'habit', name: 'Crear hábito', sport: 'Otro', workouts: [
    { id: 'a', name: 'Sesión A', minutes: 10, exercises: [{ id: 'squat', reps: 8 }] },
    { id: 'b', name: 'Sesión B', minutes: 10, exercises: [{ id: 'walk', seconds: 60 }] }
  ] }],
  recipes: [
    { id: 'r1', name: 'Arroz y verduras', servings: 2, ingredients: [
      { id: 'rice', name: 'Arroz', quantity: 100, unit: 'g' },
      { id: 'tomato', name: 'Tomate', quantity: 2, unit: 'unidad' }
    ] },
    { id: 'r2', name: 'Otra receta', servings: 1, ingredients: [
      { id: 'rice', name: 'Arroz', quantity: 50, unit: 'g' },
      { id: 'tomato', name: 'Tomate', quantity: 100, unit: 'g' }
    ] }
  ]
};
const program = () => createProgram('habit', 20, '2026-12-28', catalog);
const record = (id = 't1') => ({ id, date: '2026-12-28', duration: 18, effort: 4 });

test('creates twelve calendar sessions across month and year boundaries', () => {
  const sessions = planSessions(program(), catalog);
  assert.equal(sessions.length, 12);
  assert.equal(sessions[0].date, '2026-12-28');
  assert.equal(sessions[2].date, '2027-01-01');
  assert.equal(sessions[11].date, '2027-01-22');
  assert.equal(sessions[11].week, 4);
  assert.equal(sessions[0].minutes, 20);
  assert.equal(sessions[0].workout.minutes, 10);
  assert.deepEqual(sessions.map(s => s.workout.id), ['a','b','a','b','a','b','a','b','a','b','a','b']);
});

test('rejects missing plans, impossible dates and unsupported target durations', () => {
  assert.throws(() => createProgram('missing', 10, '2026-10-01', catalog), /no está disponible/);
  assert.throws(() => createProgram('habit', 15, '2026-10-01', catalog), /10, 20 o 30/);
  assert.throws(() => createProgram('habit', 10, '2026-02-30', catalog), /no es válida/);
  assert.throws(() => createProgram('habit', 10, '2026-2-1', catalog), /formato/);
});

test('currentSession waits for the target date and respects pause', () => {
  const p = program();
  assert.equal(currentSession(p, catalog, '2026-12-27').due, false);
  assert.equal(currentSession(p, catalog, '2026-12-28').due, true);
  assert.equal(currentSession({ ...p, paused: true }, catalog, '2027-01-20').due, false);
  const completed = Array.from({ length: 12 }, (_, sessionIndex) => ({ sessionIndex }));
  assert.equal(currentSession({ ...p, completed }, catalog, '2027-02-01'), null);
});

test('completion records actual duration and keeps all existing information unchanged', () => {
  const data = { program: program(), training: [{ id: 'older', duration: 35 }], food: [{ id: 'meal' }], profile: { name: 'Alex' }, checkins: [{ id: 'c' }] };
  const before = structuredClone(data);
  const result = completeSession(data, catalog, 0, record());
  assert.deepEqual(data, before);
  assert.notStrictEqual(result, data);
  assert.equal(result.training.length, 2);
  assert.equal(result.training[1].name, 'Sesión A');
  assert.equal(result.training[1].duration, 18);
  assert.equal(result.training[1].effort, 4);
  assert.equal(result.training[1].sessionIndex, 0);
  assert.equal(result.program.completed[0].trainingId, 't1');
  assert.deepEqual(result.food, before.food);
  assert.deepEqual(result.profile, before.profile);
  assert.deepEqual(result.checkins, before.checkins);
  assert.equal(currentSession(result.program, catalog, '2026-12-30').index, 1);
});

test('completing a session twice does not duplicate training even with a new id', () => {
  const first = completeSession({ program: program(), training: [] }, catalog, 0, record());
  const second = completeSession(first, catalog, 0, record('another-id'));
  assert.strictEqual(second, first);
  assert.equal(second.training.length, 1);
  assert.equal(second.program.completed.length, 1);
});

test('rejects invalid completion without changing user data', () => {
  const data = { program: program(), training: [] };
  assert.throws(() => completeSession(data, catalog, 12, record()), /doce sesiones/);
  assert.throws(() => completeSession(data, catalog, 0, { ...record(), duration: 0 }), /duración real/);
  assert.throws(() => completeSession(data, catalog, 0, { ...record(), effort: 11 }), /esfuerzo/);
  assert.throws(() => completeSession({ ...data, program: { ...data.program, paused: true } }, catalog, 0, record()), /Reanuda/);
  assert.equal(data.training.length, 0);
  assert.equal(data.program.completed.length, 0);
});

test('session snapshots do not mutate catalog exercises', () => {
  const snapshot = planSessions(program(), catalog);
  snapshot[0].workout.exercises[0].reps = 100;
  assert.equal(catalog.plans[0].workouts[0].exercises[0].reps, 8);
});

test('shopping scales servings, combines ingredients and keeps distinct units separate', () => {
  const meals = [{ id: 'm1', recipeId: 'r1', servings: 4 }, { id: 'm2', recipeId: 'r2', servings: 1 }];
  const before = structuredClone({ meals, catalog });
  const list = recipeShopping(meals, catalog);
  assert.equal(list.find(r => r.id === 'rice' && r.unit === 'g').quantity, 250);
  assert.equal(list.find(r => r.id === 'tomato' && r.unit === 'unidad').quantity, 4);
  assert.equal(list.find(r => r.id === 'tomato' && r.unit === 'g').quantity, 100);
  assert.equal(new Set(list.map(r => r.key)).size, 3);
  assert.deepEqual({ meals, catalog }, before);
});

test('shopping handles no meals and rejects missing recipes or invalid servings', () => {
  assert.deepEqual(recipeShopping([], catalog), []);
  assert.throws(() => recipeShopping([{ recipeId: 'missing', servings: 1 }], catalog), /no está disponible/);
  assert.throws(() => recipeShopping([{ recipeId: 'r1', servings: 0 }], catalog), /porciones/);
});
