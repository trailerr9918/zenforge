-- Forge Engine tables (Mark 2)
-- Run this in the Supabase SQL editor.

-- ============================================================================
-- forge_techniques — indexed design moves extracted from prompts + screenshots
-- ============================================================================
create table if not exists public.forge_techniques (
  id text primary key,
  source_prompt_id text not null,
  source_prompt_title text not null,
  source_type text not null check (source_type in ('prompt', 'image')),
  part_type text not null,
  subtype text,
  name text not null,
  spec jsonb not null default '{}'::jsonb,
  fonts text[] not null default '{}',
  colors text[] not null default '{}',
  media_urls text[] not null default '{}',
  tags text[] not null default '{}',
  user_rating smallint check (user_rating is null or (user_rating >= 1 and user_rating <= 5)),
  usage_count integer not null default 0,
  avoid_count integer not null default 0,
  avoided boolean not null default false,
  score double precision not null default 0,
  extracted_at timestamptz not null default now()
);

create index if not exists idx_forge_techniques_part_type on public.forge_techniques (part_type);
create index if not exists idx_forge_techniques_source on public.forge_techniques (source_prompt_id);
create index if not exists idx_forge_techniques_score on public.forge_techniques (score desc);
create index if not exists idx_forge_techniques_avoided on public.forge_techniques (avoided);

-- ============================================================================
-- forge_generations — websites produced by the Forge Reasoner (Phase 2)
-- ============================================================================
create table if not exists public.forge_generations (
  id text primary key,
  plan jsonb not null,                -- the ForgePlan (technique picks + reasons)
  spec jsonb not null,                -- the StructuredSpec used to render
  html text not null,                 -- the rendered HTML
  business_name text not null,
  prompt_type text not null,
  source_technique_ids text[] not null default '{}',
  status text not null default 'pending_review'
    check (status in ('pending_review', 'trashed', 'improvement_suggested', 'saved_as_template')),
  user_rating smallint check (user_rating is null or (user_rating >= 1 and user_rating <= 5)),
  user_note text,
  improvement_suggestions jsonb,     -- array of strings from LLM when rating=3
  template_id text,                  -- set when promoted to saved_template
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists idx_forge_generations_status on public.forge_generations (status);
create index if not exists idx_forge_generations_created on public.forge_generations (created_at desc);

-- ============================================================================
-- forge_saved_templates — loved websites, recallable with variable swap
-- ============================================================================
create table if not exists public.forge_saved_templates (
  id text primary key,
  name text not null,
  source_generation_id text references public.forge_generations(id) on delete set null,
  source_technique_ids text[] not null default '{}',
  html text not null,
  spec jsonb not null,
  variables text[] not null default '{}',  -- ['businessName', 'headline', 'ctaText']
  user_rating smallint not null check (user_rating >= 4 and user_rating <= 5),
  usage_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_forge_saved_templates_rating on public.forge_saved_templates (user_rating desc);

-- ============================================================================
-- forge_image_inspirations — uploaded screenshots (metadata only; binary in local FS)
-- ============================================================================
create table if not exists public.forge_image_inspirations (
  id text primary key,
  filename text not null,
  local_path text not null,
  technique_ids text[] not null default '{}',
  overall_style text,
  user_note text,
  processed boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Row-level security — service role bypasses; we use the service key everywhere.
-- ============================================================================
alter table public.forge_techniques enable row level security;
alter table public.forge_generations enable row level security;
alter table public.forge_saved_templates enable row level security;
alter table public.forge_image_inspirations enable row level security;

-- (no policies added — service role key bypasses RLS, which is what we use)
