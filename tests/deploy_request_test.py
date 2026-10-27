import json
import unittest
from unittest.mock import MagicMock, patch

from deploy.request import request_deployment


class DeploymentRequestTests(unittest.TestCase):
    def test_requires_secure_url_and_assigned_project(self):
        for url in (
            "http://deploy.example/__deploy/p01",
            "https://deploy.example/__deploy/suivi",
            "https://deploy.example/__deploy/p1",
            "https://user:pass@deploy.example/__deploy/p01",
        ):
            with self.subTest(url=url), self.assertRaises(ValueError):
                request_deployment(url, "deployment-token", "sha256:" + "a" * 64)

    def test_requires_token_and_sha256_digest(self):
        with self.assertRaises(ValueError):
            request_deployment(
                "https://deploy.example/__deploy/p01", "", "sha256:" + "a" * 64
            )
        with self.assertRaises(ValueError):
            request_deployment(
                "https://deploy.example/__deploy/p01", "token", "latest"
            )

    @patch("deploy.request.urllib.request.build_opener")
    def test_sends_digest_and_registry_token_without_redirecting(self, build_opener):
        result = {"project": "p01", "status": "healthy", "digest": "sha256:" + "a" * 64}
        response = MagicMock()
        response.status = 200
        response.read.return_value = json.dumps(result).encode()
        response.__enter__.return_value = response
        opener = MagicMock()
        opener.open.return_value = response
        build_opener.return_value = opener

        self.assertEqual(
            request_deployment(
                "https://deploy.example/__deploy/p01",
                "deployment-token",
                result["digest"],
                "registry-token",
            ),
            result,
        )
        request = opener.open.call_args.args[0]
        self.assertEqual(request.get_header("Authorization"), "Bearer deployment-token")
        self.assertEqual(
            json.loads(request.data),
            {"digest": result["digest"], "registry_token": "registry-token"},
        )
        self.assertEqual(opener.open.call_args.kwargs["timeout"], 440)

    @patch("deploy.request.urllib.request.build_opener")
    def test_rejects_non_healthy_or_invalid_response(self, build_opener):
        response = MagicMock()
        response.status = 200
        response.__enter__.return_value = response
        opener = MagicMock()
        opener.open.return_value = response
        build_opener.return_value = opener

        for body in (b'{"project":"p01","status":"failed"}', b"[]"):
            with self.subTest(body=body), self.assertRaises(ValueError):
                response.read.return_value = body
                request_deployment(
                    "https://deploy.example/__deploy/p01",
                    "deployment-token",
                    "sha256:" + "a" * 64,
                )


if __name__ == "__main__":
    unittest.main()
