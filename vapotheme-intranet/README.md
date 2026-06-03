# Vapotheme Intranet

## 🚀 Installation en 5 étapes

### 1. Créer le projet Supabase
- Va sur https://supabase.com → New project
- Note ton **Project URL** et tes **API Keys** (Settings > API)

### 2. Créer la base de données
- Dans Supabase : SQL Editor > New query
- Colle le contenu de `supabase-schema.sql` et clique Run

### 3. Configurer les variables d'environnement
- Ouvre `.env.local`
- Remplace les 3 valeurs  par tes vraies clés Supabase

### 4. Lancer le projet
```bash
npm install
npm run dev
```
Ouvre http://localhost:3000

### 5. Créer ton premier compte admin
- Dans Supabase > Authentication > Users > Add user
- Email + mot de passe
- Dans SQL Editor, colle :
```sql
insert into profiles (auth_user_id, full_name, role, color)
values ('COLLE_ICI_LUID_DU_USER', 'Ton Nom', 'admin', '#6964FC');
```

## 🌐 Mise en ligne sur Vercel

1. Pousse le code sur GitHub
2. Va sur https://vercel.com > Import project
3. Ajoute les 3 variables d'env dans Vercel (Settings > Environment Variables)
4. Déploie !

### Connecter ton domaine
- Dans Vercel > Settings > Domains > Add domain
- Chez ton registrar (OVH etc), ajoute un enregistrement CNAME :
  - `@` ou `www` → `cns1.vercel-dns.com`

## 📁 Structure
```
app/
  login/          → Page de connexion
  set-password/   → Première connexion salarié
  dashboard/
    accueil/      → Vue d'ensemble
    planning/     → Planning de référence + renforts
    conges/       → Demandes de congés
    notes/        → Notes de la direction
    vacances/     → Planning annuel vacances
    equipe/       → Gestion des comptes (admin)
```
