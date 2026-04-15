import re
from typing import Dict, List


def detect_separator(unit_body: str) -> str:
    """
    Detects the dominant separator in the unit body text.
    Returns one of: "dash", "newline", "comma", "numbered", "bullet"
    """
    # Clean the text for analysis, but preserve parentheses content
    cleaned = re.sub(r'\s+', ' ', unit_body.strip())

    # Count occurrences of each separator pattern, excluding those inside parentheses
    def count_outside_parens(pattern):
        no_parens = re.sub(r'\([^)]*\)', '', cleaned)
        return len(re.findall(pattern, no_parens))

    dash_count = count_outside_parens(r'[-–—]')
    comma_count = count_outside_parens(r',')
    numbered_count = len(re.findall(r'(?:^|\n)\s*\d+\.\s+', re.sub(r'\([^)]*\)', '', cleaned)))
    bullet_count = count_outside_parens(r'[•·◦]')

    newline_count = unit_body.count('\n')

    counts = {
        'dash': dash_count,
        'comma': comma_count,
        'numbered': numbered_count,
        'bullet': bullet_count,
        'newline': newline_count
    }

    if max(counts.values()) == 0:
        return 'newline'

    max_count = max(counts.values())
    candidates = [k for k, v in counts.items() if v == max_count]
    if len(candidates) > 1:
        preference_order = ['newline', 'dash', 'comma', 'numbered', 'bullet']
        for pref in preference_order:
            if pref in candidates:
                return pref

    return max(counts, key=counts.get)


def parse_syllabus(text: str) -> Dict:
    course_name = extract_course_name(text)
    course_code = extract_course_code(text)
    semester = extract_semester(text)

    unit_pattern = r'(UNIT[\s\-–:]*(?:[IVX]+|\d+)|MODULE[\s\-–:]*(?:[IVX]+|\d+))'
    units_text = re.split(unit_pattern, text, flags=re.IGNORECASE)

    units = []
    for i in range(1, len(units_text), 2):
        header = units_text[i].strip()
        body = units_text[i+1] if i+1 < len(units_text) else ""

        try:
            unit_data = parse_unit(header, body)
            if unit_data:
                units.append(unit_data)
        except Exception as e:
            print(f"Warning: Failed to parse unit '{header}': {e}")

    return {
        "course_name": course_name,
        "course_code": course_code,
        "semester": semester,
        "units": units
    }


def extract_course_name(text: str) -> str:
    lines = text.split('\n')
    for line in lines[:10]:
        line = line.strip()
        if re.search(r'[A-Z]{2,3}\d{4,6}', line):
            parts = re.split(r'([A-Z]{2,3}\d{4,6})', line)
            for part in parts:
                part = part.strip()
                if part and not re.match(r'[A-Z]{2,3}\d{4,6}', part) and len(part) > 5:
                    return part
        elif len(line) > 10 and not re.match(r'^(UNIT|MODULE)', line, re.IGNORECASE):
            return line
    return None


def extract_course_code(text: str) -> str:
    match = re.search(r'[A-Z]{2,3}\d{4,6}', text)
    return match.group(0) if match else None


def extract_semester(text: str) -> str:
    match = re.search(r'(?:Semester|Sem)\s*(\w+|\d+)', text, re.IGNORECASE)
    if match:
        return match.group(1)
    match = re.search(r'\b(VI|VII|VIII|6|7|8)\b', text)
    return match.group(0) if match else None


def parse_unit(header: str, body: str) -> Dict:
    match = re.match(r'(UNIT|MODULE)[\s\-–:]*(?:([IVX]+)|(\d+))[\s\-–:]*(.*)', header, re.IGNORECASE)
    if not match:
        return None

    unit_type, roman, number, name = match.groups()
    unit_number = roman_to_int(roman) if roman else int(number) if number else 1
    unit_name = name.strip() if name and name.strip() else "Unknown"
    unit_name = re.sub(r'^[\s:\-–]+', '', unit_name)

    if unit_name == "Unknown" or not unit_name:
        body_lines = body.strip().split('\n')
        if body_lines:
            first_line = body_lines[0].strip()
            if len(first_line) > 5 and not re.match(r'^\d', first_line):
                unit_name = first_line
                body = '\n'.join(body_lines[1:])

    stop_patterns = [
        r'Contact\s*Hours?', r'L\s*T\s*P\s*C', r'List\s*of\s*(Experiments|Practicals)',
        r'Text\s*Books?', r'Reference\s*Books?', r'Course\s*Outcomes?', r'CO\s*-',
        r'PO/PSO', r'Objectives', r'Prerequisites', r'^\d+$', r'^Hours?$', r'^Total$'
    ]
    for pattern in stop_patterns:
        body = re.split(pattern, body, flags=re.IGNORECASE)[0]

    separator = detect_separator(body)
    topic_strings = split_topics(body, separator)

    topics = []
    for t in topic_strings:
        if is_valid_topic(t):
            cleaned = clean_topic(t)
            if cleaned["name"]:
                topics.append(cleaned)

    confidence = calculate_confidence(body, topics)
    if confidence < 0.7:
        print(f"Warning: Low confidence ({confidence:.2f}) for unit '{unit_name}'")

    return {
        "unit_number": unit_number,
        "unit_name": unit_name,
        "topics": topics,
        "confidence": confidence
    }


def roman_to_int(roman: str) -> int:
    roman_values = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100}
    total = 0
    prev = 0
    for char in reversed(roman.upper()):
        val = roman_values.get(char, 0)
        if val < prev:
            total -= val
        else:
            total += val
        prev = val
    return total


def split_topics(body: str, separator: str) -> List[str]:
    if separator == 'newline':
        return [line.strip() for line in body.split('\n') if line.strip()]
    elif separator == 'dash':
        topics = []
        current_topic = ""
        paren_depth = 0
        for char in body:
            if char == '(':
                paren_depth += 1
            elif char == ')':
                paren_depth -= 1
            elif paren_depth == 0 and char in '-–—':
                if current_topic.strip():
                    topics.append(current_topic.strip())
                current_topic = ""
                continue
            current_topic += char
        if current_topic.strip():
            topics.append(current_topic.strip())
        if len(topics) == 1 and ',' in body:
            topics = [t.strip() for t in body.split(',') if t.strip()]
        return topics if topics else [body.strip()]
    elif separator == 'comma':
        return [t.strip() for t in body.split(',') if t.strip()]
    elif separator == 'numbered':
        if not re.search(r'(?:^|\n)\s*\d+\.\s+', body):
            return [body.strip()]
        topics = re.split(r'(?:^|\n)\s*\d+\.\s+', body)
        return [t.strip() for t in topics if t.strip()]
    elif separator == 'bullet':
        topics = re.split(r'[•·◦]', body)
        return [t.strip() for t in topics if t.strip()]
    else:
        return [body.strip()]


def looks_like_table_row(topic: str) -> bool:
    topic = topic.strip()
    if not topic:
        return True

    numeric_tokens = re.findall(r'\d+(?:\.\d+)?', topic)
    alpha_tokens = re.findall(r'[A-Za-z]{2,}', topic)
    if len(numeric_tokens) >= 4 and len(alpha_tokens) <= 3:
        return True

    if re.search(r'\bAverage\b', topic, re.IGNORECASE) and len(numeric_tokens) >= 3:
        return True

    if re.search(r'\b(Correlation Levels?|Hours?|Credits?)\b', topic, re.IGNORECASE) and len(numeric_tokens) >= 2:
        return True

    if re.match(r'^[A-Za-z]{2,4}\d{4,6}(?:\.\d+)?(?:\s+\d+){2,}$', topic):
        return True

    total_tokens = topic.split()
    digit_tokens = [t for t in total_tokens if re.fullmatch(r'\d+(?:\.\d+)?', t)]
    if len(total_tokens) >= 4 and len(digit_tokens) >= 3 and len(digit_tokens) / len(total_tokens) >= 0.6:
        return True

    return False


def is_valid_topic(topic: str) -> bool:
    topic = topic.strip()
    if len(topic) < 5:
        return False
    if re.match(r'^\d+$', topic):
        return False
    if topic.lower() in ['contact', 'hours', 'total', 'note']:
        return False
    if re.match(r'^\d+\.\s*(Install|Perform|Demonstrate|Configure)', topic, re.IGNORECASE):
        return False
    if topic.lower() == 'case study':
        return False
    if looks_like_table_row(topic):
        return False
    return True


def clean_topic(topic: str) -> Dict[str, any]:
    topic = re.sub(r'^[A-Za-z]{2,4}\d{4,6}(?:\.\d+)?\s*', '', topic)
    topic = re.sub(r'^[-–—•·◦\d\.\s]+', '', topic)
    topic = re.sub(r'[-–—\s]+$', '', topic)
    topic = re.sub(r'\s+\d+$', '', topic)
    name, subtopics = extract_topic_and_subtopics(topic)
    words = name.split()
    cleaned_words = []
    for word in words:
        if word.isupper() and len(word) <= 5:
            cleaned_words.append(word)
        else:
            cleaned_words.append(word.capitalize())
    name = ' '.join(cleaned_words)
    if len(name) > 120:
        name = name[:120] + '...'
    return {
        "name": name,
        "subtopics": subtopics
    }


def extract_topic_and_subtopics(line: str) -> tuple[str, list[str]]:
    line = line.strip()
    if '(' in line and ')' in line:
        paren_start = line.find('(')
        paren_end = line.rfind(')')
        if paren_start < paren_end:
            topic_name = line[:paren_start].strip()
            subtopic_text = line[paren_start+1:paren_end]
            subtopics = _split_subtopics(subtopic_text)
            return (topic_name, subtopics)
    if ":" in line:
        parts = [part.strip() for part in line.split(":", 1) if part.strip()]
        topic_name = parts[0]
        subtopics = _split_subtopics(parts[1]) if len(parts) > 1 else []
        return (topic_name, subtopics)
    return (line, [])


def _split_subtopics(subtopic_text: str) -> list[str]:
    subtopics = re.split(r'[;,]|(?:\s+and\s+)', subtopic_text)
    subtopics = [s.strip() for s in subtopics if s.strip()]
    cleaned = []
    for sub in subtopics:
        sub = re.sub(r'^[-–—•·◦\d\.\s]+', '', sub)
        sub = re.sub(r'[-–—\s]+$', '', sub)
        if len(sub) >= 3:
            cleaned.append(sub)
    return cleaned


def calculate_confidence(body: str, topics: List[Dict[str, any]]) -> float:
    if not topics:
        return 0.0
    avg_topic_length = sum(len(t['name']) for t in topics) / len(topics)
    if avg_topic_length < 10:
        return 0.5
    if len(topics) < 3:
        return 0.6
    return 0.9
