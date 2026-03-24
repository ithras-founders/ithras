"""Unit tests for institution search tokenization and synonym expansion."""
import unittest

from shared.search.institution_query import (
    extract_query_tokens,
    fold_for_like,
    significant_tokens,
    slugify_query,
    variants_for_token,
)


class TestInstitutionQuery(unittest.TestCase):
    def test_significant_tokens_strips_institutional_noise(self):
        q = "Indian Institute of Management, Calcutta"
        sig = significant_tokens(q)
        self.assertIn("calcutta", sig)
        self.assertNotIn("institute", sig)
        self.assertNotIn("management", sig)
        self.assertNotIn("indian", sig)

    def test_significant_tokens_keeps_short_brand_tokens(self):
        self.assertEqual(significant_tokens("IIM"), ["iim"])
        self.assertIn("iim", significant_tokens("IIM Calcutta"))
        self.assertIn("calcutta", significant_tokens("IIM Calcutta"))

    def test_city_synonyms(self):
        self.assertIn("kolkata", variants_for_token("calcutta"))
        self.assertIn("calcutta", variants_for_token("kolkata"))
        self.assertIn("bengaluru", variants_for_token("bangalore"))

    def test_fold_for_like(self):
        self.assertEqual(fold_for_like("IIM  Calcutta"), "iim%calcutta")

    def test_slugify(self):
        self.assertTrue(slugify_query("Indian Institute of Management Calcutta").startswith("indian-institute"))

    def test_extract_query_tokens(self):
        self.assertEqual(extract_query_tokens("IIIT-H"), ["iiit", "h"])


if __name__ == "__main__":
    unittest.main()
