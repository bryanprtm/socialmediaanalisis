create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'sync-rss-every-5min') then
    perform cron.unschedule('sync-rss-every-5min');
  end if;
end $$;

select cron.schedule(
  'sync-rss-every-5min',
  '*/5 * * * *',
  $cron$
  select net.http_post(
    url := 'https://project--4cf9fa0e-45c5-4162-a549-fe06870852e5.lovable.app/api/public/hooks/sync-rss',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2Z3dhZmhqenV3YXh6eGdxcHByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3ODM4NjgsImV4cCI6MjA5NDM1OTg2OH0.cRDpEIrXOlYYoybN8ehHNLezstToRKLPIg9a_TSgrhs'
    ),
    body := jsonb_build_object('source', 'pg_cron')
  ) as request_id;
  $cron$
);