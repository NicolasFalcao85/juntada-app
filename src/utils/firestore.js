import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs,
  query, where, orderBy, arrayUnion,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase'
import { nanoid } from '../utils/nanoid'

// ── Juntadas ──────────────────────────────────────────────

export async function createJuntada({ nombre, descripcion, lugar, organizadorId, organizadorName }) {
  const shareCode = nanoid(8)
  const ref = await addDoc(collection(db, 'juntadas'), {
    nombre,
    descripcion,
    lugar,
    organizadorId,
    organizadorName,
    shareCode,
    estado: 'planificando',
    fechaConfirmada: null,
    fechasPropuestas: [],
    invitadosUids: [organizadorId],
    invitados: [{ uid: organizadorId, nombre: organizadorName, estado: 'va', esOrganizador: true, adultos: 1, menores: 0 }],
    items: [],
    gastos: [],
    autos: [],
    menu: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return { id: ref.id, shareCode }
}

export async function getJuntada(id) {
  const snap = await getDoc(doc(db, 'juntadas', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getJuntadasByUser(uid) {
  const q = query(
    collection(db, 'juntadas'),
    where('invitadosUids', 'array-contains', uid),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function updateJuntada(id, data) {
  await updateDoc(doc(db, 'juntadas', id), { ...data, updatedAt: serverTimestamp() })
}

export async function getJuntadaByShareCode(code) {
  const q = query(collection(db, 'juntadas'), where('shareCode', '==', code))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

// ── Invitados ──────────────────────────────────────────────

export async function unirseAJuntada(juntadaId, user) {
  const ref = doc(db, 'juntadas', juntadaId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Juntada no encontrada')
  const data = snap.data()
  const yaEsta = (data.invitadosUids || []).includes(user.uid)
  if (yaEsta) return
  await updateDoc(ref, {
    invitadosUids: arrayUnion(user.uid),
    invitados: arrayUnion({
      uid: user.uid,
      nombre: user.displayName,
      estado: 'pendiente',
      esOrganizador: false,
      adultos: 1,
      menores: 0
    }),
    updatedAt: serverTimestamp()
  })
}

export async function actualizarEstadoInvitado(juntadaId, uid, nuevoEstado, cantidades = null) {
  const ref = doc(db, 'juntadas', juntadaId)
  const snap = await getDoc(ref)
  const data = snap.data()
  const invitados = data.invitados.map(i => {
    if (i.uid !== uid) return i
    const upd = { ...i, estado: nuevoEstado }
    if (cantidades) {
      upd.adultos = cantidades.adultos ?? 1
      upd.menores = cantidades.menores ?? 0
    }
    return upd
  })
  await updateDoc(ref, { invitados, updatedAt: serverTimestamp() })
}

// ── Menú ───────────────────────────────────────────────────

export async function agregarOpcionMenu(juntadaId, { nombre, descripcion, proponenteUid }) {
  const ref = doc(db, 'juntadas', juntadaId)
  const opcion = { id: nanoid(6), nombre, descripcion: descripcion || '', votos: [proponenteUid] }
  await updateDoc(ref, { menu: arrayUnion(opcion), updatedAt: serverTimestamp() })
  return opcion
}

export async function votarMenu(juntadaId, opcionId, uid, agregar) {
  const ref = doc(db, 'juntadas', juntadaId)
  const snap = await getDoc(ref)
  const menu = (snap.data().menu || []).map(o =>
    o.id === opcionId
      ? { ...o, votos: agregar ? [...new Set([...o.votos, uid])] : o.votos.filter(v => v !== uid) }
      : o
  )
  await updateDoc(ref, { menu, updatedAt: serverTimestamp() })
}

export async function confirmarMenu(juntadaId, opcionId) {
  const ref = doc(db, 'juntadas', juntadaId)
  await updateDoc(ref, { menuConfirmadoId: opcionId, updatedAt: serverTimestamp() })
}

export async function eliminarOpcionMenu(juntadaId, opcionId) {
  const ref = doc(db, 'juntadas', juntadaId)
  const snap = await getDoc(ref)
  const menu = (snap.data().menu || []).filter(o => o.id !== opcionId)
  await updateDoc(ref, { menu, updatedAt: serverTimestamp() })
}

// ── Fechas / Votación ──────────────────────────────────────

export async function proponerFecha(juntadaId, fecha, proponenteUid) {
  const ref = doc(db, 'juntadas', juntadaId)
  const nuevaFecha = { id: nanoid(6), fecha, votos: [proponenteUid] }
  await updateDoc(ref, {
    fechasPropuestas: arrayUnion(nuevaFecha),
    updatedAt: serverTimestamp()
  })
}

export async function votarFecha(juntadaId, fechaId, uid, agregar) {
  const ref = doc(db, 'juntadas', juntadaId)
  const snap = await getDoc(ref)
  const fechas = (snap.data().fechasPropuestas || []).map(f =>
    f.id === fechaId
      ? { ...f, votos: agregar ? [...new Set([...f.votos, uid])] : f.votos.filter(v => v !== uid) }
      : f
  )
  await updateDoc(ref, { fechasPropuestas: fechas, updatedAt: serverTimestamp() })
}

export async function confirmarFecha(juntadaId, fecha) {
  await updateDoc(doc(db, 'juntadas', juntadaId), {
    fechaConfirmada: fecha,
    estado: 'confirmada',
    updatedAt: serverTimestamp()
  })
}

// ── Items (qué lleva cada uno) ─────────────────────────────

export async function agregarItem(juntadaId, { nombre, categoria, asignadoA, asignadoNombre }) {
  const ref = doc(db, 'juntadas', juntadaId)
  const item = { id: nanoid(6), nombre, categoria, asignadoA: asignadoA || null, asignadoNombre: asignadoNombre || null, listo: false }
  await updateDoc(ref, { items: arrayUnion(item), updatedAt: serverTimestamp() })
  return item
}

export async function actualizarItem(juntadaId, itemId, cambios) {
  const ref = doc(db, 'juntadas', juntadaId)
  const snap = await getDoc(ref)
  const items = snap.data().items.map(i => i.id === itemId ? { ...i, ...cambios } : i)
  await updateDoc(ref, { items, updatedAt: serverTimestamp() })
}

export async function eliminarItem(juntadaId, itemId) {
  const ref = doc(db, 'juntadas', juntadaId)
  const snap = await getDoc(ref)
  const items = snap.data().items.filter(i => i.id !== itemId)
  await updateDoc(ref, { items, updatedAt: serverTimestamp() })
}

// ── Gastos ─────────────────────────────────────────────────

export async function agregarGasto(juntadaId, { descripcion, monto, pagadoPorUid, pagadoPorNombre, divididoEntre }) {
  const ref = doc(db, 'juntadas', juntadaId)
  const gasto = {
    id: nanoid(6),
    descripcion,
    monto: Number(monto),
    pagadoPorUid,
    pagadoPorNombre,
    divididoEntre,
    fecha: new Date().toISOString()
  }
  await updateDoc(ref, { gastos: arrayUnion(gasto), updatedAt: serverTimestamp() })
  return gasto
}

export async function eliminarGasto(juntadaId, gastoId) {
  const ref = doc(db, 'juntadas', juntadaId)
  const snap = await getDoc(ref)
  const gastos = snap.data().gastos.filter(g => g.id !== gastoId)
  await updateDoc(ref, { gastos, updatedAt: serverTimestamp() })
}

export function calcularDeudas(gastos, invitados) {
  const balances = {}
  invitados.forEach(i => { balances[i.uid] = { uid: i.uid, nombre: i.nombre, balance: 0 } })

  gastos.forEach(g => {
    const porPersona = g.monto / g.divididoEntre.length
    if (balances[g.pagadoPorUid]) balances[g.pagadoPorUid].balance += g.monto
    g.divididoEntre.forEach(uid => {
      if (balances[uid]) balances[uid].balance -= porPersona
    })
  })

  const deudas = []
  const positivos = Object.values(balances).filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance)
  const negativos = Object.values(balances).filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance)

  let i = 0, j = 0
  while (i < positivos.length && j < negativos.length) {
    const acreedor = positivos[i]
    const deudor = negativos[j]
    const monto = Math.min(acreedor.balance, -deudor.balance)
    deudas.push({ deudorUid: deudor.uid, deudorNombre: deudor.nombre, acreedorUid: acreedor.uid, acreedorNombre: acreedor.nombre, monto: Math.round(monto * 100) / 100 })
    acreedor.balance -= monto
    deudor.balance += monto
    if (acreedor.balance < 0.01) i++
    if (deudor.balance > -0.01) j++
  }

  return deudas
}

// ── Autos ──────────────────────────────────────────────────

export async function agregarAuto(juntadaId, { conductorUid, conductorNombre, capacidad, desde, pasajeros }) {
  const ref = doc(db, 'juntadas', juntadaId)
  const auto = { id: nanoid(6), conductorUid, conductorNombre, capacidad: Number(capacidad), desde, pasajeros: pasajeros || [] }
  await updateDoc(ref, { autos: arrayUnion(auto), updatedAt: serverTimestamp() })
  return auto
}

export async function sumarseAuto(juntadaId, autoId, uid, nombre) {
  const ref = doc(db, 'juntadas', juntadaId)
  const snap = await getDoc(ref)
  const autos = snap.data().autos.map(a => {
    if (a.id !== autoId) return a
    if (a.pasajeros.find(p => p.uid === uid)) return a
    if (a.pasajeros.length >= a.capacidad - 1) throw new Error('Auto lleno')
    return { ...a, pasajeros: [...a.pasajeros, { uid, nombre }] }
  })
  await updateDoc(ref, { autos, updatedAt: serverTimestamp() })
}

export async function bajarsDeAuto(juntadaId, autoId, uid) {
  const ref = doc(db, 'juntadas', juntadaId)
  const snap = await getDoc(ref)
  const autos = snap.data().autos.map(a =>
    a.id === autoId ? { ...a, pasajeros: a.pasajeros.filter(p => p.uid !== uid) } : a
  )
  await updateDoc(ref, { autos, updatedAt: serverTimestamp() })
}
