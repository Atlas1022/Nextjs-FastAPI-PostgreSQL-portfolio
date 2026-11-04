
from getpass import getpass

from sqlalchemy import select
from pwdlib import PasswordHash

from database import SessionLocal
from models import AdminUser


password_hash = PasswordHash.recommended()


def create_admin():
    with SessionLocal() as db:
        # Check whether an administrator already exists
        existing_admin = db.scalar(
            select(AdminUser.id).limit(1)
        )

        if existing_admin is not None:
            print("An administrator account already exists.")
            return

        username = input("Enter administrator username: ").strip()

        if not username:
            print("Username cannot be empty.")
            return

        password = getpass("Enter administrator password: ")
        confirm_password = getpass("Confirm administrator password: ")

        if password != confirm_password:
            print("Passwords do not match.")
            return

        if len(password) < 12:
            print("Password must contain at least 12 characters.")
            return

        hashed_password = password_hash.hash(password)

        admin = AdminUser(
            username=username,
            password_hash=hashed_password,
            is_active=True,
        )

        db.add(admin)
        db.commit()

        print("Administrator account created successfully!")


if __name__ == "__main__":
    create_admin()
