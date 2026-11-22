from sqlalchemy import select

from database import SessionLocal
from models import SiteSetting


CONTACT_EMAIL = "abdoamerz2005@gmail.com"


def set_contact_email():
    db = SessionLocal()

    try:
        setting = db.scalar(
            select(SiteSetting).where(
                SiteSetting.key == "contact_email"
            )
        )

        if setting:
            setting.value = CONTACT_EMAIL
        else:
            setting = SiteSetting(
                key="contact_email",
                value=CONTACT_EMAIL,
            )
            db.add(setting)

        db.commit()

        print("Contact email saved successfully!")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    set_contact_email()