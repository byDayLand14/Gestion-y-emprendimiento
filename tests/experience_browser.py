from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from functools import partial
from pathlib import Path
import shutil
ROOT=Path(__file__).resolve().parents[1]
ARTIFACTS=ROOT/'test-results'
ARTIFACTS.mkdir(exist_ok=True)
import json
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_address[1]}'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=shutil.which('chromium') or shutil.which('google-chrome'),headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1050},timezone_id='America/Guayaquil');errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(url+'/#inicio')
 page.wait_for_selector('[data-plan]')
 assert page.locator('[data-plan]').count()==3
 assert page.locator('main form').count()==0
 page.screenshot(path=str(ARTIFACTS/'elitecore-objetivos.png'),full_page=True,animations='disabled')
 page.locator('[data-plan="strength-home"]').click()
 page.get_by_role('radio',name='10 minutos',exact=True).check()
 page.get_by_role('button',name='Crear mi plan',exact=True).click()
 page.wait_for_function("!document.querySelector('dialog').open")
 state=json.loads(page.evaluate("localStorage.getItem('elitecore-v1')"));assert state['program']['planId']=='strength-home'
 assert page.get_by_role('button',name='Empezar sesión',exact=True).is_visible()
 page.screenshot(path=str(ARTIFACTS/'elitecore-hoy.png'),full_page=True,animations='disabled')
 page.get_by_role('button',name='Empezar sesión',exact=True).click()
 assert page.locator('#player-clock').inner_text()=='2:00'
 page.get_by_role('button',name='Siguiente bloque',exact=True).click()
 assert 'Sentadilla' in page.locator('.player-title').inner_text()
 imgs=page.locator('.exercise-photos img');assert imgs.count()==2
 assert imgs.evaluate_all('(imgs)=>imgs.every(img=>img.complete&&img.naturalWidth>0)')
 page.screenshot(path=str(ARTIFACTS/'elitecore-sesion-guiada.png'),full_page=True,animations='disabled')
 # Timer advances automatically to the rest phase when the current phase ends.
 page.locator('#player-toggle').click()
 page.wait_for_function("document.querySelector('#player-toggle').textContent==='Pausar'")
 page.locator('#player-next').click()
 assert page.locator('.player-title').inner_text()=='Descansa'
 assert page.locator('#player-toggle').inner_text()=='Pausar'
 page.locator('#player-toggle').click()
 page.locator('#player-finish').click()
 page.get_by_role('button',name='Guardar sesión completada',exact=True).click()
 assert page.locator('.form-error').is_visible()
 page.locator('[name=duration]').fill('10')
 page.get_by_role('radio',name='Moderado',exact=True).check()
 page.get_by_role('button',name='Guardar sesión completada',exact=True).click()
 page.wait_for_url('**/#analisis')
 state=json.loads(page.evaluate("localStorage.getItem('elitecore-v1')"));assert len(state['training'])==len(state['program']['completed'])==1
 assert state['training'][0]['duration']==10
 assert page.evaluate("sessionStorage.getItem('elitecore-active-workout')") is None
 # Manual corrections preserve the plan linkage; deleting and undoing also update plan completion.
 page.goto(url+'/#entrenamiento');page.locator('[data-edit]').click();page.locator('[name=duration]').fill('12');page.get_by_role('button',name='Guardar entrenamiento',exact=True).click();page.wait_for_function("!document.querySelector('dialog').open")
 edited=json.loads(page.evaluate("localStorage.getItem('elitecore-v1')"));assert edited['training'][0]['programId']==edited['program']['instanceId'];assert edited['training'][0]['duration']=='12'
 page.locator('[data-delete]').click();assert len(json.loads(page.evaluate("localStorage.getItem('elitecore-v1')"))['program']['completed'])==0
 page.get_by_role('button',name='Deshacer',exact=True).click();page.wait_for_function("JSON.parse(localStorage.getItem('elitecore-v1')).program.completed.length===1")
 page.get_by_role('link',name='Mi plan',exact=True).click();page.wait_for_selector('.week-card')
 assert page.locator('.week-card').count()==4
 assert page.locator('.session-row').count()==12
 page.get_by_role('button',name='Pausar mi plan',exact=True).click()
 assert json.loads(page.evaluate("localStorage.getItem('elitecore-v1')"))['program']['paused']
 page.get_by_role('button',name='Reanudar mi plan',exact=True).click()
 # A new plan preserves history and has a distinct instance identifier.
 old=state['program']['instanceId']
 page.get_by_role('button',name='Cambiar objetivo o tiempo').click()
 page.locator('#dialog [data-plan="endurance-easy"]').click()
 page.get_by_role('button',name='Crear mi plan',exact=True).click()
 page.wait_for_function("!document.querySelector('dialog').open")
 state=json.loads(page.evaluate("localStorage.getItem('elitecore-v1')"));assert state['program']['instanceId']!=old;assert len(state['training'])==1;assert len(state['programHistory'])==1
 page.get_by_role('link',name='Comidas',exact=True).click();page.wait_for_selector('.recipe-card')
 assert page.locator('.recipe-card').count()==6
 page.locator('#food-filter').select_option('vegetarian');assert page.locator('.recipe-card').count()==4
 page.locator('#allergen-filter').select_option('gluten');assert page.locator('.recipe-card').count()==2
 page.locator('[data-recipe="lentil-salad"]').click()
 assert 'Ingredientes' in page.locator('#dialog').inner_text()
 page.locator('#add-recipe').click();page.locator('[name=servings]').fill('1')
 page.get_by_role('button',name='Añadir comida y sus ingredientes').click()
 page.wait_for_function("!document.querySelector('dialog').open")
 assert page.locator('.planned-meal').count()==1
 page.get_by_role('button',name='Lista de compras',exact=True).click()
 assert '200 g' in page.locator('.shopping-list').inner_text()
 assert '7,5 ml' in page.locator('.shopping-list').inner_text()
 page.locator('[data-shopping]').first.check()
 assert page.locator('[data-shopping]').first.is_checked()
 with page.expect_download() as dl:page.get_by_role('button',name='Descargar lista',exact=True).click()
 assert 'Lentejas cocidas: 200 g' in Path(dl.value.path()).read_text()
 page.screenshot(path=str(ARTIFACTS/'elitecore-compras.png'),full_page=True,animations='disabled')
 page.get_by_role('button',name='Mi semana',exact=True).click();page.locator('[data-remove-meal]').click()
 page.get_by_role('button',name='Lista de compras',exact=True).click()
 assert page.locator('.shopping-item').count()==0
 # Legacy records survive reload and all new routes remain usable on mobile.
 page.reload();page.wait_for_selector('h1');assert len(json.loads(page.evaluate("localStorage.getItem('elitecore-v1')"))['training'])==1
 page.set_viewport_size({'width':390,'height':844})
 page.goto(url+'/#inicio');page.wait_for_selector('.session-hero')
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path=str(ARTIFACTS/'elitecore-hoy-movil.png'),full_page=True,animations='disabled')
 page.locator('#menu-toggle').click();page.get_by_role('link',name='Comidas',exact=True).click();page.wait_for_selector('.recipe-card')
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path=str(ARTIFACTS/'elitecore-recetas-movil.png'),full_page=True,animations='disabled')
 assert not errors,errors
 print('PASS: objetivo a plan, sesión con fotos/temporizador/pausa, finalización con tiempo real, calendario, pausa/cambio sin perder registros, recetas/filtros, menú semanal, lista escalada/checklist/descarga, actualización al quitar comidas, persistencia y móvil. Sin errores JS.')
 b.close()
server.shutdown()
