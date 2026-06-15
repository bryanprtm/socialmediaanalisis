
DELETE FROM public.user_roles WHERE user_id NOT IN (SELECT id FROM public.users);
ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_user_id_fkey;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
