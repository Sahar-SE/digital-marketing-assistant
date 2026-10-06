-- Migration to add brand_dna and brand_dna_version tables

CREATE TABLE IF NOT EXISTS brand_dna (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  brand_name VARCHAR(255) NOT NULL,
  product_category VARCHAR(255) NOT NULL,
  tone_descriptors TEXT[] DEFAULT '{}' NOT NULL,
  audience_description TEXT NOT NULL,
  style_references TEXT[] DEFAULT '{}' NOT NULL,
  ethical_positioning TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'incomplete' NOT NULL,
  questionnaire_complete BOOLEAN DEFAULT FALSE NOT NULL,
  harvest_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS brand_dna_version (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_dna_id UUID NOT NULL REFERENCES brand_dna(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  brand_name VARCHAR(255) NOT NULL,
  product_category VARCHAR(255) NOT NULL,
  tone_descriptors TEXT[] DEFAULT '{}' NOT NULL,
  audience_description TEXT NOT NULL,
  style_references TEXT[] DEFAULT '{}' NOT NULL,
  ethical_positioning TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
