from datetime import datetime, timedelta

import pytz
from sqlalchemy.orm import Session

from app import models


def update_user_login_streak(db: Session, *, user: models.User) -> None:
    """
    Updates the user's login streak based on the current login time.
    This function should be called within a database transaction.
    """
    try:
        user_tz = pytz.timezone(user.timezone or "UTC")
    except pytz.UnknownTimeZoneError:
        user_tz = pytz.utc

    # Get the current date in the user's timezone
    utc_now = datetime.utcnow().replace(tzinfo=pytz.utc)
    user_now = utc_now.astimezone(user_tz)
    current_date = user_now.date()

    last_active = user.last_active_date

    # Do nothing if the user has already logged in today
    if last_active == current_date:
        return

    # If this is the first login or the streak was broken
    if last_active is None or current_date > last_active + timedelta(days=1):
        user.current_streak = 1
    # If the user logged in yesterday, increment the streak
    elif current_date == last_active + timedelta(days=1):
        user.current_streak += 1

    # Always update the last active date if it's a new login day
    user.last_active_date = current_date

    db.add(user)
    # The commit will be handled by the calling endpoint's dependency management
