-- Streak freeze: miss exactly ONE day with a 3+ day streak and a freeze
-- auto-consumes to keep the flame alive. One freeze, replenishing weekly.
-- Full CREATE OR REPLACE of update_study_streak (callers ignore its
-- return value; milestone thresholds are checked in app code after).

BEGIN;

ALTER TABLE public.study_streaks
  ADD COLUMN IF NOT EXISTS freezes_available integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS freeze_last_replenished date,
  ADD COLUMN IF NOT EXISTS last_freeze_used_on date;

CREATE OR REPLACE FUNCTION public.update_study_streak(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_row public.study_streaks%ROWTYPE;
  v_gap integer;
  v_new_streak integer;
BEGIN
  SELECT * INTO v_row FROM public.study_streaks WHERE user_id = p_user_id;

  -- First ever study action
  IF NOT FOUND THEN
    INSERT INTO public.study_streaks
      (user_id, current_streak, longest_streak, last_study_date, total_study_days, freezes_available)
    VALUES (p_user_id, 1, 1, v_today, 1, 1);
    RETURN;
  END IF;

  -- Weekly freeze replenish (max 1 banked)
  IF v_row.freezes_available = 0
     AND (v_row.freeze_last_replenished IS NULL
          OR v_row.freeze_last_replenished <= v_today - 7) THEN
    v_row.freezes_available := 1;
    v_row.freeze_last_replenished := v_today;
  END IF;

  -- Already counted today: persist any replenish and stop
  IF v_row.last_study_date = v_today THEN
    UPDATE public.study_streaks
    SET freezes_available = v_row.freezes_available,
        freeze_last_replenished = v_row.freeze_last_replenished,
        updated_at = now()
    WHERE user_id = p_user_id;
    RETURN;
  END IF;

  v_gap := v_today - COALESCE(v_row.last_study_date, v_today - 999);

  IF v_gap = 1 THEN
    -- Perfect continuation
    v_new_streak := v_row.current_streak + 1;
  ELSIF v_gap = 2 AND v_row.freezes_available > 0 AND v_row.current_streak >= 3 THEN
    -- Missed exactly one day with a real streak: consume the freeze
    v_new_streak := v_row.current_streak + 1;
    v_row.freezes_available := v_row.freezes_available - 1;
    v_row.last_freeze_used_on := v_today - 1;
  ELSE
    -- Streak broken (or brand-new cadence)
    v_new_streak := 1;
  END IF;

  UPDATE public.study_streaks
  SET current_streak = v_new_streak,
      longest_streak = GREATEST(longest_streak, v_new_streak),
      last_study_date = v_today,
      total_study_days = total_study_days + 1,
      freezes_available = v_row.freezes_available,
      freeze_last_replenished = v_row.freeze_last_replenished,
      last_freeze_used_on = v_row.last_freeze_used_on,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

COMMIT;
