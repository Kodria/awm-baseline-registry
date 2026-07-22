#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Stdlib-only regression tests for core.py / design_system.py (unittest, not
pytest -- this project ships with zero external dependencies and the tests
shouldn't add one).

Run with:
    python -m unittest discover -s scripts/tests -v
or directly:
    python scripts/tests/test_core.py
"""

import os
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SCRIPTS_DIR))

import core
from core import BM25, detect_domain, search, search_stack, CSV_CONFIG, AVAILABLE_STACKS
from design_system import generate_design_system, persist_design_system, DesignSystemGenerator, hex_to_ansi


class TestTokenizer(unittest.TestCase):
    def test_short_domain_terms_are_kept(self):
        bm25 = BM25()
        tokens = bm25.tokenize("UI and UX design with 3D and AI")
        self.assertIn("ui", tokens)
        self.assertIn("3d", tokens)
        self.assertIn("ai", tokens)

    def test_stopwords_removed(self):
        bm25 = BM25()
        tokens = bm25.tokenize("this is for the team to do")
        for stopword in ("is", "for", "the", "to", "do"):
            self.assertNotIn(stopword, tokens)

    def test_synonym_normalization(self):
        bm25 = BM25()
        self.assertEqual(bm25.tokenize("e-commerce store"), bm25.tokenize("ecommerce store"))
        self.assertEqual(bm25.tokenize("dark-mode toggle"), bm25.tokenize("dark toggle"))


class TestSearchDomains(unittest.TestCase):
    """Known query -> expected top-domain sanity checks (not exact-row pinning,
    since data can grow; these assert the engine still finds *something*
    relevant for each domain's core vocabulary)."""

    def test_ui_is_searchable_in_style_domain(self):
        result = search("ui minimalism", domain="style", max_results=1)
        self.assertGreater(result["count"], 0, "literal 'ui' token must be searchable, not filtered by tokenizer")

    def test_accessibility_query_hits_ux(self):
        result = search("accessibility contrast wcag keyboard", domain="ux", max_results=3)
        self.assertGreater(result["count"], 0)

    def test_zero_result_query_reports_suggestions_not_error(self):
        result = search("zzqqxx totally made up gibberish", domain="ux", max_results=2)
        self.assertEqual(result["count"], 0)
        self.assertIn("suggestions", result)
        self.assertNotIn("error", result)

    def test_every_configured_domain_file_exists_and_is_searchable(self):
        for domain, config in CSV_CONFIG.items():
            with self.subTest(domain=domain):
                result = search("design", domain=domain, max_results=1)
                self.assertNotIn("error", result, f"domain '{domain}' failed: {result.get('error')}")

    def test_every_stack_file_exists_and_is_searchable(self):
        for stack in AVAILABLE_STACKS:
            with self.subTest(stack=stack):
                result = search_stack("performance", stack, max_results=1)
                self.assertNotIn("error", result, f"stack '{stack}' failed: {result.get('error')}")


class TestDomainDetection(unittest.TestCase):
    def test_style_keywords_route_to_style(self):
        self.assertEqual(detect_domain("glassmorphism dark ui"), "style")

    def test_accessibility_keywords_route_to_ux(self):
        self.assertEqual(detect_domain("accessibility contrast wcag"), "ux")

    def test_ambiguous_query_returns_runner_up(self):
        domain, runner_up = detect_domain("font pairing elegant crypto", return_scores=True)
        self.assertIsNotNone(domain)
        # runner_up may be None if the winning domain has no close second --
        # this just verifies the call shape works without raising.

    def test_empty_query_falls_back_to_style(self):
        self.assertEqual(detect_domain("...!!!???"), "style")


class TestPersistence(unittest.TestCase):
    def test_persist_then_skip_then_force(self):
        with tempfile.TemporaryDirectory() as tmp:
            result = generate_design_system("saas dashboard", "Test Project", persist=True, output_dir=tmp)
            self.assertEqual(result["persistence"]["status"], "success")
            master = Path(result["persistence"]["master_file"])
            self.assertTrue(master.exists())
            original_content = master.read_text(encoding="utf-8")

            # Second persist without force must not overwrite.
            result2 = generate_design_system("saas dashboard", "Test Project", persist=True, output_dir=tmp)
            self.assertEqual(result2["persistence"]["status"], "skipped_exists")
            self.assertEqual(master.read_text(encoding="utf-8"), original_content)

            # With force=True it must overwrite.
            result3 = generate_design_system("ecommerce luxury", "Test Project", persist=True, output_dir=tmp, force=True)
            self.assertEqual(result3["persistence"]["status"], "success")

    def test_persist_writes_only_under_output_dir(self):
        with tempfile.TemporaryDirectory() as tmp:
            generate_design_system("saas dashboard", "Scoped Project", persist=True, output_dir=tmp)
            expected = Path(tmp) / "design-system" / "scoped-project" / "MASTER.md"
            self.assertTrue(expected.exists())


class TestHexToAnsi(unittest.TestCase):
    """QA B2: malformed hex must fail soft (empty string), never raise."""

    def setUp(self):
        self._prev_colorterm = os.environ.get("COLORTERM")
        os.environ["COLORTERM"] = "truecolor"

    def tearDown(self):
        if self._prev_colorterm is None:
            os.environ.pop("COLORTERM", None)
        else:
            os.environ["COLORTERM"] = self._prev_colorterm

    def test_valid_hex_produces_ansi_swatch(self):
        self.assertTrue(hex_to_ansi("#2563EB").startswith("\033[38;2;"))

    def test_non_hex_digits_do_not_raise(self):
        # Reviewer repro: '#GGGGGG' used to raise ValueError from int(..., 16).
        self.assertEqual(hex_to_ansi("#GGGGGG"), "")

    def test_wrong_length_does_not_raise(self):
        self.assertEqual(hex_to_ansi("#ABC"), "")

    def test_empty_string_does_not_raise(self):
        self.assertEqual(hex_to_ansi(""), "")


class TestMalformedCsvRows(unittest.TestCase):
    """QA B7: csv.DictReader maps a short/malformed row's missing trailing
    fields to None (key present, value None), not to a missing key -- so
    row.get(col, "")'s default never triggers and str(None) used to leak the
    literal token "none" into the BM25 search corpus."""

    def test_short_row_does_not_leak_none_token_into_corpus(self):
        with tempfile.TemporaryDirectory() as tmp:
            csv_path = Path(tmp) / "malformed.csv"
            csv_path.write_text(
                "Category,Keywords,Description\n"
                "Buttons,rounded,Nice buttons\n"
                "Cards\n",  # short row: DictReader sets Keywords/Description to None
                encoding="utf-8",
            )

            data = core._load_csv(csv_path)
            # Sanity check on the DictReader behavior this test relies on.
            self.assertIsNone(data[1]["Keywords"])
            self.assertIsNone(data[1]["Description"])

            bm25 = core._get_bm25(csv_path, ["Category", "Keywords", "Description"], data)
            self.assertNotIn("none", bm25.vocabulary())


class TestReasoningMatch(unittest.TestCase):
    def test_known_category_matches_exactly(self):
        gen = DesignSystemGenerator()
        rule = gen._find_reasoning_rule("SaaS (General)")
        self.assertTrue(rule, "exact-match category lookup should not fall through to fuzzy matching")

    def test_unknown_category_falls_back_gracefully(self):
        gen = DesignSystemGenerator()
        rule = gen._find_reasoning_rule("Totally Unknown Category XYZ")
        # Should not raise; may return {} which _apply_reasoning handles with defaults.
        self.assertIsInstance(rule, dict)


if __name__ == "__main__":
    unittest.main()
