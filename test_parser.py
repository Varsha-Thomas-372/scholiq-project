from syllabus_parser import parse_syllabus, is_valid_topic, detect_separator


def test_detect_separator_prefers_newline_over_parentheses_commas():
    body = (
        'Classical Encryption Techniques (Symmetric cipher model, Substitution techniques, '
        'Transposition techniques, Steganography)\n'
        'Modern Symmetric Ciphers: DES, AES\n'
        'Asymmetric Key Cryptography: RSA, Diffie-Hellman'
    )

    assert detect_separator(body) == 'newline'


def test_noise_like_table_rows_are_rejected():
    noise_line = 'Cs23632.1 3 3 1 2 0 0 1 0 0 3 2 2 2'
    assert not is_valid_topic(noise_line)

    footer_line = 'Average 3.0 2.4 1.8 1.8 2.0 2.0 - 2.0 1.5 1.0 - 3.0 1.4 1.4 2.0'
    assert not is_valid_topic(footer_line)

    correlation_line = 'Correlation Levels 1, 2 Or 3 Are As Defined Below'
    assert not is_valid_topic(correlation_line)


def test_parser_ignores_noisy_rows_and_extracts_good_topic():
    text = '''UNIT I: Sample Unit
Cs23632.1 3 3 1 2 0 0 1 0 0 3 2 2 2
Topic A: Basics
Topic B (Advanced ideas, Implementation)'''

    parsed = parse_syllabus(text)
    assert parsed['units'][0]['topics'][0]['name'] == 'Topic A'
    assert parsed['units'][0]['topics'][0]['subtopics'] == ['Basics']
    assert parsed['units'][0]['topics'][1]['name'] == 'Topic B'
    assert parsed['units'][0]['topics'][1]['subtopics'] == ['Advanced ideas', 'Implementation']
    assert all('Cs23632.1' not in topic['name'] for topic in parsed['units'][0]['topics'])


def test_parser_handles_newline_separated_topics():
    text = '''UNIT II BLOCK CIPHERS
Data Encryption Standard
Advanced Encryption Standard
Triple DES
RSA Algorithm'''

    parsed = parse_syllabus(text)
    topic_names = [topic['name'] for topic in parsed['units'][0]['topics']]
    assert topic_names == ['Data Encryption Standard', 'Advanced Encryption Standard', 'Triple DES', 'RSA Algorithm']


def test_parser_rejects_course_code_numeric_rows():
    text = '''UNIT I: Sample Unit
Cs23632.1 3 3 1 2 0 0 1 0 0 3 2 2 2
Correlation Levels 1, 2 Or 3 Are As Defined Below
Cryptographic Hash Functions (SHA-1, SHA-256)
'''

    parsed = parse_syllabus(text)
    assert len(parsed['units'][0]['topics']) == 1
    assert parsed['units'][0]['topics'][0]['name'] == 'Cryptographic Hash Functions'
    assert parsed['units'][0]['topics'][0]['subtopics'] == ['SHA-1', 'SHA-256']


if __name__ == '__main__':
    test_detect_separator_prefers_newline_over_parentheses_commas()
    test_noise_like_table_rows_are_rejected()
    test_parser_ignores_noisy_rows_and_extracts_good_topic()
    test_parser_handles_newline_separated_topics()
    print('All tests passed.')
