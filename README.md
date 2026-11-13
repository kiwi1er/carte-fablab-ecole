# Carte Fablab à l’école

Widget Grist et carte de présentation adaptés du widget Map de Grist (Leaflet et MarkerCluster). Licence Apache-2.0 ; origine dans NOTICE, code initial dans upstream/.

## Données privées

**Ce dépôt publie uniquement le code.** Les JSON, CSV et Excel de recensement restent sur l’ordinateur ou dans Grist. Les fichiers de données précédemment publiés sont retirés de la branche courante ; ils peuvent subsister dans l’historique Git et ses copies. Ce changement ne réécrit pas l’historique.

La page de présentation permet de sélectionner un JSON local via File.text(). Son contenu n’est envoyé à aucun serveur et n’est pas conservé entre deux ouvertures. Les bibliothèques jsDelivr et le fond OpenStreetMap nécessitent Internet ; les requêtes de tuiles reflètent la zone affichée. Le partage de l’URL seule ne partage pas les données. Une carte publique préchargée nécessitera une décision explicite sur les données à publier.

## Tester et utiliser

Activer **Settings → Pages → Deploy from a branch → main → /(root) → Save**.

- Présentation avec chargement local : https://kiwi1er.github.io/carte-fablab-ecole/
- Widget connecté à Grist : https://kiwi1er.github.io/carte-fablab-ecole/?mode=grist

La présentation propose recherche, filtres région/département/année/dispositif, couleurs par première année connue, regroupement des points, fiches et mode présentation avec compteurs. Les établissements sans coordonnées restent dans la liste et les compteurs. La couleur utilise la première acquisition ou participation connue, jamais l’année d’ajout à l’ancienne carte.

## Calculs

Minimum : **2 classes et 2 enseignants/personnes de l’équipe pédagogique**, si la déclaration est absente, 0 ou 1. Les valeurs à partir de 2 sont conservées. Élèves estimés = classes × **22** ; formation prévue = personnes × **6 h** ; accompagnement prévu = personnes × **9 h**. Les heures sont des heures-participants prévues et ne prouvent pas une réalisation.

**Une fois par établissement** utilise la dernière année renseignée, ou le minimum historique. **Cumul par année documentée** compte une observation par établissement et année, plus une observation historique pour ceux sans questionnaire ; il ne reconstitue pas les années manquantes et peut compter plusieurs fois les mêmes bénéficiaires. Plusieurs dispositifs la même année ne sont pas additionnés ; le filtre dispositif utilise ses propres effectifs.

Les réponses répétées sont départagées par la dernière valeur numérique du fichier, sans addition, et les divergences sont signalées. Les valeurs 999 et les colonnes statistiques ambiguës du général restent à valider et sont remplacées provisoirement par le minimum. Les réponses communes école/collège portent une réserve d’attribution. Les déclarations d’origine sont conservées et le nombre de minima appliqués est affiché. L’équipe pédagogique n’est pas nécessairement constituée uniquement d’enseignants.

## Préparer les fichiers sur l’ordinateur

```sh
python3 scripts/export_public.py /chemin/base_consolidee.xlsx
node --test tests/*.test.mjs
python3 -m unittest discover -s tests -p test_indicators.py
python3 -m http.server 8765 --bind 127.0.0.1
```

Le script génère localement `data/public.json` à sélectionner dans la carte et `data/carte-grist.csv` pour l’import dans Grist. Malgré son nom historique, public.json **n’est pas publié**. Les JSON et CSV de data/ sont exclus de Git. Le script utilise une liste explicite des champs nécessaires, sans courriels, contacts ni commentaires internes. Les régions sont harmonisées par département et code postal français disponible ; le classeur original reste intact.

Les tests du corpus privé s’exécutent uniquement en présence du JSON local. Les tests des règles et des filtres fonctionnent sans données privées.

## Intégrer ensuite dans Grist

Importer le CSV dans le document privé. Ajouter une vue Personnalisée connectée à la table, URL du widget avec `?mode=grist`, accès **Lire la table sélectionnée**.

| Champ du widget | Colonne CSV |
|---|---|
| Nom | Nom |
| Latitude / Longitude | Latitude / Longitude |
| Identifiant établissement | Etablissement_ID |
| Commune | Commune |
| Département / Région | Departement / Region |
| Pays | Pays |
| Adresse cartographie | Adresse_cartographie |
| Première année connue | Premiere_annee_connue |
| Années scolaires | Annees_scolaires |
| Dispositifs | Dispositifs |
| Précision localisation | Precision |
| Participations JSON | Participations_JSON |
| Indicateurs JSON | Indicateurs_JSON |

Latitude, Longitude et Premiere_annee_connue : nombres. Les colonnes JSON : texte. Sans Indicateurs_JSON, les compteurs utilisent les minima. Sans Participations_JSON, le compteur annuel et l’intersection année/dispositif n’ont pas l’historique détaillé. Le widget ne réalise pas encore le géocodage et ne publie aucune modification de Grist.
