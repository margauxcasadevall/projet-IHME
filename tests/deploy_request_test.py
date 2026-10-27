import json
import urllib.error
from io import BytesIO
import unittest
from unittest.mock import MagicMock, patch

from deploy.request import request_deployment


class DeploymentRequestTests(unittest.TestCase):
    def test_requires_secure_url_and_assigned_project(self):
        for url in (
            "http://deploy.example/__deploy/p01",
            "https://deploy.example/__deploy/p1",
            "https://user:pass@deploy.example/__deploy/p01",
        ):
            with self.subTest(url=url), self.assertRaises(ValueError):
                request_deployment(url, "deployment-token", "sha256:" + "a" * 64)

    def test_accepts_teacher_project_endpoint(self):
        response = MagicMock()
        response.status = 200
        response.read.return_value = b'{"project":"suivi","status":"healthy"}'
        response.__enter__.return_value = response
        opener = MagicMock()
        opener.open.return_value = response
        with patch("deploy.request.urllib.request.build_opener", return_value=opener):
            result = request_deployment(
                "https://deploy.example/__deploy/suivi",
                "deployment-token",
                "sha256:" + "a" * 64,
            )
        self.assertEqual(result["project"], "suivi")

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
        self.assertEqual(opener.open.call_args.kwargs["timeout"], 460)

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

    @patch("deploy.request.urllib.request.build_opener")
    def test_translates_http_error_code_without_exposing_credentials(self, build_opener):
        cases = (
            (
                {"error_code": "registry_auth"},
                "Connexion à GHCR refusée",
            ),
            (
                {"error_code": "unhealthy"},
                "L’application ne démarre pas",
            ),
            (
                {"error_code": "unknown"},
                "Échec HTTP 422",
            ),
        )
        for payload, expected_message in cases:
            with self.subTest(payload=payload):
                opener = MagicMock()
                opener.open.side_effect = urllib.error.HTTPError(
                    "https://deploy.example/__deploy/p03",
                    422,
                    "Unprocessable Entity",
                    {},
                    BytesIO(json.dumps(payload).encode()),
                )
                build_opener.return_value = opener
                with self.assertRaisesRegex(ValueError, expected_message) as raised:
                    request_deployment(
                        "https://deploy.example/__deploy/p03",
                        "private-deployment-token",
                        "sha256:" + "a" * 64,
                        "private-registry-token",
                    )
                self.assertNotIn("private-deployment-token", str(raised.exception))
                self.assertNotIn("private-registry-token", str(raised.exception))


if __name__ == "__main__":
    unittest.main()
