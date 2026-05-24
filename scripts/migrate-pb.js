/**
 * migrate-pb.js — Ajoute le champ `script` à la collection structures
 *                 et crée la collection `config` pour le template de base.
 *
 * Usage :
 *   node scripts/migrate-pb.js <email_admin> <mot_de_passe>
 *
 * Exemple :
 *   node scripts/migrate-pb.js admin@example.com motdepasse
 */

const PB_URL = process.env.NEXT_PUBLIC_PB_URL || 'https://apicomtap-pb.fly.dev'

async function req(method, path, body, token) {
  const res = await fetch(`${PB_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  const json = text ? JSON.parse(text) : {}
  if (!res.ok) throw new Error(`HTTP ${res.status} ${method} ${path} — ${JSON.stringify(json).slice(0, 300)}`)
  return json
}

async function migrate() {
  const [, , email, password] = process.argv
  if (!email || !password) {
    console.error('Usage : node scripts/migrate-pb.js <email> <mot_de_passe>')
    process.exit(1)
  }

  console.log(`\nConnexion à ${PB_URL}…`)
  const auth = await req('POST', '/api/admins/auth-with-password', { identity: email, password })
  const token = auth.token
  console.log('✓ Authentifié\n')

  // ── 1. Ajout du champ script à structures ─────────────────────────────────

  const col = await req('GET', '/api/collections/structures', null, token)
  const hasScript = col.schema.some(f => f.name === 'script')

  if (hasScript) {
    console.log('✓ Champ `script` déjà présent dans structures')
  } else {
    col.schema.push({
      name: 'script',
      type: 'text',
      required: false,
      presentable: false,
      options: { min: null, max: null, pattern: '' },
    })
    await req('PATCH', `/api/collections/${col.id}`, { schema: col.schema }, token)
    console.log('✓ Champ `script` ajouté à la collection structures')
  }

  // ── 2. Création de la collection config ───────────────────────────────────

  let configExists = false
  try {
    await req('GET', '/api/collections/config', null, token)
    configExists = true
  } catch {
    configExists = false
  }

  if (configExists) {
    console.log('✓ Collection `config` déjà présente')
  } else {
    await req('POST', '/api/collections', {
      name: 'config',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      schema: [
        { name: 'key',   type: 'text', required: true,  options: {} },
        { name: 'value', type: 'text', required: false, options: {} },
      ],
    }, token)
    console.log('✓ Collection `config` créée')
  }

  console.log('\n✓ Migration terminée — redéployez votre app Next.js si besoin.\n')
}

migrate().catch(err => {
  console.error('\n✗ Erreur :', err.message)
  process.exit(1)
})
