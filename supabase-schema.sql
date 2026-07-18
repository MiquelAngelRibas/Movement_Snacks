-- SQL Script para configurar Supabase
-- Copia y pega este script en el editor SQL de tu panel de Supabase.

-- 1. Tabla de Usuarios
create table if not exists public.users (
    id text primary key, -- Se puede usar el Teams User ID o un UUID auto-generado
    username text not null,
    avatar_url text,
    reminder_interval integer default 45, -- en minutos (30, 45, 60)
    has_equipment boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabla de Registro de Snacks
create table if not exists public.snacks_log (
    id uuid default gen_random_uuid() primary key,
    user_id text references public.users(id) on delete cascade not null,
    category text not null, -- 'pierna', 'empuje', 'tiron', 'metabolico'
    exercises_performed jsonb not null, -- Array de strings con los ejercicios realizados
    status text not null, -- 'completed', 'skipped', 'snoozed'
    points_earned integer default 10 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Habilitar Seguridad a Nivel de Fila (RLS)
alter table public.users enable row level security;
alter table public.snacks_log enable row level security;

-- 4. Crear Políticas de Acceso Público Simplificado (Lectura y Escritura para todos con la Anon Key)
drop policy if exists "Permitir lectura publica de usuarios" on public.users;
create policy "Permitir lectura publica de usuarios" on public.users 
    for select using (true);

drop policy if exists "Permitir insercion publica de usuarios" on public.users;
create policy "Permitir insercion publica de usuarios" on public.users 
    for insert with check (true);

drop policy if exists "Permitir actualizacion publica de usuarios" on public.users;
create policy "Permitir actualizacion publica de usuarios" on public.users 
    for update using (true);

drop policy if exists "Permitir lectura publica de logs" on public.snacks_log;
create policy "Permitir lectura publica de logs" on public.snacks_log 
    for select using (true);

drop policy if exists "Permitir insercion publica de logs" on public.snacks_log;
create policy "Permitir insercion publica de logs" on public.snacks_log 
    for insert with check (true);

-- 5. Habilitar Realtime para las tablas
-- Esto permite recibir notificaciones instantáneas por WebSockets cuando cambien los datos
begin;
  -- Comprobar si existe la publicación de tiempo real y añadir las tablas
  alter publication supabase_realtime add table public.users;
  alter publication supabase_realtime add table public.snacks_log;
commit;
