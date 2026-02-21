alter table public.projects alter column status set default 'new_project';

update public.projects set status = 'new_project' where status = 'open';
