const COLLECTIONS={exercises:'exercise_catalog',recipes:'recipe_catalog',plans:'plan_catalog'};
const id=value=>typeof value==='string'&&/^[A-Za-z0-9_-]+$/.test(value);
export function validateCatalog(catalog){
 for(const key of Object.keys(COLLECTIONS)){if(!Array.isArray(catalog?.[key])||!catalog[key].length)throw new Error('Catálogo incompleto');const seen=new Set();for(const row of catalog[key]){if(!id(row.id)||seen.has(row.id)||typeof row.name!=='string')throw new Error('Entrada inválida');seen.add(row.id);}}
 const exercises=new Set(catalog.exercises.map(e=>e.id));
 for(const e of catalog.exercises)if(!Array.isArray(e.steps)||!e.steps.every(s=>typeof s==='string')||!Array.isArray(e.images)||!e.images.every(path=>/^assets\/exercises\/[A-Za-z0-9_-]+\/[01]\.jpg$/.test(path)))throw new Error('Ejercicio inválido');
 for(const p of catalog.plans)if(typeof p.description!=='string'||!Array.isArray(p.workouts)||!p.workouts.length||p.workouts.some(w=>!id(w.id)||typeof w.name!=='string'||!w.exercises?.length||w.exercises.some(e=>!exercises.has(e.id))))throw new Error('Plan inválido');
 for(const r of catalog.recipes)if(!Number.isFinite(r.minutes)||r.minutes<=0||r.minutes>1440||typeof r.note!=='string'||!r.allergens?.every(a=>typeof a==='string')||!/^#[0-9a-f]{6}$/i.test(r.color)||!Number.isFinite(r.servings)||r.servings<=0||!Array.isArray(r.allergens)||!Array.isArray(r.steps)||!r.steps.every(s=>typeof s==='string')||!r.ingredients?.length||r.ingredients.some(i=>!id(i.id)||typeof i.name!=='string'||typeof i.unit!=='string'||!Number.isFinite(i.quantity)||i.quantity<0))throw new Error('Receta inválida');
 return catalog;
}
export async function loadCatalog(config={},fetcher=fetch){
 const response=await fetcher(new URL('../data/catalog.json',import.meta.url));
 if(!response.ok)throw new Error('No se pudo cargar el catálogo');
 const local=validateCatalog(await response.json());
 if(!config.supabaseUrl||!config.supabaseAnonKey)return local;
 try{const base=new URL(config.supabaseUrl);if(base.protocol!=='https:')return local;
  const rows=await Promise.all(Object.entries(COLLECTIONS).map(async([key,table])=>{const result=await fetcher(base.origin+`/rest/v1/${table}?select=payload`,{headers:{apikey:config.supabaseAnonKey},signal:AbortSignal.timeout(6000)});if(!result.ok)throw new Error('Catálogo remoto no disponible');const values=await result.json();if(!Array.isArray(values))throw new Error('Formato inválido');return [key,values.map(row=>row.payload)];}));
  return validateCatalog({...local,...Object.fromEntries(rows)});
 }catch{return local;}
}
