import React from "react";
import RubriquesInline from "./RubriquesInline";
import "./App.css";

const RUBRIQUES = [
  { id: 0, title: "Étude verset par verset", subtitle: "Analyse détaillée" },
  { id: 1, title: "Prière d'ouverture", subtitle: "Invocation de l'Esprit" },
  { id: 2, title: "Structure littéraire", subtitle: "Architecture du passage" },
  { id: 3, title: "Questions du chapitre précédent", subtitle: "Synthèse" },
  { id: 4, title: "Thème doctrinal", subtitle: "Enseignements clés" },
  { id: 5, title: "Fondements théologiques", subtitle: "Bases scripturaires" },
  { id: 6, title: "Contexte historique", subtitle: "Cadre et auteur" },
  { id: 7, title: "Contexte culturel", subtitle: "Us et coutumes" },
  { id: 8, title: "Contexte géographique", subtitle: "Lieux et cartes" },
  { id: 9, title: "Analyse lexicale", subtitle: "Mots clés (hébreu/grec)" },
  { id: 10, title: "Parallèles bibliques", subtitle: "Passages associés" },
  { id: 11, title: "Prophétie et accomplissement", subtitle: "Lien canonique" },
  { id: 12, title: "Personnages", subtitle: "Rôles et motivations" },
  { id: 13, title: "Structure rhétorique", subtitle: "Arguments et logique" },
  { id: 14, title: "Théologie trinitaire", subtitle: "Père / Fils / Esprit" },
  { id: 15, title: "Christ au centre", subtitle: "Christologie du texte" },
  { id: 16, title: "Évangile et grâce", subtitle: "Bonne nouvelle ici" },
  { id: 17, title: "Application personnelle", subtitle: "Vie pratique" },
  { id: 18, title: "Application communautaire", subtitle: "Église / famille" },
  { id: 19, title: "Prière de réponse", subtitle: "Adoration et supplication" },
  { id: 20, title: "Questions d'étude", subtitle: "Pour groupe ou perso" },
  { id: 21, title: "Points de vigilance", subtitle: "Mésusages à éviter" },
  { id: 22, title: "Objections et réponses", subtitle: "Apologétique" },
  { id: 23, title: "Perspective missionnelle", subtitle: "Témoignage et service" },
  { id: 24, title: "Éthique chrétienne", subtitle: "Choix et vertus" },
  { id: 25, title: "Louange / liturgie", subtitle: "Usage cultuel" },
  { id: 26, title: "Méditation guidée", subtitle: "Silence et contemplation" },
  { id: 27, title: "Mémoire / versets clés", subtitle: "À retenir" },
  { id: 28, title: "Plan d'action", subtitle: "Pas concrets pour la semaine" },
];

function App() {
  // État passage (adapte si tu as déjà ces states)
  const [book, setBook] = React.useState("Jean");
  const [chapter, setChapter] = React.useState(3);
  const [verse, setVerse] = React.useState(16);
  const [version, setVersion] = React.useState("LSG");
  const [tokens, setTokens] = React.useState(500);
  const [useChatGPT, setUseChatGPT] = React.useState(true);

  // Rubriques + contenu
  const [activeId, setActiveId] = React.useState(0);
  const [status, setStatus] = React.useState("idle"); // idle | generating | done
  const [output, setOutput] = React.useState("");

  const passageLabel = `${book} ${chapter}:${verse} ${version}`;

  async function handleGenerate() {
    setStatus("generating");
    setOutput("");

    // Essaie ton backend si dispo
    try {
      const res = await fetch("/api/generate-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passage: `${book} ${chapter}:${verse}`,
          version,
          tokens,
          model: useChatGPT ? "gpt" : "local",
          requestedRubriques: RUBRIQUES.map((r) => r.id),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.content) {
          setOutput(data.content);
          setStatus("done");
          return;
        }
      }
    } catch (_) {
      // fallback
    }

    // Fallback (simulation)
    setOutput(
      `Titre: Méditation sur ${passageLabel}\n\n1) Vérités clés\n- Dieu aime le monde\n- Le salut est un don\n\n2) Commentaire\nMéditation de démonstration.\n\n3) Prière\nSeigneur, apprends-moi à vivre selon ta grâce. Amen.`,
    );
    setStatus("done");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/60 to-emerald-50/60">
      {/* Header compact */}
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <h1 className="text-3xl font-serif">Méditation</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Barre d’actions (exemple minimal) */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="rounded-xl border bg-white px-4 py-2 text-sm hover:bg-gray-50"
            onClick={handleGenerate}
          >
            Générer
          </button>
          <button
            className="rounded-xl border bg-transparent px-4 py-2 text-sm hover:bg-gray-50"
            onClick={() => setStatus("idle")}
          >
            Reset
          </button>
          <span className="text-xs text-gray-500">
            {status === "generating" ? "Génération en cours…" : "Prêt"}
          </span>
        </div>

        {/* ====== LAYOUT 2 COLONNES ====== */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold">Rubriques ({RUBRIQUES.length})</h2>
          <p className="text-sm text-gray-500">
            Cliquez sur une rubrique pour afficher son contenu détaillé
          </p>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Colonne gauche (sticky + ascenseur) */}
            <div className="lg:col-span-4">
              <RubriquesInline
                items={RUBRIQUES}
                activeId={activeId}
                onSelect={setActiveId}
                sticky
                topClass="lg:top-36 xl:top-40"
              />
            </div>

            {/* Contenu à droite */}
            <div className="lg:col-span-8">
              <div className="rounded-2xl border p-4 bg-white/60 min-h-[300px]">
                <h3 className="text-lg font-semibold mb-2">
                  {RUBRIQUES.find((r) => r.id === activeId)?.title}
                </h3>
                <div className="prose max-w-none whitespace-pre-wrap">
                  {status === "done" && output ? (
                    output
                  ) : (
                    <p className="text-gray-600">
                      Sélectionnez une rubrique et cliquez sur{" "}
                      <strong>Générer</strong> pour voir le contenu de l’étude
                      pour <em>{passageLabel}</em>.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* ====== /LAYOUT 2 COLONNES ====== */}
      </main>
    </div>
  );
}

export default App;
