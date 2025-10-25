from datetime import date

from freezegun import freeze_time
from sqlalchemy.orm import Session

from app.services.streak_service import update_user_login_streak
from tests.utils.user import create_random_user


def test_initial_login_updates_streak(db: Session) -> None:
    user = create_random_user(db)
    assert user.current_streak == 0
    assert user.last_active_date is None

    with freeze_time("2023-01-01 12:00:00"):
        update_user_login_streak(db, user=user)
        db.commit()
        db.refresh(user)

    assert user.current_streak == 1
    assert user.last_active_date == date(2023, 1, 1)


def test_same_day_login_does_not_change_streak(db: Session) -> None:
    user = create_random_user(db)
    user.current_streak = 1
    user.last_active_date = date(2023, 1, 1)
    db.add(user)
    db.commit()

    with freeze_time("2023-01-01 18:00:00"):
        update_user_login_streak(db, user=user)
        db.commit()
        db.refresh(user)

    assert user.current_streak == 1
    assert user.last_active_date == date(2023, 1, 1)


def test_consecutive_day_login_increments_streak(db: Session) -> None:
    user = create_random_user(db)
    user.current_streak = 1
    user.last_active_date = date(2023, 1, 1)
    db.add(user)
    db.commit()

    with freeze_time("2023-01-02 08:00:00"):
        update_user_login_streak(db, user=user)
        db.commit()
        db.refresh(user)

    assert user.current_streak == 2
    assert user.last_active_date == date(2023, 1, 2)


def test_broken_streak_resets_to_one(db: Session) -> None:
    user = create_random_user(db)
    user.current_streak = 5
    user.last_active_date = date(2023, 1, 1)
    db.add(user)
    db.commit()

    # Login after skipping a day
    with freeze_time("2023-01-03 10:00:00"):
        update_user_login_streak(db, user=user)
        db.commit()
        db.refresh(user)

    assert user.current_streak == 1
    assert user.last_active_date == date(2023, 1, 3)


def test_timezone_edge_case_los_angeles(db: Session) -> None:
    """
    Test user in America/Los_Angeles (UTC-8 in winter).
    A login just after midnight local time should count for the new day.
    """
    user = create_random_user(db)
    user.timezone = "America/Los_Angeles"
    user.current_streak = 3
    user.last_active_date = date(2023, 1, 10)  # Last login was Jan 10th LA time
    db.add(user)
    db.commit()

    # Time is 00:30 on Jan 11th in LA, which is 08:30 UTC on Jan 11th.
    with freeze_time("2023-01-11 08:30:00"):
        update_user_login_streak(db, user=user)
        db.commit()
        db.refresh(user)

    # Streak should increment because it's a new day in the user's timezone
    assert user.current_streak == 4
    assert user.last_active_date == date(2023, 1, 11)


def test_timezone_edge_case_kolkata(db: Session) -> None:
    """
    Test user in Asia/Kolkata (UTC+5:30).
    A login just after midnight local time should count for the new day.
    """
    user = create_random_user(db)
    user.timezone = "Asia/Kolkata"
    user.current_streak = 2
    user.last_active_date = date(2023, 1, 15)  # Last login was Jan 15th IST
    db.add(user)
    db.commit()

    # Time is 00:30 on Jan 16th in Kolkata, which is 19:00 UTC on Jan 15th.
    with freeze_time("2023-01-15 19:00:00"):
        update_user_login_streak(db, user=user)
        db.commit()
        db.refresh(user)

    # Streak should increment because it's a new day in the user's timezone
    assert user.current_streak == 3
    assert user.last_active_date == date(2023, 1, 16)
