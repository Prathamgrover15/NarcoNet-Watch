
import unittest
from app import app

class ApiTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_health(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)

    def test_accounts(self):
        response = self.client.get("/api/accounts")
        self.assertEqual(response.status_code, 200)
        self.assertIn("accounts", response.get_json())

    def test_analyze(self):
        response = self.client.post(
            "/api/analyze",
            json={"text": "sample_codeword delivery"}
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("risk", response.get_json())

if __name__ == "__main__":
    unittest.main()
