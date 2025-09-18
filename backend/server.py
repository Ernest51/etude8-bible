from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from typing import List, Optional
import json

app = FastAPI()

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration API Bible Derby
BIBLE_API_KEY = "0cff5d83f6852c3044a180cc4cdeb0fe"
BIBLE_API_BASE = "https://api.scripture.api.bible/v1"
BIBLE_ID = "de4e12af7f28f599-02"  # Bible Derby en français

class StudyRequest(BaseModel):
    passage: str
    version: str
    tokens: int
    model: str
    requestedRubriques: List[int]

@app.get("/api/")
async def root():
    return {"message": "Bible Study API - Bible Derby"}

# Contenu théologique unique par livre et chapitre
THEOLOGICAL_CONTENT = {
    "Genèse": {
        1: {
            "title": "La **Création Divine** : Fondement de Toute Vérité",
            "narrative": """Au commencement, **Elohim** (אלהים) révèle Sa nature créatrice dans un acte souverain d'amour. Le terme hébraïque **"bara"** (ברא) indique une création ex nihilo, du néant absolu vers l'existence parfaite.

**Jour 1** : La **lumière** (אור - *or*) n'est pas seulement physique mais spirituelle, préfigurant Christ comme "Lumière du monde". Les **ténèbres** (*choshek*) représentent l'état spirituel séparé de Dieu.

**Jour 2** : L'**étendue** (*rakia*) établit l'ordre divin, séparant les eaux d'en haut et d'en bas, symbolisant la séparation entre le céleste et le terrestre.

**Jour 3** : La **terre sèche** et la **végétation** montrent Dieu pourvoyant avant même la création de l'homme, démontrant Sa providence anticipée.

**Jour 4** : Les **luminaires** (*me'orot*) règlent les temps et les saisons, établissant l'ordre temporel sous la souveraineté divine.

**Jour 5** : Les **créatures marines** et les **oiseaux** révèlent la diversité créatrice de Dieu, chaque espèce portant Sa signature divine.

**Jour 6** : L'**homme** (*adam*) créé à l'**image de Dieu** (*tselem Elohim*) reçoit la domination responsable sur la création.

**Jour 7** : Le **Sabbat** (*shabbat*) établit le rythme divin de repos, non par fatigue mais par accomplissement parfait.""",
            "theological_points": [
                "**Révélation progressive** : Dieu se révèle graduellement à travers Son œuvre créatrice",
                "**Trinité implicite** : *Elohim* (pluriel) avec *Ruach Elohim* (Esprit de Dieu) planant sur les eaux",
                "**Ordre et beauté** : La création reflète la nature ordonnée et esthétique de Dieu",
                "**Anticipation christologique** : La lumière du jour 1 préfigure le Christ à venir"
            ]
        },
        2: {
            "title": "L'**Eden** : Prototype du Royaume Divin",
            "narrative": """Le récit de la **formation de l'homme** (*yatsar* - יצר) révèle l'intimité divine dans l'acte créateur. Dieu façonne Adam de la **poussière** (*afar*) de la terre, soulignant notre origine humble et notre dépendance divine.

Le **souffle de vie** (*nishmat chayyim*) distingue l'homme de toute autre créature. Cette **néphesh** (âme vivante) fait de l'homme un être spirituel capable de communion avec Dieu.

L'**Eden** (*'eden* - délice, plaisir) représente l'état originel de perfection où Dieu **plantait** personnellement un jardin. Les **quatre fleuves** symbolisent la bénédiction divine s'étendant aux quatre coins de la terre.

L'**arbre de vie** (*'ets ha-chayyim*) et l'**arbre de la connaissance du bien et du mal** (*'ets ha-da'at tov wa-ra'*) représentent deux chemins : la dépendance de Dieu versus l'autonomie humaine.

La **solitude** d'Adam ("il n'est pas bon que l'homme soit seul") révèle que l'homme est créé pour la relation. **Eve** (*Hawwah* - "mère de tous les vivants") est créée comme **aide semblable** (*'ezer kenegdo*), révélant l'égalité dans la différence.

L'**union conjugale** ("ils deviendront une seule chair") établit le mariage comme reflet de l'unité divine et préfigure l'union Christ-Église.""",
            "theological_points": [
                "**Anthropologie biblique** : L'homme corps-âme-esprit en unité",
                "**Vocation originelle** : Gardien et cultivateur de la création divine",
                "**Mariage sacré** : Institution divine reflétant l'amour trinitaire",
                "**Innocence primitive** : État de justice originelle avant la chute"
            ]
        },
        3: {
            "title": "La **Chute** : Rupture et Promesse de Rédemption",
            "narrative": """Le **serpent** (*nachash*) introduit le doute sur la parole divine par la question insidieuse : "Dieu a-t-il réellement dit...?" Cette stratégie satanique vise à ébranler la confiance en la révélation divine.

La **tentation** suit un processus : **voir** ("bon à manger"), **désirer** ("agréable aux yeux"), **orgueil** ("précieux pour ouvrir l'intelligence"). Cette triple tentation préfigure celle du Christ au désert.

La **désobéissance** d'Adam et Eve révèle la nature du péché : **rébellion** contre l'autorité divine, **incrédulité** envers Sa parole, **orgueil** cherchant l'autonomie.

Les **conséquences** immédiates : **honte** (conscience du péché), **peur** (rupture de communion), **accusations mutuelles** (rupture relationnelle).

Le **jugement divin** révèle Sa justice : **malédiction du serpent**, **souffrances de l'enfantement**, **labeur pénible**, **mort physique et spirituelle**.

Mais dans ce jugement brille l'**espoir** : la **proto-évangile** (Genèse 3:15) annonce la victoire future de la **postérité de la femme** sur Satan. Cette première prophétie messianique traverse toute l'Écriture.

L'**expulsion d'Eden** préserve l'humanité de l'immortalité dans le péché, et les **chérubins gardiens** maintiennent la sainteté divine.""",
            "theological_points": [
                "**Origine du mal** : Le péché entre par la désobéissance humaine, non par création divine",
                "**Solidarité adamique** : Tous pèchent en Adam (Romains 5:12)",
                "**Justice et miséricorde** : Dieu juge le péché mais promet la rédemption",
                "**Espérance messianique** : Le Christ annoncé dès la chute"
            ]
        }
    },
    "Exode": {
        1: {
            "title": "La **Servitude** : Préparation Divine à la Délivrance",
            "narrative": """L'oppression en Égypte révèle la fidélité divine aux promesses faites aux **patriarches**. Joseph étant mort, un **nouveau roi** qui ne connaissait pas Joseph monte sur le trône, illustrant comment les bénéfices divins peuvent être oubliés par les générations suivantes.

La **multiplication** extraordinaire d'Israël accomplit la promesse faite à Abraham : "Je multiplierai ta postérité comme les étoiles du ciel". Cette fécondité provoque la **crainte** des Égyptiens, révélant comment la bénédiction divine peut susciter l'opposition humaine.

L'**oppression systématique** - travaux forcés, corvées pénibles, génocide des nouveaux-nés - révèle la nature du mal qui cherche à détruire le plan divin. Pharaon incarne l'orgueil humain défiant Dieu.

Les **sages-femmes hébraïques** Shiphra et Pua démontrent que la **crainte de Dieu** prime sur la crainte des hommes. Leur désobéissance civile préfigure la résistance légitime à l'autorité injuste.

La **stratégie divine** utilise même l'oppression pour préparer Son peuple à désirer la délivrance. Sans cette servitude, Israël n'aurait peut-être pas quitté l'Égypte prospère.

Les **gémissements** du peuple montent vers Dieu, qui **entend**, **se souvient** de Son alliance, **voit** leur affliction et **connaît** leur situation. Ces quatre verbes révèlent l'engagement total de Dieu envers Son peuple.""",
            "theological_points": [
                "**Fidélité divine** : Dieu accomplit Ses promesses malgré les circonstances",
                "**Pédagogie divine** : L'épreuve prépare à recevoir la grâce",
                "**Résistance légitime** : Obéir à Dieu plutôt qu'aux hommes quand ils s'opposent",
                "**Intercession** : Les cris des opprimés parviennent toujours à Dieu"
            ]
        }
    },
    "Jean": {
        3: {
            "title": "La **Nouvelle Naissance** : Entrée dans le Royaume",
            "narrative": """**Nicodème** (*Nikodemos* - "vainqueur du peuple") vient de nuit, symbolisant son état spirituel. Ce **chef des Juifs**, **pharisien** et **docteur d'Israël** représente la religiosité humaine face à la révélation divine.

Sa reconnaissance de Jésus comme **"Rabbi venu de Dieu"** révèle une conviction intellectuelle insuffisante. Les **signes** (*semeion*) attestent la mission divine, mais ne suffisent pas pour la conversion véritable.

Jésus révèle l'exigence absolue : **"naître de nouveau"** (*gennao anothen*). Le terme grec *anothen* signifie à la fois "de nouveau" et "d'en haut", révélant la double dimension : recommencement et origine divine.

L'incompréhension de Nicodème ("Comment un homme peut-il naître étant vieux?") illustre la pensée charnelle face aux réalités spirituelles. La **chair** ne peut engendrer que la chair ; seul l'**Esprit** engendre l'esprit.

L'analogie du **vent** (*pneuma*) révèle la souveraineté divine dans la régénération : invisible mais réelle, libre mais efficace, mystérieuse mais certaine.

Le **serpent d'airain** (Nombres 21) préfigure la crucifixion : comme Moïse éleva le serpent, **le Fils de l'homme doit être élevé**, révélant que la mort du Christ est l'unique remède au venin du péché.

**Jean 3:16** révèle le **motif** (amour divin), le **moyen** (don du Fils), la **méthode** (foi), et le **but** (vie éternelle) du salut.""",
            "theological_points": [
                "**Régénération** : Œuvre souveraine de l'Esprit, non de la volonté humaine",
                "**Foi salvatrice** : Au-delà de la conviction intellectuelle",
                "**Amour divin** : Initiative gratuite de Dieu envers l'humanité perdue",
                "**Centralité de la croix** : Unique moyen de salut préfiguré dans l'AT"
            ]
        }
    }
}

def get_bible_text(book: str, chapter: int) -> Optional[str]:
    """Récupère le texte biblique via l'API Bible Derby"""
    try:
        headers = {
            "api-key": BIBLE_API_KEY,
            "accept": "application/json"
        }
        
        # Mapping des noms français vers les codes API
        book_mapping = {
            "Genèse": "GEN", "Exode": "EXO", "Jean": "JHN"
            # Ajouter d'autres livres selon besoin
        }
        
        book_code = book_mapping.get(book, "GEN")
        url = f"{BIBLE_API_BASE}/bibles/{BIBLE_ID}/chapters/{book_code}.{chapter}"
        
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            return data.get("data", {}).get("content", "")
        return None
    except Exception as e:
        print(f"Erreur API Bible: {e}")
        return None

@app.post("/api/generate-study")
async def generate_study(request: StudyRequest):
    """Génère une étude biblique avec contenu théologique unique"""
    try:
        # Parser le passage (ex: "Jean 3:16 LSG")
        parts = request.passage.split()
        book = parts[0]
        chapter_verse = parts[1].split(":")
        chapter = int(chapter_verse[0])
        
        # Récupérer le texte biblique
        bible_text = get_bible_text(book, chapter)
        
        # Récupérer le contenu théologique unique
        theological_content = THEOLOGICAL_CONTENT.get(book, {}).get(chapter, {
            "title": f"Étude de {book} {chapter}",
            "narrative": f"Contenu théologique pour {book} chapitre {chapter}",
            "theological_points": ["Point théologique principal"]
        })
        
        # Construire la réponse formatée
        content = f"""# {theological_content['title']}

## 📖 Texte Biblique
{bible_text or 'Texte biblique en cours de chargement...'}

## 🎯 Analyse Narrative Théologique

{theological_content['narrative']}

## ✨ Points Théologiques Essentiels

"""
        
        for point in theological_content.get('theological_points', []):
            content += f"• {point}\n"
        
        content += f"""

## 🙏 Application Spirituelle

Cette étude de **{book} {chapter}** nous invite à une réflexion profonde sur la nature de Dieu et notre relation avec Lui. Les vérités révélées dans ce passage s'enracinent dans la **doctrine scripturaire** et nous orientent vers une foi vivante et transformatrice.

*"Que la parole du Christ habite partiellement en vous, dans toute sa richesse"* (Colossiens 3:16)

---
*Étude conforme à la saine doctrine des Saintes Écritures*"""

        return {"content": content}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)