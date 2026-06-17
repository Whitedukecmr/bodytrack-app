-- ════════════════════════════════════════════════════════════
-- BodyTrack — Schéma PostgreSQL
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  sexe VARCHAR(10) NOT NULL DEFAULT 'homme',      -- homme / femme
  age INT NOT NULL,
  taille_cm NUMERIC(5,1) NOT NULL,
  poids_initial_kg NUMERIC(5,1) NOT NULL,
  poids_objectif_kg NUMERIC(5,1) NOT NULL,
  niveau_activite VARCHAR(20) NOT NULL DEFAULT 'modere', -- sedentaire/leger/modere/actif/tres_actif
  created_at TIMESTAMP DEFAULT NOW()
);

-- Repas analysés par photo (IA Vision)
CREATE TABLE IF NOT EXISTS meals (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  moment VARCHAR(20) NOT NULL,         -- matin / midi / collation / soir
  nom_repas VARCHAR(255),
  calories INT,
  proteines_g NUMERIC(6,1),
  glucides_g NUMERIC(6,1),
  lipides_g NUMERIC(6,1),
  fibres_g NUMERIC(6,1),
  avis_sante TEXT,
  conseil TEXT,
  score_sante INT,
  logged_at TIMESTAMP DEFAULT NOW()
);

-- Activités physiques (extraites de captures d'écran santé)
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  type_activite VARCHAR(50),           -- marche / musculation / rameur / natation / autre
  pas INT,
  distance_km NUMERIC(5,2),
  duree_min INT,
  frequence_cardiaque_moy INT,
  calories_brulees INT,
  logged_at TIMESTAMP DEFAULT NOW()
);

-- Composition corporelle (extraite de captures balance connectée)
CREATE TABLE IF NOT EXISTS body_composition (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  poids_kg NUMERIC(5,1) NOT NULL,
  masse_grasse_pct NUMERIC(4,1),
  masse_musculaire_pct NUMERIC(4,1),
  eau_pct NUMERIC(4,1),
  logged_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_body_user_date ON body_composition(user_id, logged_at);
