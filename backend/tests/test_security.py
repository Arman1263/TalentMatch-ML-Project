from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)


def test_password_hashing():
    password = "TestPassword123!"

    hashed = hash_password(password)

    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("WrongPassword", hashed)


def test_jwt_token():
    user_id = "test-user-123"

    token = create_access_token(user_id)
    payload = decode_access_token(token)

    assert payload["sub"] == user_id
    assert "exp" in payload


if __name__ == "__main__":
    test_password_hashing()
    test_jwt_token()

    print("All security tests passed!")