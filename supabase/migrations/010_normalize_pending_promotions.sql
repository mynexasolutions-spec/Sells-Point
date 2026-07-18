-- Pending promotion requests must never receive featured placement before payment.
update listings
set featured = false
where featured_status in ('pending', 'awaiting_payment', 'rejected');

notify pgrst, 'reload schema';
