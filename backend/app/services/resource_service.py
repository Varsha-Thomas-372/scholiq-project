from urllib.parse import urlencode

import requests

from app.config import get_settings
from app.models.schemas import ResourceArticle, ResourceResponse, ResourceVideo


def _format_iso8601_duration(duration: str) -> str:
    value = duration.replace("PT", "")
    hours = 0
    minutes = 0
    seconds = 0
    if "H" in value:
        hours, value = value.split("H", 1)
        hours = int(hours)
    if "M" in value:
        minutes, value = value.split("M", 1)
        minutes = int(minutes)
    if "S" in value:
        seconds = int(value.replace("S", ""))
    if hours:
        return f"{hours}h {minutes}m"
    if minutes:
        return f"{minutes}m {seconds}s" if seconds else f"{minutes}m"
    return f"{seconds}s"


def _is_relevant_article(title: str, snippet: str, topic: str) -> bool:
    """Filter out irrelevant Medium articles."""
    topic_lower = topic.lower()
    title_lower = title.lower()
    snippet_lower = snippet.lower()
    
    # Check if title or snippet contains the topic
    if topic_lower in title_lower or topic_lower in snippet_lower:
        return True
    
    # Blacklist low-quality patterns
    junk_keywords = ["advertisement", "sponsored", "promo", "how to make money", "clickbait", "fake", "scam"]
    if any(keyword in title_lower for keyword in junk_keywords):
        return False
    
    # Must have meaningful content and not be too generic
    if len(snippet) < 50 or "contact us" in snippet_lower:
        return False
    
    return True


def fetch_topic_resources(topic: str) -> ResourceResponse:
    settings = get_settings()
    videos: list[ResourceVideo] = []
    articles: list[ResourceArticle] = []

    if settings.youtube_api_key:
        search_params = {
            "part": "snippet",
            "maxResults": 8,
            "q": f"{topic} full explanation",
            "type": "video",
            "videoEmbeddable": "true",
            "key": settings.youtube_api_key,
        }
        search_res = requests.get("https://www.googleapis.com/youtube/v3/search", params=search_params, timeout=20)
        if search_res.ok:
            items = search_res.json().get("items", [])
            ids = [item["id"]["videoId"] for item in items if item.get("id", {}).get("videoId")]
            details_map = {}
            if ids:
                detail_res = requests.get(
                    "https://www.googleapis.com/youtube/v3/videos",
                    params={"part": "contentDetails", "id": ",".join(ids), "key": settings.youtube_api_key},
                    timeout=20,
                )
                if detail_res.ok:
                    details_map = {item["id"]: item for item in detail_res.json().get("items", [])}
            for item in items[:8]:
                video_id = item.get("id", {}).get("videoId")
                if not video_id:
                    continue
                details = details_map.get(video_id, {})
                duration = _format_iso8601_duration(details.get("contentDetails", {}).get("duration", "PT0S"))
                videos.append(
                    ResourceVideo(
                        title=item.get("snippet", {}).get("title", "Untitled"),
                        channel=item.get("snippet", {}).get("channelTitle", "Unknown"),
                        duration=duration,
                        thumbnail=item.get("snippet", {}).get("thumbnails", {}).get("high", {}).get("url", ""),
                        url=f"https://www.youtube.com/watch?v={video_id}",
                    )
                )

    if settings.serpapi_key:
        query = f"site:medium.com {topic} tutorial"
        serp_url = f"https://serpapi.com/search.json?{urlencode({'engine': 'google', 'q': query, 'api_key': settings.serpapi_key})}"
        serp_res = requests.get(serp_url, timeout=20)
        if serp_res.ok:
            for item in serp_res.json().get("organic_results", []):
                link = item.get("link", "")
                if "medium.com" not in link:
                    continue
                title = item.get("title", "Medium article")
                source = item.get("source", "Medium")
                snippet = item.get("snippet", "")
                
                # Filter for relevance before adding
                if not _is_relevant_article(title, snippet, topic):
                    continue
                
                words = max(300, len(snippet.split()) * 70)
                read_time = f"{max(2, round(words / 200))} min read"
                articles.append(ResourceArticle(title=title, author=source, read_time=read_time, url=link))
                if len(articles) == 5:
                    break

    return ResourceResponse(topic=topic, videos=videos, articles=articles)
