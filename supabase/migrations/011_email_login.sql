-- Email/password browser-demo accounts do not collect phone numbers.
alter table profiles alter column phone drop not null;

-- Existing legacy rows may have blank emails; only actual email addresses must be unique.
create unique index if not exists profiles_email_unique_nonblank_idx
  on profiles (lower(email))
  where email is not null and email <> '';
