from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from functools import partial
import json
from pathlib import Path
import shutil
ROOT=Path(__file__).resolve().parents[1]
ARTIFACTS=ROOT/'test-results'
ARTIFACTS.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
BASE_URL=f'http://127.0.0.1:{server.server_address[1]}'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium') or shutil.which('google-chrome'),headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1000},timezone_id='America/Guayaquil');errors=[]
 page.on('pageerror',lambda err:errors.append(str(err)))
 page.goto(BASE_URL + '/#descanso')
 assert page.locator('h1').inner_text()=='Tu descanso'
 assert page.locator('[data-checkin]').count()==1
 assert page.locator('#nav>a').count()==4
 assert page.locator('#main table').count()==0
 page.locator('[data-checkin]').click()
 assert page.locator('dialog').get_attribute('aria-labelledby')=='dialog-title'
 page.locator('#checkin-next').click()
 assert page.locator('.form-error').is_visible()
 assert page.locator('#f-sleepHours').get_attribute('aria-invalid')=='true'
 page.locator('[name=sleepHours]').fill('7');page.locator('[name=sleepMinutes]').fill('90')
 page.locator('#checkin-next').click()
 assert '0 y 59' in page.locator('.field-error').inner_text()
 assert page.locator('[name=sleepMinutes]').evaluate('(e)=>e===document.activeElement')
 page.locator('[name=sleepMinutes]').fill('30')
 page.get_by_role('radio',name='Descansado',exact=True).check()
 page.locator('#checkin-next').click()
 assert page.locator('#step-status').inner_text()=='Paso 2 de 3'
 page.get_by_role('radio',name='Poca energía',exact=True).check()
 page.get_by_role('radio',name='Un entrenamiento intenso',exact=True).check()
 page.locator('#checkin-back').click()
 assert page.locator('[name=sleepHours]').input_value()=='7'
 assert page.locator('[name=recovery][value="4"]').is_checked()
 page.locator('#checkin-next').click();page.locator('#checkin-next').click()
 page.get_by_role('radio',name='Me costó organizar mis comidas',exact=True).check()
 # Cancel with changes, choose to continue editing.
 page.once('dialog',lambda d:d.dismiss())
 page.locator('[data-cancel]').click()
 assert page.locator('#dialog').evaluate('(d)=>d.open')
 page.locator('#checkin-submit').click()
 page.wait_for_function("!document.querySelector('dialog').open")
 d=json.loads(page.evaluate("localStorage.getItem('elitecore-v1')"));assert len(d['rest'])==len(d['checkins'])==1
 assert d['rest'][0]['hours']=='7.5';assert d['checkins'][0]['energy']=='2'
 assert d['checkins'][0]['energy']=='2'
 # Updating daily responses must not duplicate.
 page.goto(BASE_URL + '/#descanso')
 page.locator('[data-checkin]').click();page.locator('#checkin-next').click();page.locator('#checkin-next').click();page.locator('#checkin-submit').click()
 page.wait_for_function("!document.querySelector('dialog').open")
 assert len(json.loads(page.evaluate("localStorage.getItem('elitecore-v1')"))['rest'])==1
 page.goto(BASE_URL + '/#entrenamiento')
 page.wait_for_function("document.activeElement.tagName==='H1'")
 page.get_by_role('button',name='＋ Añadir entrenamiento').click()
 page.locator('[name=name]').fill('Carrera suave');page.locator('[name=duration]').fill('0');page.locator('[name=effort]').fill('3')
 page.get_by_role('button',name='Guardar entrenamiento',exact=True).click()
 assert page.locator('.field-error').is_visible()
 page.locator('[name=duration]').fill('45')
 page.get_by_role('button',name='Guardar entrenamiento',exact=True).click()
 page.wait_for_function("!document.querySelector('dialog').open")
 assert 'Carrera suave' in page.locator('main').inner_text()
 page.get_by_role('button',name='Eliminar Carrera suave').click()
 assert not json.loads(page.evaluate("localStorage.getItem('elitecore-v1')"))['training']
 page.get_by_role('button',name='Deshacer',exact=True).click()
 page.wait_for_function("JSON.parse(localStorage.getItem('elitecore-v1')).training.length===1")
 # Race time uses explicit hh/mm/ss and human-readable table, no decimal time field.
 page.goto(BASE_URL + '/#competencias')
 page.get_by_role('button',name='＋ Añadir competencia').click()
 page.locator('[name=name]').fill('Carrera 10 km');page.locator('[name=distance]').fill('10')
 page.get_by_role('button',name='Guardar resultado',exact=True).click()
 assert 'mayor que cero' in page.locator('.form-error').inner_text()
 page.locator('[name=raceMinutes]').fill('48');page.locator('[name=raceSeconds]').fill('30')
 page.get_by_role('button',name='Guardar resultado',exact=True).click()
 page.wait_for_function("!document.querySelector('dialog').open")
 assert '48 min 30 s' in page.locator('main').inner_text()
 assert json.loads(page.evaluate("localStorage.getItem('elitecore-v1')"))['races'][0]['time']=='48.5'
 # Profile only needs basic fields, additional personal data is optional.
 page.goto(BASE_URL + '/#perfil')
 page.locator('#profile-form [name=name]').fill('Alex');page.get_by_role('button',name='Guardar mi perfil').click()
 assert json.loads(page.evaluate("localStorage.getItem('elitecore-v1')"))['profile']['name']=='Alex'
 # Partial goals are allowed.
 page.locator('[data-goals]').first.click();page.locator('[name=weeklySessions]').fill('3');page.get_by_role('button',name='Guardar mis metas').click()
 page.wait_for_function("!document.querySelector('dialog').open")
 assert json.loads(page.evaluate("localStorage.getItem('elitecore-v1')"))['goals']=={'weeklySessions':3}
 page.get_by_role('link',name='Inicio',exact=True).click()
 page.locator('#toast').evaluate('(e)=>e.style.display="none"')
 page.screenshot(path=str(ARTIFACTS/'elitecore-ux-escritorio.png'),full_page=True)
 # Mobile menu, keyboard, touch sizes, navigation and storage access.
 page.set_viewport_size({'width':390,'height':844})
 page.wait_for_function("document.querySelector('#sidebar').inert===true")
 assert page.locator('#menu-toggle').is_visible()
 page.locator('#menu-toggle').click()
 assert page.locator('#menu-toggle').get_attribute('aria-expanded')=='true'
 assert not page.locator('#sidebar').evaluate('(e)=>e.inert')
 assert page.locator('#storage-label').is_visible()
 page.get_by_role('link',name='Mi progreso',exact=True).click()
 assert page.locator('#menu-toggle').get_attribute('aria-expanded')=='false'
 page.wait_for_function("document.activeElement.tagName==='H1'")
 page.locator('#menu-toggle').click();page.keyboard.press('Escape')
 assert page.locator('#menu-toggle').evaluate('(e)=>e===document.activeElement')
 assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth')
 page.goto(BASE_URL + '/#inicio')
 page.screenshot(path=str(ARTIFACTS/'elitecore-ux-movil.png'),full_page=True)
 page.goto(BASE_URL + '/#descanso')
 page.locator('[data-checkin]').click()
 page.screenshot(path=str(ARTIFACTS/'elitecore-ux-formulario.png'),full_page=True)
 assert page.locator('#checkin-next').bounding_box()['height']>=44
 assert page.locator('[name=sleepHours]').bounding_box()['height']>=44
 assert not errors,errors
 print('PASS: navegación simplificada, foco, wizard/retroceso/cancelación, errores persistentes, escalas descriptivas, guardado sin duplicados, deshacer, tiempos hh/mm/ss, perfil opcional, metas parciales, menú móvil/teclado y objetivos táctiles. Sin errores JS.')
 browser.close()
server.shutdown()
