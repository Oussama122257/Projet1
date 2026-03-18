"""AI content generation service."""

import json


def _build_prompt(profile: dict, posts: list[dict]) -> str:
    top_posts = sorted(posts, key=lambda p: p.get("like_count", 0), reverse=True)[:10]
    posts_summary = "\n".join(
        f"- \"{p['text'][:120]}\" (likes: {p['like_count']}, replies: {p['reply_count']})"
        for p in top_posts if p.get("text")
    )
    return f"""Analyze this Threads profile and generate engaging content suggestions.

PROFILE:
- Username: @{profile.get('username')}
- Name: {profile.get('full_name')}
- Bio: {profile.get('bio')}
- Followers: {profile.get('followers')}

TOP POSTS BY ENGAGEMENT:
{posts_summary}

Based on this profile's style, tone, and audience, generate:
1. A brief analysis of the profile's content strategy (2-3 sentences)
2. 5 new thread post ideas that match their style
3. For each idea, write the actual post text (under 500 characters)

Return JSON with keys: "analysis" (string), "post_ideas" (list of {{"title": "...", "text": "..."}}).
"""


def _parse_json(text: str) -> dict:
    try:
        start = text.index("{")
        end = text.rindex("}") + 1
        return json.loads(text[start:end])
    except (ValueError, json.JSONDecodeError):
        return {"analysis": text, "post_ideas": []}


async def generate_with_anthropic(api_key: str, profile: dict, posts: list) -> dict:
    import anthropic
    client = anthropic.Anthropic(api_key=api_key)
    msg = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        messages=[{"role": "user", "content": _build_prompt(profile, posts)}],
    )
    return _parse_json(msg.content[0].text)


async def generate_with_openai(api_key: str, profile: dict, posts: list) -> dict:
    from openai import OpenAI
    client = OpenAI(api_key=api_key)
    resp = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": _build_prompt(profile, posts)}],
        response_format={"type": "json_object"},
    )
    try:
        return json.loads(resp.choices[0].message.content)
    except json.JSONDecodeError:
        return _parse_json(resp.choices[0].message.content)


async def generate_with_gemini(api_key: str, profile: dict, posts: list) -> dict:
    from google import genai
    client = genai.Client(api_key=api_key)
    resp = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=_build_prompt(profile, posts),
    )
    return _parse_json(resp.text)


async def generate_content(provider: str, api_key: str, profile: dict, posts: list) -> dict:
    generators = {
        "anthropic": generate_with_anthropic,
        "openai": generate_with_openai,
        "gemini": generate_with_gemini,
    }
    if provider not in generators:
        raise ValueError(f"Unknown provider: {provider}")
    return await generators[provider](api_key, profile, posts)
