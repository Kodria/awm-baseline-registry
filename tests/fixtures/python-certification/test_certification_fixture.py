def greeting(name: str) -> str:
    return f"hello {name}"


def test_greeting() -> None:
    assert greeting("AWM") == "hello AWM"
