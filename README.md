# Pages festivals Tempo Jobs

Ce dossier contient une intégration statique prête à déposer sur `tempo-jobs.fr`.

## Routes proposées

- `/festivals/` : hub des festivals
- `/festivals/baie-sonore/` : page de candidature Baie Sonore
- `/festivals/do-you-remember/` : page de candidature DO YOU REMEMBER Festival

## GitHub Pages

Pour GitHub Pages, uploader les fichiers et dossiers à la racine du repository :

- `.nojekyll`
- `index.html`
- `404.html`
- `assets/`
- `festivals/`

Ne pas uploader le zip tel quel dans le repo : il faut uploader son contenu décompressé.

## Fichiers

- `festivals/index.html`
- `festivals/baie-sonore/index.html`
- `festivals/do-you-remember/index.html`
- `assets/festivals.css`
- `assets/festivals.js`
- `netlify/functions/festival-applications.mjs`
- `netlify/functions/festival-application-counts.mjs`
- `netlify.toml`
- `package.json`

## Formulaire

Le formulaire est prêt côté front, avec validation HTML, sélection de mission et upload de fichiers.
Sur Netlify, l'envoi utilise automatiquement :

```txt
/.netlify/functions/festival-applications
```

À chaque candidature valide, la fonction :

- stocke la candidature côté Netlify
- incrémente le compteur du festival
- renvoie le nouveau total à la page

Pour remplacer cet endpoint par un endpoint propriétaire :

```html
<script>
  window.TEMPO_FESTIVAL_APPLICATION_ENDPOINT = "https://tempo-jobs.fr/api/festival-applications";
</script>
```

L'endpoint recevra un `FormData` avec :

- `first_name`
- `last_name`
- `email`
- `phone`
- `availability`
- `preferred_mission`
- `message`
- `attachments`
- `consent`
- `festival_slug`
- `festival`
- `recipient_email`

Pour relayer les candidatures vers un outil email/CRM, ajouter une variable d'environnement Netlify :

```txt
TEMPO_APPLICATION_WEBHOOK_URL=https://...
```

La fonction POSTera alors les données de candidature en JSON vers ce webhook.

## Compteurs de candidatures

Les pages affichent un compteur visible par festival.

Sur Netlify, les compteurs lisent automatiquement :

```txt
/.netlify/functions/festival-application-counts
```

Pour remplacer cet endpoint par un endpoint propriétaire :

```html
<script>
  window.TEMPO_FESTIVAL_STATS_ENDPOINT = "https://tempo-jobs.fr/api/festival-application-counts";
</script>
```

Formats acceptés :

```json
{
  "baie-sonore": 12,
  "do-you-remember": 8
}
```

ou :

```json
{
  "counts": {
    "baie-sonore": 12,
    "do-you-remember": 8
  }
}
```

Après un envoi réussi, si l'endpoint de candidature renvoie `{ "count": 9 }`, la page utilise cette valeur.
Sinon, elle incrémente le compteur affiché côté interface.
