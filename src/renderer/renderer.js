// renderer.js — Inventario Pub Sirocco (alineado a tu index.html)
/*
HTML esperado:
- Formulario: #form-articulo
- Inputs: #nombre, #categoria, #cantidad, #precio, #observaciones
- Botones: #btn-guardar (submit), #btn-cancelar-edicion (button)
- Tabla body: #tbody-items
- Buscador: #filtro-busqueda
- Avisos: #badge-guardado, #error
- Modal: #modal-overlay, #confirm-modal, #modal-aceptar, #modal-cancelar
*/

////////////////////////////// Utilidades //////////////////////////////
const SafeStore = {
  key: 'inventario_sirocco_state_v3',
  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return { items: [], lastId: 0 };
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.items)) return { items: [], lastId: 0 };
      return { items: parsed.items, lastId: Number(parsed.lastId || 0) };
    } catch (e) {
      console.warn('No se pudo cargar estado, iniciando vacío', e);
      return { items: [], lastId: 0 };
    }
  },
  save(state) {
    try {
      localStorage.setItem(this.key, JSON.stringify(state));
      flashSaved();
    } catch (e) {
      console.error('Error guardando estado', e);
    }
  }
};

const dom = (sel) => document.querySelector(sel);
const cel = (tag, props = {}) => Object.assign(document.createElement(tag), props);

////////////////////////////// Estado //////////////////////////////
let state = SafeStore.load();
let selectedId = null;        // id en edición; null → modo crear
let pendingDeleteId = null;   // id pendiente de borrar (modal)

////////////////////////////// Referencias DOM //////////////////////////////
const $form = dom('#form-articulo');
const $nombre = dom('#nombre');
const $categoria = dom('#categoria');
const $cantidad = dom('#cantidad');
const $precio = dom('#precio');
const $observaciones = dom('#observaciones');

const $btnGuardar = dom('#btn-guardar');
const $btnCancelarEdicion = dom('#btn-cancelar-edicion');

const $tbody = dom('#tbody-items');
const $buscador = dom('#filtro-busqueda');
const $error = dom('#error');
const $badgeGuardado = dom('#badge-guardado');

// Modal
const $overlay = dom('#modal-overlay');
const $modal = dom('#confirm-modal');
const $modalAceptar = dom('#modal-aceptar');
const $modalCancelar = dom('#modal-cancelar');

////////////////////////////// UI helpers //////////////////////////////
function showError(msg) {
  if (!$error) return;
  $error.textContent = msg || '';
  $error.style.display = msg ? 'block' : 'none';
}

function flashSaved() {
  if (!$badgeGuardado) return;
  $badgeGuardado.textContent = 'Guardado ✓';
  $badgeGuardado.classList.add('ok');
  setTimeout(() => {
    $badgeGuardado.textContent = '';
    $badgeGuardado.classList.remove('ok');
  }, 1200);
}

function setFormMode(mode /* 'create' | 'edit' */) {
  const isEdit = mode === 'edit';
  if ($btnCancelarEdicion) $btnCancelarEdicion.style.display = isEdit ? 'inline-flex' : 'none';
  if ($btnGuardar) $btnGuardar.textContent = isEdit ? 'Guardar cambios' : 'Guardar';
}

function clearForm() {
  $form?.reset();
  selectedId = null;           // 🔑 evita bloqueo tras borrar/cancelar
  setFormMode('create');
  showError('');
  $nombre?.focus();
}

////////////////////////////// Normalización //////////////////////////////
// Soporta datos antiguos guardados con name/qty/price/category
function normalize(it) {
  return {
    id: it.id,
    nombre: it.nombre ?? it.name ?? '',
    categoria: it.categoria ?? it.category ?? '',
    cantidad: Number(it.cantidad ?? it.qty ?? 0),
    precio: Number(it.precio ?? it.price ?? 0),
    observaciones: it.observaciones ?? it.notes ?? ''
  };
}

////////////////////////////// CRUD //////////////////////////////
function nextId() {
  state.lastId = (Number(state.lastId) || 0) + 1;
  return state.lastId;
}

function persistAndRender(opts = {}) {
  const { clearFilter = false } = opts;
  if (clearFilter && $buscador) $buscador.value = '';
  SafeStore.save(state);
  renderList($buscador ? $buscador.value : '');
}

function addItem(data) {
  // Guardamos con las nuevas claves
  const item = {
    id: nextId(),
    nombre: data.nombre,
    categoria: data.categoria,
    cantidad: Number(data.cantidad || 0),
    precio: Number(data.precio || 0),
    observaciones: data.observaciones || ''
  };
  state.items = [...state.items, item];
  // Limpiamos filtro para que se vea al instante
  persistAndRender({ clearFilter: true });
}

function updateItem(id, patch) {
  state.items = state.items.map((it) => {
    if (it.id !== id) return it;
    // Sobrescribimos usando las nuevas claves
    return {
      ...it,
      nombre: patch.nombre,
      categoria: patch.categoria,
      cantidad: Number(patch.cantidad || 0),
      precio: Number(patch.precio || 0),
      observaciones: patch.observaciones || ''
    };
  });
  persistAndRender();
}

function deleteItem(id) {
  const before = state.items.length;
  state.items = state.items.filter((it) => it.id !== id);
  const removed = before !== state.items.length;
  clearForm(); // 🔑 limpia selección y modo
  persistAndRender();
  if (!removed) console.warn('No se encontró el ítem para borrar:', id);
}

////////////////////////////// Render //////////////////////////////
function renderList(filter = '') {
  const term = (filter || '').trim().toLowerCase();

  const items = state.items.map(normalize).filter((it) => {
    return (
      !term ||
      String(it.nombre).toLowerCase().includes(term) ||
      String(it.categoria || '').toLowerCase().includes(term) ||
      String(it.observaciones || '').toLowerCase().includes(term)
    );
  });

  if (!$tbody) return;
  $tbody.innerHTML = '';

  for (const it of items) {
    const tr = cel('tr');
    tr.dataset.id = String(it.id);

    const tdNombre = cel('td', { textContent: it.nombre });
    const tdCategoria = cel('td', { textContent: it.categoria || '-' });
    const tdCantidad = cel('td', { textContent: String(it.cantidad) });
    const tdPrecio = cel('td', { textContent: Number(it.precio || 0).toFixed(2) });
    const tdObs = cel('td', { textContent: it.observaciones || '' });

    const tdAcciones = cel('td');
    tdAcciones.className = 'col-actions';
    const btnEdit = cel('button', { className: 'btn tiny', textContent: 'Editar' });
    btnEdit.dataset.action = 'edit';
    const btnDelete = cel('button', { className: 'btn tiny danger', textContent: 'Borrar' });
    btnDelete.dataset.action = 'delete';
    tdAcciones.append(btnEdit, btnDelete);

    tr.append(tdNombre, tdCategoria, tdCantidad, tdPrecio, tdObs, tdAcciones);
    $tbody.append(tr);
  }
}

////////////////////////////// Modal confirmación //////////////////////////////
function openModalConfirm(id) {
  pendingDeleteId = id;
  if ($overlay) $overlay.style.display = 'block';
  if ($modal) $modal.style.display = 'block';
}

function closeModalConfirm() {
  pendingDeleteId = null;
  if ($overlay) $overlay.style.display = 'none';
  if ($modal) $modal.style.display = 'none';
}

$modalAceptar?.addEventListener('click', () => {
  if (pendingDeleteId != null) deleteItem(pendingDeleteId);
  closeModalConfirm();
});
$modalCancelar?.addEventListener('click', () => closeModalConfirm());
$overlay?.addEventListener('click', () => closeModalConfirm());

////////////////////////////// Eventos //////////////////////////////
$form?.addEventListener('submit', (e) => {
  e.preventDefault();
  showError('');

  const data = {
    nombre: ($nombre?.value || '').trim(),
    categoria: ($categoria?.value || '').trim(),
    cantidad: Number($cantidad?.value || 0),
    precio: Number($precio?.value || 0),
    observaciones: ($observaciones?.value || '').trim()
  };

  if (!data.nombre) {
    showError('El nombre es obligatorio');
    $nombre?.focus();
    return;
  }

  if (selectedId == null) {
    addItem(data);
    $form.reset();
    $nombre?.focus();
  } else {
    updateItem(selectedId, data);
    clearForm();
  }
});

$btnCancelarEdicion?.addEventListener('click', (e) => {
  e.preventDefault();
  clearForm();
});

// Delegación en tabla (para soportar re-render)
$tbody?.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const row = btn.closest('tr');
  const id = Number(row?.dataset.id);
  const action = btn.dataset.action;
  if (!id || !action) return;

  if (action === 'edit') {
    const itemRaw = state.items.find((it) => it.id === id);
    if (!itemRaw) return;
    const item = normalize(itemRaw);
    selectedId = id;
    if ($nombre) $nombre.value = item.nombre;
    if ($categoria) $categoria.value = item.categoria || '';
    if ($cantidad) $cantidad.value = String(item.cantidad || 0);
    if ($precio) $precio.value = String(item.precio || 0);
    if ($observaciones) $observaciones.value = item.observaciones || '';
    setFormMode('edit');
    $nombre?.focus();
  }

  if (action === 'delete') {
    openModalConfirm(id);
  }
});

// Buscador en vivo
$buscador?.addEventListener('input', () => {
  renderList($buscador.value);
});

// Persistir al cerrar
window.addEventListener('beforeunload', () => {
  SafeStore.save(state);
});

////////////////////////////// Inicio //////////////////////////////
(function init() {
  setFormMode('create');
  renderList('');
})();
// Fin de renderer.js