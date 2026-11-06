
from getpass import getpass

from sqlalchemy import select
from pwdlib import PasswordHash

from database import SessionLocal
from models import AdminUser


password_hash = PasswordHash.recommended()


def change_admin():
    with SessionLocal() as db:
        # Find the existing administrator
        admin = db.scalar(
            select(AdminUser).limit(1)
        )

        if admin is None:
            print("No administrator account found.")
            return

        # Verify current password
        current_password = getpass(
            "Enter current administrator password: "
        )

        if not password_hash.verify(
            current_password,
            admin.password_hash
        ):
            print("Incorrect current password.")
            return

        print("Current password verified successfully!")
        print(f"Current username: {admin.username}")

        # Change username
        new_username = input(
            "Enter new username (leave blank to keep current): "
        ).strip()

        if new_username:
            existing_admin = db.scalar(
                select(AdminUser).where(
                    AdminUser.username == new_username,
                    AdminUser.id != admin.id
                )
            )

            if existing_admin:
                print("This username is already in use.")
                return

            admin.username = new_username

        # Change password
        new_password = getpass(
            "Enter new password (leave blank to keep current): "
        )

        if new_password:
            if len(new_password) < 12:
                print("Password must contain at least 12 characters.")
                return

            confirm_password = getpass(
                "Confirm new password: "
            )

            if new_password != confirm_password:
                print("Passwords do not match.")
                return

            admin.password_hash = password_hash.hash(
                new_password
            )

        if not new_username and not new_password:
            print("No changes requested.")
            return

        # Invalidate all previously issued sessions
        admin.session_version += 1

        db.commit()

        print("Administrator account updated successfully!")


if __name__ == "__main__":
    change_admin()
