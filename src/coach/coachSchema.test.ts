import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const schema = readFileSync(
  new URL('../../supabase/phase2/coach_identity_schema.sql', import.meta.url),
  'utf8',
);

const tables = [
  'coach_workspaces',
  'coach_workspace_memberships',
  'coach_profiles',
  'coach_sessions',
  'coach_messages',
  'coach_assessments',
  'coach_learning_profiles',
];

test('every Coach data table enables row-level security and has an explicit policy', () => {
  for (const table of tables) {
    assert.match(
      schema,
      new RegExp('alter table public\\.' + table + ' enable row level security', 'i'),
      table + ' must enable RLS',
    );
    assert.match(
      schema,
      new RegExp('create policy coach_[a-z0-9_]+[\\s\\S]{0,300}on public\\.' + table, 'i'),
      table + ' must define an explicit policy',
    );
    assert.match(
      schema,
      new RegExp('revoke all on public\\.' + table + ' from anon', 'i'),
      table + ' must revoke anonymous SQL privileges',
    );
  }
});

test('private workspace authorization helpers use auth.uid and a fixed search path', () => {
  assert.match(schema, /create or replace function private\.is_coach_workspace_owner[\s\S]*?security definer[\s\S]*?set search_path = ''[\s\S]*?auth\.uid\(\)/i);
  assert.match(schema, /create or replace function private\.is_coach_workspace_member[\s\S]*?security definer[\s\S]*?set search_path = ''[\s\S]*?auth\.uid\(\)/i);
  assert.doesNotMatch(schema, /auth\.jwt\(\)\s*->>\s*'user_metadata'/i);
  assert.doesNotMatch(schema, /grant execute on function private\.[^;]+ to anon/i);
});

test('individual profiles, sessions, messages, assessments and progress are tied to Auth users', () => {
  for (const table of ['coach_profiles', 'coach_sessions', 'coach_messages', 'coach_assessments', 'coach_learning_profiles']) {
    const start = schema.indexOf('create table if not exists public.' + table);
    assert.notEqual(start, -1, table + ' table exists');
    const block = schema.slice(start, schema.indexOf(');', start) + 2);
    assert.match(block, /user_id uuid not null references auth\.users|user_id uuid primary key references auth\.users/i);
  }
  assert.match(schema, /foreign key \(session_id, user_id\)[\s\S]*?references public\.coach_sessions\(id, user_id\)/i);
  assert.match(schema, /coach_assessment_owner_key_unique unique \(user_id, assessment_key\)/i);
});

test('the persistence design stores text only and caps transcript and assessment payload sizes', () => {
  assert.match(schema, /content text not null check \(char_length\(content\) between 1 and 4000\)/i);
  assert.match(schema, /pg_column_size\(assessment_data\) <= 32768/i);
  assert.match(schema, /pg_column_size\(learning_state\) <= 32768/i);
  assert.doesNotMatch(schema, /audio_blob|audio_url|raw_audio|recording_bytes/i);
  assert.match(schema, /text transcript only/i);
});

test('the schema grants authenticated access only to named Coach tables', () => {
  assert.match(schema, /grant select, insert, update, delete on public\.coach_workspaces to authenticated/i);
  assert.match(schema, /grant select, insert on public\.coach_messages to authenticated/i);
  assert.doesNotMatch(schema, /grant .* on public\.coach_[a-z_]+ to anon/i);
  assert.match(schema, /revoke all on schema private from public, anon/i);
});
