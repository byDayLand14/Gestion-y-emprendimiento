const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function field(name,label,type='text',value='',extra='',hint='') {
 return `<label class="field-label" for="f-${name}">${label}<input id="f-${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra} ${hint?`aria-describedby="hint-${name}"`:''}>${hint?`<small id="hint-${name}" class="field-hint">${hint}</small>`:''}</label>`;
}
export function choices(name,label,options,value='',hint='') {
 return `<fieldset class="choice-group" ${hint?`aria-describedby="hint-${name}"`:''}><legend>${label}</legend>${hint?`<p id="hint-${name}" class="field-hint">${hint}</p>`:''}<div class="choice-options">${options.map(([key,text])=>`<label class="choice"><input type="radio" name="${name}" value="${esc(key)}" ${String(value)===String(key)?'checked':''} required><span><i class="choice-check" aria-hidden="true">✓</i>${text}</span></label>`).join('')}</div></fieldset>`;
}
export function clearErrors(form) {
 form.querySelectorAll('.field-error,.form-error').forEach(el=>el.remove());
 form.querySelectorAll('[aria-invalid]').forEach(el=>{el.removeAttribute('aria-invalid');const ids=(el.getAttribute('aria-describedby')||'').split(' ').filter(id=>!id.startsWith('error-'));if(ids.length)el.setAttribute('aria-describedby',ids.join(' '));else el.removeAttribute('aria-describedby');});
}
export function formError(form,message,name) {
 let banner=form.querySelector('.form-error');
 if(!banner){banner=document.createElement('div');banner.className='form-error';banner.setAttribute('role','alert');banner.tabIndex=-1;form.prepend(banner);}
 banner.textContent=message;
 const control=name?form.elements.namedItem(name):null;
 const el=control?.nodeType?control:control?.[0];
 if(el){let parent=el.parentElement;while(parent&&parent!==form){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;}const group=el.closest('fieldset')||el.closest('label');const errorId='error-'+name;let note=form.querySelector('#'+errorId);if(!note){note=document.createElement('p');note.id=errorId;note.className='field-error';group.append(note);}note.textContent=message;const peers=el.type==='radio'?[...form.elements].filter(x=>x.name===name):[el];peers.forEach(peer=>{peer.setAttribute('aria-invalid','true');peer.setAttribute('aria-describedby',[peer.getAttribute('aria-describedby')||'',errorId].join(' ').trim());});el.focus();el.scrollIntoView({block:'nearest'});}else banner.focus();
 return false;
}
export function validateForm(form,scope=form) {
 clearErrors(form);
 for(const el of scope.querySelectorAll('input,select,textarea')){
  if(el.disabled||el.type==='hidden'||el.validity.valid)continue;
  let message='Revisa este dato para continuar.';
  if(el.validity.valueMissing)message=el.type==='radio'?'Elige una respuesta para continuar.':'Completa este campo para continuar.';
  else if(el.validity.badInput)message='Escribe un número válido.';
  else if(el.validity.typeMismatch)message='Escribe un correo válido, por ejemplo nombre@correo.com.';
  else if(el.type==='date'&&(el.validity.rangeUnderflow||el.validity.rangeOverflow))message='Elige una fecha de hoy o anterior.';
  else if(el.validity.rangeUnderflow||el.validity.rangeOverflow)message=`Escribe un número entre ${el.min||'0'} y ${el.max||'el límite indicado'}.`;
  else if(el.validity.stepMismatch)message=el.step==='1'||!el.step?'Escribe un número entero, sin decimales.':'Revisa los decimales de este número.';
  else if(el.validity.tooShort)message=`Usa al menos ${el.minLength} caracteres.`;
  return formError(form,message,el.name);
 }
 return true;
}
export function prepareForms(root) {
 for(const form of root.querySelectorAll('form')) {
  form.noValidate=true;
  form.addEventListener('input',()=>{form.dataset.dirty='true';clearErrors(form);});
  form.addEventListener('change',()=>{form.dataset.dirty='true';clearErrors(form);});
 }
}
