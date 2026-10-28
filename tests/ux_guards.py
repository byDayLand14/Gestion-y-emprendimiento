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
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
BASE_URL=f'http://127.0.0.1:{server.server_address[1]}'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=shutil.which('chromium') or shutil.which('google-chrome'),headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1280,'height':900})
 page.goto(BASE_URL + '/#perfil');page.locator('#profile-form [name=name]').fill('Sin guardar')
 page.once('dialog',lambda d:d.dismiss());page.get_by_role('link',name='Inicio',exact=True).click()
 page.wait_for_function("location.hash==='#perfil'")
 assert page.locator('#profile-form [name=name]').input_value()=='Sin guardar'
 # Skip link focuses content and does not change route or discard edits.
 page.locator('.skip-link').focus();page.keyboard.press('Enter')
 assert page.evaluate("location.hash==='#perfil' && document.activeElement.id==='main'")
 # Failing storage keeps the form open with an actionable error.
 page.evaluate("() => {window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError')};}")
 page.get_by_role('button',name='Guardar mi perfil').click()
 assert 'No se pudo guardar' in page.locator('.form-error').inner_text()
 assert page.locator('#profile-form [name=name]').input_value()=='Sin guardar'
 page.evaluate('() => {Storage.prototype.setItem=window.originalSetItem;}')
 page.get_by_role('button',name='Guardar mi perfil').click()
 assert json.loads(page.evaluate("localStorage.getItem('elitecore-v1')"))['profile']['name']=='Sin guardar'
 # Invalid optional data must reveal the collapsed field.
 page.locator('#profile-form .optional-fields summary').click();page.locator('[name=age]').fill('200');page.locator('#profile-form .optional-fields summary').click()
 page.get_by_role('button',name='Guardar mi perfil').click()
 assert page.locator('#profile-form .optional-fields').evaluate('(e)=>e.open')
 assert page.locator('[name=age]').evaluate('(e)=>e===document.activeElement')
 page.locator('[name=age]').fill('24');page.get_by_role('button',name='Guardar mi perfil').click()
 # A pending sync cannot close a form or accidentally close a later modal.
 page2=b.new_page();pending=[]
 page2.route('**/js/config.js',lambda r:r.fulfill(content_type='application/javascript',body="window.ELITECORE_CONFIG={supabaseUrl:'https://example.supabase.co',supabaseAnonKey:'test-public'}"))
 page2.add_init_script("sessionStorage.setItem('elitecore-session',JSON.stringify({access_token:'test',user:{id:'test'}}))")
 page2.route('https://example.supabase.co/**',lambda r:pending.append(r) if r.request.method=='POST' else r.fulfill(json=[]))
 page2.goto(BASE_URL + '/#entrenamiento')
 page2.get_by_role('button',name='＋ Añadir entrenamiento').click()
 page2.locator('[name=name]').fill('Carrera');page2.locator('[name=duration]').fill('30');page2.locator('[name=effort]').fill('4')
 page2.get_by_role('button',name='Guardar entrenamiento',exact=True).click()
 page2.wait_for_function("document.querySelector('#record-form').dataset.saving==='true'")
 page2.locator('#close-dialog').click()
 assert page2.locator('#dialog').evaluate('(e)=>e.open')
 assert 'estamos guardando' in page2.locator('.form-error').inner_text()
 assert pending
 pending[0].fulfill(status=201,body='')
 page2.wait_for_function("!document.querySelector('dialog').open")
 assert json.loads(page2.evaluate("localStorage.getItem('elitecore-v1')"))['training'][0]['name']=='Carrera'
 page2.get_by_role('link',name='Inicio',exact=True).click();page2.locator('[data-plan]').first.click();page2.get_by_role('button',name='Crear mi plan',exact=True).click()
 page2.wait_for_function("document.querySelector('#choose-plan-form').dataset.saving==='true'")
 page2.locator('#close-dialog').click();assert 'estamos guardando' in page2.locator('.form-error').inner_text()
 pending[1].fulfill(status=201,body='');page2.wait_for_function("!document.querySelector('dialog').open")
 print('PASS: protección del perfil sin guardar, enlace de salto, fallo de almacenamiento sin pérdida de respuestas y protección del formulario durante sincronización pendiente (API simulada).')
 b.close()
server.shutdown()
