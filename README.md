# Grand Poitiers — Cartographie Partenaires

Outil de suivi des partenaires Grand Poitiers pour l'Atelier Stéphan Hamache.  
Carte interactive OpenStreetMap · Fiches éditables · Import CSV avec géocodage automatique BANO.

---

## Stack

| Couche | Technologie |
|---|---|
| Frontend | Next.js 14 + Tailwind CSS |
| Carte | Leaflet + tiles CartoDB Dark |
| Base de données | PocketBase |
| Géocodage | api-adresse.data.gouv.fr (BANO/BAN) |
| Hébergement BDD | Fly.io (free tier) |
| Hébergement Frontend | Vercel |

---

## 1. Déploiement PocketBase sur Fly.io

### Installation flyctl
```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex
```

### Connexion & création de l'app
```bash
fly auth login
fly apps create apicomtap-pb --machines
```

### Créer le volume persistant (données ne seront pas perdues)
```bash
fly volumes create pb_data --region cdg --size 1 --app apicomtap-pb
```

### Déployer PocketBase
```bash
fly deploy --config fly.toml --dockerfile Dockerfile.pocketbase
```

### Premier lancement — créer l'admin
Ouvrir : `https://apicomtap-pb.fly.dev/_/`  
→ Créer un compte admin  
→ Aller dans **Settings > Import collections**  
→ Coller le contenu de `pb_schema.json`  
→ Importer ✓

**Note CORS** : Dans PocketBase Admin → Settings → Application  
Ajouter dans "Allowed origins" : `https://VOTRE_APP.vercel.app`

---

## 2. Déploiement Next.js sur Vercel

```bash
# Cloner et pousser sur GitHub
git clone https://github.com/boutique-oss/APIcomtappoitiers.git
cd APIcomtappoitiers
git add .
git commit -m "init"
git push
```

Sur **vercel.com** :
1. Importer le repo GitHub
2. Ajouter la variable d'environnement :
   - `NEXT_PUBLIC_PB_URL` = `https://apicomtap-pb.fly.dev`
3. Deploy ✓

---

## 3. Import des données initiales

1. Télécharger `public/template.csv`
2. Compléter les colonnes manquantes (contacts, adresses précises)
3. Sur l'app déployée → bouton **↑ Importer CSV**
4. Les adresses sont géocodées automatiquement via BAN

### Format CSV attendu
```
nom,categorie,adresse,ville,code_postal,contact_nom,contact_tel,contact_email,statut,notes
Grand Poitiers CU,Collectivité,1 place du Maréchal Leclerc,Poitiers,86000,...
```

### Valeurs statut acceptées
`À contacter` · `En cours` · `RDV planifié` · `Signé` · `Sans suite`

---

## 4. Développement local

```bash
# Cloner
npm install

# PocketBase en local (télécharger le binaire sur pocketbase.io)
./pocketbase serve

# Next.js
cp .env.local.example .env.local
# Éditer .env.local → NEXT_PUBLIC_PB_URL=http://127.0.0.1:8090
npm run dev
```

---

## Fonctionnalités

- 🗺️ **Carte dark** OpenStreetMap (tiles CartoDB)
- 📍 **Marqueurs colorés** par statut (gris / ambre / bleu / vert / rouge)
- 🔍 **Sidebar** avec recherche et filtres par statut
- 📋 **Fiche modale** : consultation + édition en 1 clic
- 📥 **Import CSV** avec géocodage automatique (BAN/BANO)
- 📊 **Compteurs** total / signés en temps réel
