"""Export scraped data and AI results to CSV."""

import os
from datetime import datetime
import pandas as pd
from config import Config


class CSVExporter:
    def __init__(self):
        self.output_dir = Config.CSV_OUTPUT_DIR
        os.makedirs(self.output_dir, exist_ok=True)

    def _timestamp(self) -> str:
        return datetime.now().strftime("%Y%m%d_%H%M%S")

    def export_profile(self, profile: dict) -> str:
        """Export profile info to CSV."""
        filepath = os.path.join(
            self.output_dir, f"profile_{profile['username']}_{self._timestamp()}.csv"
        )
        df = pd.DataFrame([profile])
        df.to_csv(filepath, index=False)
        print(f"[Export] Profile saved to {filepath}")
        return filepath

    def export_posts(self, posts: list[dict], username: str) -> str:
        """Export posts data to CSV."""
        filepath = os.path.join(
            self.output_dir, f"posts_{username}_{self._timestamp()}.csv"
        )
        df = pd.DataFrame(posts)
        df.to_csv(filepath, index=False)
        print(f"[Export] {len(posts)} posts saved to {filepath}")
        return filepath

    def export_ai_results(self, ai_result: dict, username: str) -> str:
        """Export AI-generated content to CSV."""
        filepath = os.path.join(
            self.output_dir, f"ai_content_{username}_{self._timestamp()}.csv"
        )
        rows = []
        for idea in ai_result.get("post_ideas", []):
            rows.append({
                "title": idea.get("title", ""),
                "text": idea.get("text", ""),
                "analysis": ai_result.get("analysis", ""),
            })
        if not rows:
            rows = [{"analysis": ai_result.get("analysis", ""), "title": "", "text": ""}]
        df = pd.DataFrame(rows)
        df.to_csv(filepath, index=False)
        print(f"[Export] AI content saved to {filepath}")
        return filepath

    def export_all(self, scraped_data: dict, ai_result: dict) -> list[str]:
        """Export everything and return list of file paths."""
        username = scraped_data["profile"]["username"]
        files = [
            self.export_profile(scraped_data["profile"]),
            self.export_posts(scraped_data["posts"], username),
            self.export_ai_results(ai_result, username),
        ]
        return files
