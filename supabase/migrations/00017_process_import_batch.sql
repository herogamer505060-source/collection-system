create or replace function public.process_import_batch(target_actor_id uuid, target_batch_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  batch_row public.import_batches%rowtype;
  row_item jsonb;
  approved_at timestamptz := timezone('utc', now());
  cairo_today date := timezone('Africa/Cairo', now())::date;
  created_count integer := 0;
  issues_count integer := 0;
  rows_imported_count integer := 0;
  skipped_count integer := 0;
  updated_count integer := 0;
  final_status text;
  was_inserted boolean;
  customer_cache jsonb := '{}'::jsonb;
  contract_cache jsonb := '{}'::jsonb;
  touched_contract_keys text[] := array[]::text[];
  v_customer_id uuid;
  v_contract_id uuid;
  matched_unit_id uuid;
  link_id uuid;
  v_amount_collected numeric(18,2);
  v_amount_due numeric(18,2);
  v_amount_outstanding numeric(18,2);
  v_delay_days integer;
  v_payment_status text;
  contract_key text;
  customer_key text;
begin
  select *
  into batch_row
  from public.import_batches
  where id = target_batch_id
  for update;

  if not found then
    raise exception 'Import batch was not found.';
  end if;

  if batch_row.status <> 'ready_for_review' then
    raise exception 'Import batch cannot be approved in "%" status.', batch_row.status;
  end if;

  if batch_row.summary_json is null
    or coalesce(jsonb_typeof(batch_row.summary_json -> 'stagedRows'), 'null') <> 'array' then
    raise exception 'Import batch must be previewed before approval.';
  end if;

  select count(*)
  into issues_count
  from public.import_issues
  where batch_id = target_batch_id;

  for row_item in
    select value
    from jsonb_array_elements(batch_row.summary_json -> 'stagedRows')
  loop
    if not coalesce((row_item ->> 'canApply')::boolean, false) then
      skipped_count := skipped_count + 1;

      if row_item ->> 'kind' = 'unit'
        and coalesce((row_item #>> '{unit,statusConflict}')::boolean, false)
        and nullif(row_item #>> '{unit,existingUnitId}', '') is not null then
        if row_item ->> 'unitStatus' = 'sold' then
          update public.units
          set
            source_batch_id = target_batch_id,
            source_sold = true,
            status_conflict = true
          where id = (row_item #>> '{unit,existingUnitId}')::uuid;
        else
          update public.units
          set
            source_available = true,
            source_batch_id = target_batch_id,
            status_conflict = true
          where id = (row_item #>> '{unit,existingUnitId}')::uuid;
        end if;
      end if;

      continue;
    end if;

    if row_item ->> 'kind' = 'unit' then
      if nullif(row_item #>> '{unit,existingUnitId}', '') is not null then
        update public.units
        set
          built_up_area = nullif(row_item ->> 'builtUpArea', '')::numeric,
          contract_price = nullif(row_item ->> 'contractPrice', '')::numeric,
          floor_name = nullif(row_item ->> 'floorName', ''),
          garden_area = nullif(row_item ->> 'gardenArea', '')::numeric,
          list_price = nullif(row_item ->> 'listPrice', '')::numeric,
          project_id = (row_item ->> 'projectId')::uuid,
          source_available = row_item ->> 'unitStatus' = 'available',
          source_batch_id = target_batch_id,
          source_sold = row_item ->> 'unitStatus' = 'sold',
          status_conflict = false,
          unit_code = row_item #>> '{unit,unitCode}',
          unit_key = row_item #>> '{unit,unitKey}',
          unit_status = row_item ->> 'unitStatus'
        where id = (row_item #>> '{unit,existingUnitId}')::uuid;

        updated_count := updated_count + 1;
      else
        insert into public.units (
          built_up_area,
          contract_price,
          floor_name,
          garden_area,
          list_price,
          project_id,
          source_available,
          source_batch_id,
          source_sold,
          status_conflict,
          unit_code,
          unit_key,
          unit_status
        )
        values (
          nullif(row_item ->> 'builtUpArea', '')::numeric,
          nullif(row_item ->> 'contractPrice', '')::numeric,
          nullif(row_item ->> 'floorName', ''),
          nullif(row_item ->> 'gardenArea', '')::numeric,
          nullif(row_item ->> 'listPrice', '')::numeric,
          (row_item ->> 'projectId')::uuid,
          row_item ->> 'unitStatus' = 'available',
          target_batch_id,
          row_item ->> 'unitStatus' = 'sold',
          false,
          row_item #>> '{unit,unitCode}',
          row_item #>> '{unit,unitKey}',
          row_item ->> 'unitStatus'
        )
        on conflict (unit_key) do update
        set
          built_up_area = excluded.built_up_area,
          contract_price = excluded.contract_price,
          floor_name = excluded.floor_name,
          garden_area = excluded.garden_area,
          list_price = excluded.list_price,
          project_id = excluded.project_id,
          source_available = excluded.source_available,
          source_batch_id = excluded.source_batch_id,
          source_sold = excluded.source_sold,
          status_conflict = excluded.status_conflict,
          unit_code = excluded.unit_code,
          unit_key = excluded.unit_key,
          unit_status = excluded.unit_status
        returning xmax = 0
        into was_inserted;

        if was_inserted then
          created_count := created_count + 1;
        else
          updated_count := updated_count + 1;
        end if;
      end if;

      rows_imported_count := rows_imported_count + 1;
      continue;
    end if;

    customer_key := row_item #>> '{customer,customerImportKey}';

    if customer_cache ? customer_key then
      v_customer_id := (customer_cache ->> customer_key)::uuid;
    elsif nullif(row_item #>> '{customer,customerId}', '') is not null then
      v_customer_id := (row_item #>> '{customer,customerId}')::uuid;
      customer_cache := customer_cache || jsonb_build_object(customer_key, v_customer_id::text);
    else
      insert into public.customers (
        customer_key,
        customer_name,
        customer_name_raw,
        normalized_name
      )
      values (
        customer_key,
        row_item #>> '{customer,customerName}',
        row_item #>> '{customer,customerName}',
        row_item #>> '{customer,normalizedName}'
      )
      on conflict (customer_key) do update
      set
        customer_name = excluded.customer_name,
        customer_name_raw = excluded.customer_name_raw,
        normalized_name = excluded.normalized_name
      returning id, xmax = 0
      into v_customer_id, was_inserted;

      if was_inserted then
        created_count := created_count + 1;
      end if;

      customer_cache := customer_cache || jsonb_build_object(customer_key, v_customer_id::text);
    end if;

    insert into public.customer_project_identities (
      customer_id,
      customer_import_key,
      customer_name_raw,
      normalized_name,
      project_id
    )
    values (
      v_customer_id,
      customer_key,
      row_item #>> '{customer,customerName}',
      row_item #>> '{customer,normalizedName}',
      (row_item ->> 'projectId')::uuid
    )
    on conflict (customer_import_key) do update
    set
      customer_id = excluded.customer_id,
      customer_name_raw = excluded.customer_name_raw,
      normalized_name = excluded.normalized_name,
      project_id = excluded.project_id;

    contract_key := row_item #>> '{contract,contractKey}';

    if contract_cache ? contract_key then
      v_contract_id := (contract_cache ->> contract_key)::uuid;
    elsif nullif(row_item #>> '{contract,contractId}', '') is not null then
      v_contract_id := (row_item #>> '{contract,contractId}')::uuid;

      if not contract_key = any(touched_contract_keys) then
        update public.contracts
        set
          customer_id = v_customer_id,
          project_id = (row_item ->> 'projectId')::uuid,
          source_batch_id = target_batch_id
        where id = v_contract_id;

        touched_contract_keys := array_append(touched_contract_keys, contract_key);
        updated_count := updated_count + 1;
      end if;

      contract_cache := contract_cache || jsonb_build_object(contract_key, v_contract_id::text);
    else
      insert into public.contracts (
        contract_key,
        customer_id,
        project_id,
        source_batch_id
      )
      values (
        contract_key,
        v_customer_id,
        (row_item ->> 'projectId')::uuid,
        target_batch_id
      )
      on conflict (contract_key) do update
      set
        customer_id = excluded.customer_id,
        project_id = excluded.project_id,
        source_batch_id = excluded.source_batch_id
      returning id, xmax = 0
      into v_contract_id, was_inserted;

      if was_inserted then
        created_count := created_count + 1;
      else
        updated_count := updated_count + 1;
      end if;

      contract_cache := contract_cache || jsonb_build_object(contract_key, v_contract_id::text);
    end if;

    for matched_unit_id in
      select value::uuid
      from jsonb_array_elements_text(coalesce(row_item -> 'matchedUnitIds', '[]'::jsonb))
    loop
      link_id := null;

      insert into public.contract_units (contract_id, unit_id)
      values (v_contract_id, matched_unit_id)
      on conflict (contract_id, unit_id) do nothing
      returning id into link_id;

      if link_id is not null then
        created_count := created_count + 1;
      end if;
    end loop;

    v_amount_collected := coalesce(nullif(row_item ->> 'amountCollected', '')::numeric, 0);
    v_amount_due := coalesce(nullif(row_item ->> 'amountDue', '')::numeric, 0);
    v_amount_outstanding := greatest(
      coalesce(
        nullif(row_item ->> 'amountOutstanding', '')::numeric,
        v_amount_due - v_amount_collected
      ),
      0
    );

    if v_amount_outstanding <= 0 then
      v_payment_status := 'paid';
      v_delay_days := 0;
    elsif (row_item ->> 'dueDate')::date < cairo_today then
      v_payment_status := 'overdue';
      v_delay_days := cairo_today - (row_item ->> 'dueDate')::date;
    elsif v_amount_collected > 0 then
      v_payment_status := 'partial';
      v_delay_days := 0;
    else
      v_payment_status := 'unpaid';
      v_delay_days := 0;
    end if;

    if nullif(row_item #>> '{installment,installmentId}', '') is not null then
      update public.installments
      set
        amount_collected = v_amount_collected,
        amount_due = v_amount_due,
        amount_outstanding = v_amount_outstanding,
        commercial_paper = nullif(row_item ->> 'commercialPaper', ''),
        contract_id = v_contract_id,
        delay_bucket = case
          when v_delay_days <= 0 then 'not_due'
          when v_delay_days <= 30 then '1_30'
          when v_delay_days <= 60 then '31_60'
          when v_delay_days <= 90 then '61_90'
          else '90_plus'
        end,
        delay_days = v_delay_days,
        due_date = (row_item ->> 'dueDate')::date,
        installment_code = nullif(row_item ->> 'installmentCode', ''),
        installment_key = row_item #>> '{installment,installmentKey}',
        installment_type = row_item ->> 'installmentType',
        net_amount = nullif(row_item ->> 'netAmount', '')::numeric,
        payment_date = nullif(row_item ->> 'paymentDate', '')::date,
        payment_status = v_payment_status,
        penalty_amount = coalesce(nullif(row_item ->> 'penaltyAmount', '')::numeric, 0),
        source_batch_id = target_batch_id
      where id = (row_item #>> '{installment,installmentId}')::uuid;

      updated_count := updated_count + 1;
    else
      insert into public.installments (
        amount_collected,
        amount_due,
        amount_outstanding,
        commercial_paper,
        contract_id,
        delay_bucket,
        delay_days,
        due_date,
        installment_code,
        installment_key,
        installment_type,
        net_amount,
        payment_date,
        payment_status,
        penalty_amount,
        source_batch_id
      )
      values (
        v_amount_collected,
        v_amount_due,
        v_amount_outstanding,
        nullif(row_item ->> 'commercialPaper', ''),
        v_contract_id,
        case
          when v_delay_days <= 0 then 'not_due'
          when v_delay_days <= 30 then '1_30'
          when v_delay_days <= 60 then '31_60'
          when v_delay_days <= 90 then '61_90'
          else '90_plus'
        end,
        v_delay_days,
        (row_item ->> 'dueDate')::date,
        nullif(row_item ->> 'installmentCode', ''),
        row_item #>> '{installment,installmentKey}',
        row_item ->> 'installmentType',
        nullif(row_item ->> 'netAmount', '')::numeric,
        nullif(row_item ->> 'paymentDate', '')::date,
        v_payment_status,
        coalesce(nullif(row_item ->> 'penaltyAmount', '')::numeric, 0),
        target_batch_id
      )
      on conflict (installment_key) do update
      set
        amount_collected = excluded.amount_collected,
        amount_due = excluded.amount_due,
        amount_outstanding = excluded.amount_outstanding,
        commercial_paper = excluded.commercial_paper,
        contract_id = excluded.contract_id,
        delay_bucket = excluded.delay_bucket,
        delay_days = excluded.delay_days,
        due_date = excluded.due_date,
        installment_code = excluded.installment_code,
        installment_key = excluded.installment_key,
        installment_type = excluded.installment_type,
        net_amount = excluded.net_amount,
        payment_date = excluded.payment_date,
        payment_status = excluded.payment_status,
        penalty_amount = excluded.penalty_amount,
        source_batch_id = excluded.source_batch_id
      returning xmax = 0
      into was_inserted;

      if was_inserted then
        created_count := created_count + 1;
      else
        updated_count := updated_count + 1;
      end if;
    end if;

    rows_imported_count := rows_imported_count + 1;
  end loop;

  final_status := case when issues_count > 0 then 'approved_with_issues' else 'approved' end;

  update public.import_batches
  set
    finished_at = approved_at,
    issue_count = issues_count,
    rows_imported = rows_imported_count,
    rows_skipped = skipped_count,
    rows_updated = updated_count,
    status = final_status,
    summary_json = coalesce(batch_row.summary_json, '{}'::jsonb) || jsonb_build_object(
      'approvalSummary',
      jsonb_build_object(
        'approvedAt', approved_at,
        'approvedBy', target_actor_id,
        'created', created_count,
        'issues', issues_count,
        'skipped', skipped_count,
        'updated', updated_count
      )
    )
  where id = target_batch_id;

  return jsonb_build_object(
    'approvedAt', approved_at,
    'batchId', target_batch_id,
    'status', final_status,
    'summary', jsonb_build_object(
      'created', created_count,
      'issues', issues_count,
      'skipped', skipped_count,
      'updated', updated_count
    )
  );
end;
$$;
