
CREATE TABLE IF NOT EXISTS t_p38053833_diet_assistant_ai.users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p38053833_diet_assistant_ai.sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p38053833_diet_assistant_ai.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

CREATE TABLE IF NOT EXISTS t_p38053833_diet_assistant_ai.profiles (
  user_id INTEGER PRIMARY KEY REFERENCES t_p38053833_diet_assistant_ai.users(id),
  daily_calories INTEGER DEFAULT 0,
  protein_target INTEGER DEFAULT 0,
  fat_target INTEGER DEFAULT 0,
  carbs_target INTEGER DEFAULT 0,
  gender VARCHAR(10) DEFAULT '',
  age VARCHAR(10) DEFAULT '',
  weight VARCHAR(10) DEFAULT '',
  height VARCHAR(10) DEFAULT '',
  activity VARCHAR(20) DEFAULT 'moderate',
  goal VARCHAR(20) DEFAULT 'maintain',
  body_fat VARCHAR(10) DEFAULT '',
  conditions JSONB DEFAULT '[]',
  medications JSONB DEFAULT '[]',
  bmr INTEGER DEFAULT 0,
  tdee INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p38053833_diet_assistant_ai.food_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES t_p38053833_diet_assistant_ai.users(id),
  log_date DATE NOT NULL,
  entries JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON t_p38053833_diet_assistant_ai.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON t_p38053833_diet_assistant_ai.food_logs(user_id, log_date);
