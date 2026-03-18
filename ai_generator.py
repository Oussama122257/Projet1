"""AI content generation using Claude, OpenAI, or Gemini."""

import json
from config import Config


def _build_prompt(profile: dict, posts: list[dict]) -> str:
    """Build the analysis/generation prompt from scraped data."""
    top_posts = sorted(posts, key=lambda p: p.get("like_count", 0), reverse=True)[:10]
    posts_summary = "\n".join(
        f"- \"{p['text'][:120]}...\" (likes: {p['like_count']}, replies: {p['reply_count']})"
        for p in top_posts
        if p.get("text")
    )

    return f"""Analyze this Threads profile and generate engaging content suggestions.

PROFILE:
- Username: @{profile.get('username')}
- Name: {profile.get('full_name')}
- Bio: {profile.get('bio')}
- Followers: {profile.get('followers')}
- Following: {profile.get('following')}

TOP POSTS BY ENGAGEMENT:
{posts_summary}

Based on this profile's style, tone, and audience, generate:
1. A brief analysis of the profile's content strategy (2-3 sentences)
2. 5 new thread post ideas that match their style and would drive engagement
3. For each idea, write the actual post text (under 500 characters)

Return the result as JSON with keys: "analysis", "post_ideas" (list of objects with "title" and "text").
"""


def generate_with_anthropic(profile: dict, posts: list[dict]) -> dict:
    """Generate content using Claude API."""
    import anthropic

    client = anthropic.Anthropic(api_key=Config.ANTHROPIC_API_KEY)
    prompt = _build_prompt(profile, posts)

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )

    text = message.content[0].text
    try:
        start = text.index("{")
        end = text.rindex("}") + 1
        return json.loads(text[start:end])
    except (ValueError, json.JSONDecodeError):
        return {"analysis": text, "post_ideas": []}


def generate_with_openai(profile: dict, posts: list[dict]) -> dict:
    """Generate content using OpenAI API."""
    from openai import OpenAI

    client = OpenAI(api_key=Config.OPENAI_API_KEY)
    prompt = _build_prompt(profile, posts)

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )

    text = response.choices[0].message.content
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"analysis": text, "post_ideas": []}


def generate_with_gemini(profile: dict, posts: list[dict]) -> dict:
    """Generate content using Google Gemini API."""
    from google import genai

    client = genai.Client(api_key=Config.GEMINI_API_KEY)
    prompt = _build_prompt(profile, posts)

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
    )

    text = response.text
    try:
        start = text.index("{")
        end = text.rindex("}") + 1
        return json.loads(text[start:end])
    except (ValueError, json.JSONDecodeError):
        return {"analysis": text, "post_ideas": []}


def generate_content(profile: dict, posts: list[dict], provider: str = None) -> dict:
    """Generate content using the configured AI provider."""
    provider = provider or Config.AI_PROVIDER

    generators = {
        "anthropic": generate_with_anthropic,
        "openai": generate_with_openai,
        "gemini": generate_with_gemini,
    }

    if provider not in generators:
        raise ValueError(f"Unknown AI provider: {provider}. Use: {list(generators.keys())}")

    print(f"[AI] Generating content with {provider}...")
    result = generators[provider](profile, posts)
    print(f"[AI] Generated {len(result.get('post_ideas', []))} post ideas")
    return result
