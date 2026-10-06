-- Migration for Epic 2: Content Creation and Prompt Templates

CREATE TABLE IF NOT EXISTS prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  template_body TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}' NOT NULL,
  performance_score REAL,
  platform VARCHAR(50) NOT NULL,
  industry VARCHAR(100),
  source VARCHAR(50) DEFAULT 'system' NOT NULL,
  status VARCHAR(50) DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS segment_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  values TEXT[] DEFAULT '{}' NOT NULL,
  age_range VARCHAR(50),
  platform_preference VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS content_pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  campaign_id UUID,
  platform VARCHAR(50) NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  persona_id UUID REFERENCES segment_personas(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_piece_id UUID NOT NULL REFERENCES content_pieces(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content_body TEXT NOT NULL,
  template_id UUID REFERENCES prompt_templates(id) ON DELETE SET NULL,
  annotation_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Seed prompt templates (3 fallbacks per platform)
INSERT INTO prompt_templates (id, name, category, subcategory, template_body, variables, performance_score, platform, industry, source) VALUES
-- Instagram
('a0e0a0a0-0000-0000-0000-000000000001', 'Instagram Product Launch Carousel', 'Product Launch', 'Carousel', 'Write a 3-slide Instagram carousel post about {{brandName}}''s new {{productCategory}} launch. Slide 1: Catchy headline. Slide 2: Core benefits. Slide 3: Call to action to shop now.', ARRAY['brandName', 'productCategory'], 85.5, 'Instagram', 'General', 'system'),
('a0e0a0a0-0000-0000-0000-000000000002', 'Instagram Customer Engagement Hook', 'Engagement', 'Caption', 'Write a conversational Instagram caption for {{brandName}} asking the audience about their main struggle with {{productCategory}}. Keep the tone friendly and end with a question.', ARRAY['brandName', 'productCategory'], 91.2, 'Instagram', 'General', 'system'),
('a0e0a0a0-0000-0000-0000-000000000003', 'Instagram Educational Tips', 'Educational', 'Tips', 'Write a short educational Instagram post giving 3 tips on how to get the most value out of {{productCategory}}. Tone: helpful and inspiring.', ARRAY['brandName', 'productCategory'], 79.0, 'Instagram', 'General', 'system'),

-- LinkedIn
('a0e0a0a0-0000-0000-0000-000000000004', 'LinkedIn Industry Insight', 'Educational', 'Thought Leadership', 'Write a professional LinkedIn post sharing a trend in the {{productCategory}} industry. Explain how {{brandName}} addresses this trend. Tone: authoritative and forward-looking.', ARRAY['brandName', 'productCategory'], 88.0, 'LinkedIn', 'General', 'system'),
('a0e0a0a0-0000-0000-0000-000000000005', 'LinkedIn Behind-The-Scenes Story', 'Engagement', 'Storytelling', 'Write a personal, behind-the-scenes LinkedIn post about how {{brandName}} designed our latest {{productCategory}}. Focus on the biggest challenge we overcame.', ARRAY['brandName', 'productCategory'], 94.5, 'LinkedIn', 'General', 'system'),
('a0e0a0a0-0000-0000-0000-000000000006', 'LinkedIn Product Milestone Announcement', 'Promotional', 'Announcement', 'Write a professional LinkedIn announcement celebrating a new version or milestone of {{brandName}}''s {{productCategory}}. Thank our customers and partners.', ARRAY['brandName', 'productCategory'], 76.5, 'LinkedIn', 'General', 'system'),

-- Blog
('a0e0a0a0-0000-0000-0000-000000000007', 'Blog How-To Guide Intro', 'Educational', 'Blog Intro', 'Write an engaging introduction for a blog post titled "How to choose the best {{productCategory}} for your business". Mention {{brandName}} naturally as a leading example.', ARRAY['brandName', 'productCategory'], 82.3, 'Blog', 'General', 'system'),
('a0e0a0a0-0000-0000-0000-000000000008', 'Blog Case Study Outline', 'Promotional', 'Case Study', 'Write a blog post outline summarizing how a customer used {{brandName}}''s {{productCategory}} to solve their biggest business challenge.', ARRAY['brandName', 'productCategory'], 86.8, 'Blog', 'General', 'system'),
('a0e0a0a0-0000-0000-0000-000000000009', 'Blog Industry Trends Overview', 'Educational', 'Trends', 'Write a blog post section overviewing the top 3 trends in {{productCategory}} this year, highlighting {{brandName}}''s vision for sustainable development.', ARRAY['brandName', 'productCategory'], 77.2, 'Blog', 'General', 'system'),

-- Email
('a0e0a0a0-0000-0000-0000-000000000010', 'Email Product Welcome Message', 'Engagement', 'Welcome', 'Write a friendly welcome email for new users of {{brandName}}''s {{productCategory}}. Include a quick tip on getting started and a link to the dashboard.', ARRAY['brandName', 'productCategory'], 93.0, 'Email', 'General', 'system'),
('a0e0a0a0-0000-0000-0000-000000000011', 'Email Weekly Newsletter Highlight', 'Educational', 'Newsletter', 'Write a newsletter highlight segment introducing {{brandName}}''s latest article on optimizing {{productCategory}} workflows. Keep it punchy.', ARRAY['brandName', 'productCategory'], 80.5, 'Email', 'General', 'system'),
('a0e0a0a0-0000-0000-0000-000000000012', 'Email Special Promotional Offer', 'Promotional', 'Offer', 'Write a limited-time promotional email offering a discount on upgrading {{brandName}}''s {{productCategory}}. Focus on the core value add and create urgency.', ARRAY['brandName', 'productCategory'], 89.2, 'Email', 'General', 'system'),

-- Facebook
('a0e0a0a0-0000-0000-0000-000000000013', 'Facebook Local Community Story', 'Engagement', 'Community', 'Write a warm Facebook post highlighting how {{brandName}}''s {{productCategory}} supports local community initiatives and small businesses.', ARRAY['brandName', 'productCategory'], 84.1, 'Facebook', 'General', 'system'),
('a0e0a0a0-0000-0000-0000-000000000014', 'Facebook Customer Testimonial Share', 'Promotional', 'Testimonial', 'Write a Facebook caption sharing a quote from a happy customer who saved hours of work using {{brandName}}''s {{productCategory}}.', ARRAY['brandName', 'productCategory'], 90.0, 'Facebook', 'General', 'system'),
('a0e0a0a0-0000-0000-0000-000000000015', 'Facebook Seasonal Offer Post', 'Promotional', 'Seasonal', 'Write a punchy Facebook post promoting a seasonal sale on {{brandName}}''s {{productCategory}} with relevant emojis and hashtags.', ARRAY['brandName', 'productCategory'], 78.4, 'Facebook', 'General', 'system'),

-- TikTok
('a0e0a0a0-0000-0000-0000-000000000016', 'TikTok Educational Trend Script', 'Educational', 'Video Script', 'Write a 15-second TikTok script (hook, body, CTA) showing a life hack involving {{productCategory}}. Tone: fast-paced and witty.', ARRAY['brandName', 'productCategory'], 95.8, 'TikTok', 'General', 'system'),
('a0e0a0a0-0000-0000-0000-000000000017', 'TikTok Behind-The-Scenes Hook', 'Engagement', 'Behind the Scenes', 'Write a TikTok caption and hook for a quick video showing a day in the life of {{brandName}} developers building {{productCategory}}.', ARRAY['brandName', 'productCategory'], 88.7, 'TikTok', 'General', 'system'),
('a0e0a0a0-0000-0000-0000-000000000018', 'TikTok Viral Challenge Hook', 'Engagement', 'Challenge', 'Write a creative TikTok caption and hook prompting our followers to participate in a duet challenge using {{brandName}}''s {{productCategory}}.', ARRAY['brandName', 'productCategory'], 79.9, 'TikTok', 'General', 'system');
