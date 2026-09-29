"""Canonical form of an email address, per provider (#282).

Two addresses that differ only by an alias land in the same inbox, so for
referral purposes they are the same person. The rules are provider-specific:
Gmail ignores dots and everything after a `+`, most other large providers
ignore only the `+` tag, and plenty of domains ignore neither. Applying
Gmail's rule everywhere would merge unrelated accounts, so canonicalisation is
opt-in by domain and anything unknown is left untouched.

This is only used to decide whether two accounts belong to one person. Login
and account lookup still use the address exactly as the user typed it.
"""

# Domains that are just another name for the same service.
_DOMAIN_ALIASES = {
    "googlemail.com": "gmail.com",
}

# Providers that deliver `user+tag@` to `user@`.
_PLUS_TAG_DOMAINS = {
    "gmail.com",
    "icloud.com",
    "me.com",
    "mac.com",
    "protonmail.com",
    "proton.me",
    "pm.me",
    "fastmail.com",
    "zoho.com",
}

# Microsoft and Yandex run the same mailboxes under dozens of country domains
# (hotmail.com.ar, outlook.es, live.com.ar…), so match on the provider label
# rather than listing them.
_PLUS_TAG_PROVIDERS = {"hotmail", "outlook", "live", "msn", "yandex", "gmx"}

# Providers that also ignore dots in the local part. Gmail only — Outlook and
# the rest treat `a.b@` and `ab@` as different mailboxes.
_DOT_INSENSITIVE_DOMAINS = {"gmail.com"}


def _ignores_plus_tag(domain: str) -> bool:
    return domain in _PLUS_TAG_DOMAINS or domain.split(".")[0] in _PLUS_TAG_PROVIDERS


def canonical_email(email: str) -> str:
    """Return the address stripped of provider-specific aliasing.

    `user+tag@gmail.com` and `u.ser@gmail.com` both collapse to
    `user@gmail.com`; `user+tag@example.com` is returned unchanged, because
    that domain may well route it to a different person.
    """
    if not email:
        return ""

    normalized = email.strip().lower()
    local, at, domain = normalized.rpartition("@")
    if not at or not local:
        return normalized

    domain = _DOMAIN_ALIASES.get(domain, domain)
    if _ignores_plus_tag(domain):
        local = local.split("+", 1)[0]
    if domain in _DOT_INSENSITIVE_DOMAINS:
        local = local.replace(".", "")

    # An address that is nothing but a tag (`+tag@gmail.com`) has no canonical
    # form to speak of; keep it as typed rather than collapsing every such
    # address onto the same key.
    if not local:
        return normalized

    return f"{local}@{domain}"
