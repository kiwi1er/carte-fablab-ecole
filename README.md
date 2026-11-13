# Carte Fablab à l’école

## Hypothèses d'effectifs validées

Le calcul retient au minimum **2 classes** et **2 enseignants/personnes de l'équipe pédagogique** par observation : une valeur absente, nulle ou égale à 1 est remplacée par 2 dans l'indicateur, sans modifier la déclaration. Les valeurs entières renseignées à partir de 2 sont conservées. La règle constitue une hypothèse de calcul fondée sur les critères de prêt indiqués par le porteur du projet, pas une vérification des effectifs réels.

Hypothèses communes : **22 élèves par classe**, **6 heures-participants de formation prévues** et **9 heures-participants d'accompagnement prévues** par enseignant/personne retenue. Le champ équipe pédagogique reste identifié lorsqu'il sert de substitut au nombre d'enseignants.

`python3 scripts/prepare_indicators.py /chemin/base.xlsx` prépare `data/indicateurs-sources.csv` avec déclaration, valeur retenue et origine de l'estimation pour chaque observation. **Ce fichier n'est pas additionnable directement** : il contient des réponses répétées et des années différentes. Les indicateurs ne sont pas encore raccordés aux compteurs de la carte ; l'agrégation par établissement/année et les questionnaires communs école/collège doivent être traités avant un bilan national. Les données sources, y compris leurs anomalies signalées dans le classeur, sont conservées.

Widget Grist et carte publique adaptée du widget Map de Grist (Leaflet et MarkerCluster), sous licence Apache-2.0. Origine et version dans [NOTICE](NOTICE), code initial dans `upstream/`.

## Première version

- 577 établissements recensés, 438 participations annuelles documentées.
- 43 établissements avec coordonnées ; les 534 autres restent dans la liste avec la mention « Coordonnées à compléter ».
- Filtres région, département, année scolaire, dispositif ; recherche sans accents.
- Couleurs par première année connue, modifiables dans la légende et conservées dans ce navigateur.
- Carte regroupée, fiches au clic et mode présentation.
- Vue publique sans compte et mode widget Grist en lecture seule.

La première année connue est le minimum des années d’acquisition et des années scolaires documentées. L’année d’ajout à l’ancienne carte n’est pas utilisée comme année d’entrée. Les périodes de prêt non renseignées ne sont pas inventées. Les compteurs distinguent établissements et participations. Une même année pour deux dispositifs peut donner deux participations.

## Activer GitHub Pages

Dans le dépôt : **Settings → Pages → Build and deployment → Source: Deploy from a branch → main → /(root) → Save**.

Après déploiement :

- Carte publique : `https://kiwi1er.github.io/carte-fablab-ecole/`
- Widget Grist : `https://kiwi1er.github.io/carte-fablab-ecole/?mode=grist`

```html
<iframe src="https://kiwi1er.github.io/carte-fablab-ecole/"
        title="Carte Fablab à l’école" width="100%" height="850"
        style="border:0" allow="fullscreen" loading="lazy"></iframe>
```

## Installer dans Grist

La table du document cible était vide lors de la préparation. Deux possibilités :

1. Importer la base Excel complète pour le suivi détaillé, ou importer `data/carte-grist.csv` comme table de présentation autonome (577 lignes, coordonnées et historique JSON inclus).
2. Ajouter une vue **Personnalisée**, choisir cette table et l’URL du widget ci-dessus.
3. Donner l’accès **Lire la table sélectionnée**, puis associer les colonnes.

| Champ du widget | CSV de présentation | Excel complet |
|---|---|---|
| Nom | Nom | Nom |
| Latitude / Longitude | Latitude / Longitude | Latitude / Longitude |
| Identifiant établissement | Etablissement_ID | Etablissement_ID |
| Commune | Commune | Commune |
| Département | Departement | Département |
| Région | Region | Région |
| Pays | Pays | Pays |
| Adresse cartographie | Adresse_cartographie | Adresse_cartographie |
| Première année connue | Premiere_annee_connue | à calculer / facultatif |
| Année acquisition | facultatif | Année_acquisition |
| Années scolaires | Annees_scolaires | Années_scolaires |
| Dispositifs | Dispositifs | Dispositifs |
| Précision localisation | Precision | Localisation |
| Participations JSON | Participations_JSON | à préparer depuis Participations |

`Latitude`, `Longitude` et `Premiere_annee_connue` : nombres. `Participations_JSON` : texte, sans conversion en liste de choix. Les années et dispositifs acceptent du texte séparé par ` ; ` ou une liste de choix Grist.

Le compteur des participations et le croisement année/dispositif nécessitent **Participations_JSON**. Le CSV de présentation est donc le chemin le plus simple pour une installation complète de cette première version. Dans la base Excel complète, les données restent dans deux tables ; un champ de présentation doit les agréger avant l’association au widget.

Le widget ne réalise pas encore de géocodage. Compléter les coordonnées dans Grist ou dans la base, puis actualiser l’export public.

## Publication et mises à jour

Le mode public charge uniquement `data/public.json`. Il ne se connecte pas à Grist et ne contient aucune clé API, adresse courriel, contact ou commentaire interne. Le mode Grist lit la table sélectionnée via l’API des widgets et suit ses modifications. Modifier Grist ne met **pas** à jour automatiquement la carte publique.

Pour publier une nouvelle base consolidée, exécuter :

```sh
python3 scripts/export_public.py /chemin/Fablab_base_consolidee_2026_2027.xlsx
node --test tests/model.test.mjs
```

Vérifier et enregistrer les fichiers `data/` dans GitHub. Le script utilise une liste explicite des seuls champs publics. Les noms de régions sont harmonisés à partir du département, confronté au code postal français lorsqu’il est disponible ; le classeur source n’est pas modifié. La synchronisation depuis Grist sera une prochaine étape.

Pour vérifier localement : `python3 -m http.server 8765 --bind 127.0.0.1`, puis ouvrir `http://127.0.0.1:8765/`.

Le fond de carte nécessite une connexion Internet (tuiles OpenStreetMap). Les bibliothèques sont chargées depuis jsDelivr, avec leurs versions fixées. Les établissements sans coordonnées restent recensés, mais ne sont pas représentés par un faux point à 0,0.
