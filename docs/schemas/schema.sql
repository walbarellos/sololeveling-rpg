-- Schema PostgreSQL para Hunter RPG Web Foundation
-- Suporte a identidade do jogador, personagens (Hunter Ranks E-S) e Mundo Vivo (Gates e Regiões)

-- 1. Contas de Usuário
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(32) NOT NULL UNIQUE,
  email VARCHAR(120) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Personagens / Caçadores
CREATE TABLE IF NOT EXISTS characters (
  id VARCHAR(64) PRIMARY KEY,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  name VARCHAR(32) NOT NULL,
  rank VARCHAR(2) NOT NULL DEFAULT 'E' CHECK (rank IN ('E', 'D', 'C', 'B', 'A', 'S')),
  level INT NOT NULL DEFAULT 1 CHECK (level >= 1),
  experience INT NOT NULL DEFAULT 0 CHECK (experience >= 0),
  hp INT NOT NULL DEFAULT 100 CHECK (hp >= 0),
  max_hp INT NOT NULL DEFAULT 100 CHECK (max_hp > 0),
  stamina INT NOT NULL DEFAULT 50 CHECK (stamina >= 0),
  max_stamina INT NOT NULL DEFAULT 50 CHECK (max_stamina > 0),
  tile_x INT NOT NULL DEFAULT 2 CHECK (tile_x >= 0),
  tile_y INT NOT NULL DEFAULT 2 CHECK (tile_y >= 0),
  current_region_id VARCHAR(64) NOT NULL DEFAULT 'dungeon-e-gate-01',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Estado Regional e Gates (Mundo Vivo Barato por Lazy Evaluation)
-- Em vez de rodar simulações 24/7 gastando CPU, o estado evolui calculando
-- o delta de tempo (NOW() - last_evaluated_at) no momento em que um caçador entra na região.
CREATE TABLE IF NOT EXISTS gate_regions (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  rank VARCHAR(2) NOT NULL DEFAULT 'E' CHECK (rank IN ('E', 'D', 'C', 'B', 'A', 'S')),
  threat_level INT NOT NULL DEFAULT 0 CHECK (threat_level >= 0),
  max_threat INT NOT NULL DEFAULT 100,
  is_outbreak BOOLEAN NOT NULL DEFAULT FALSE,
  last_evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  outbreak_deadline_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices essenciais para consultas de alta performance
CREATE INDEX IF NOT EXISTS idx_characters_account ON characters(account_id);
CREATE INDEX IF NOT EXISTS idx_characters_region ON characters(current_region_id);
CREATE INDEX IF NOT EXISTS idx_gate_regions_rank ON gate_regions(rank);
