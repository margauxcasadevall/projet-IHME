#!/usr/bin/env python3
"""Send a digest-pinned image to the course deployment service."""

import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request


def request_deployment(url, token, digest, registry_token=""):
    address = urllib.parse.urlsplit(url)
    if (
        address.scheme != "https"
        or not address.hostname
        or address.username
        or address.password
        or address.query
        or address.fragment
        or not re.fullmatch(r"/__deploy/p[0-9]{2}", address.path)
    ):
        raise ValueError("URL HTTPS de déploiement invalide.")
    if not token or not re.fullmatch(r"sha256:[a-f0-9]{64}", digest):
        raise ValueError("Jeton privé et digest SHA-256 requis.")
    if registry_token and not re.fullmatch(r"[\x21-\x7e]{1,2048}", registry_token):
        raise ValueError("Jeton temporaire du registre invalide.")

    body = {"digest": digest}
    if registry_token:
        body["registry_token"] = registry_token
    request = urllib.request.Request(
        url,
        data=json.dumps(body).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token,
        },
    )

    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *args):
            return None

    with urllib.request.build_opener(NoRedirect()).open(
        request, timeout=440
    ) as response:
        result = json.load(response)
        if (
            response.status != 200
            or not isinstance(result, dict)
            or result.get("status") != "healthy"
        ):
            raise ValueError("Déploiement refusé ou version non saine.")
        return result


if __name__ == "__main__":
    try:
        result = request_deployment(
            os.environ.get("DEPLOY_URL", ""),
            os.environ.get("DEPLOY_TOKEN", ""),
            os.environ.get("DIGEST", ""),
            os.environ.get("REGISTRY_TOKEN", ""),
        )
        print("Déploiement vérifié : " + result["project"] + " @ " + result["digest"])
    except (ValueError, OSError, urllib.error.URLError) as error:
        print("Déploiement refusé ou indisponible : " + str(error), file=sys.stderr)
        sys.exit(1)
