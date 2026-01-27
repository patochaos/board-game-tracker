#!/usr/bin/env python3
"""
VTES Guess the Card - Data Generator
Generates card difficulty data based on TWDA (Tournament Winning Deck Archive) popularity.

Difficulty Levels:
- Level 1 (Tutorial/Staple): Top 1% most played cards
- Level 2 (Easy): Top 2-20% most played cards
- Level 3 (Medium): Top 21-60% most played cards
- Level 4 (Hard): Cards appearing in < 5 decks
- Level 5 (Impossible): Cards with ZERO TWDA appearances

Usage:
    pip install krcg
    python generate_vtes_guess_data.py
"""

import json
from collections import Counter
from krcg import twda, vtes


def load_data():
    """Load TWDA and VTES card database."""
    print("Loading VTES card database...")
    vtes.VTES.load()

    print("Loading TWDA (full history since 1995)...")
    twda.TWDA.load()

    print(f"Loaded {len(vtes.VTES)} cards")
    print(f"Loaded {len(twda.TWDA)} tournament winning decks")

    return vtes.VTES, twda.TWDA


def count_card_occurrences(twda_data):
    """
    Count how many times each card appears across all TWDA decks.
    Returns separate counters for crypt and library cards.
    """
    crypt_counter = Counter()
    library_counter = Counter()

    for deck in twda_data.values():
        # Count crypt cards (list of tuples: (Card, count))
        for card, count in deck.crypt:
            crypt_counter[card.id] += count

        # Count library cards (list of tuples: (Card, count))
        for card, count in deck.library:
            library_counter[card.id] += count

    return crypt_counter, library_counter


def calculate_difficulty(card_id, count, sorted_cards, total_unique_cards):
    """
    Calculate difficulty level based on card's popularity rank.

    Percentile calculation:
    - We sort cards by count (descending)
    - Find the rank of the current card
    - Calculate what percentile that rank falls into

    Level assignment:
    - Level 1: Top 1% (rank <= 1% of total)
    - Level 2: Top 2-20%
    - Level 3: Top 21-60%
    - Level 4: Cards appearing in < 5 decks (regardless of percentile)
    - Level 5: Cards with 0 appearances
    """
    if count == 0:
        return 5  # Impossible - never used in TWDA

    if count < 5:
        return 4  # Hard - very rarely used

    # Find rank (1-indexed, lower is better/more popular)
    rank = None
    for i, (cid, _) in enumerate(sorted_cards, 1):
        if cid == card_id:
            rank = i
            break

    if rank is None:
        return 4  # Fallback

    # Calculate percentile (what % of cards are ranked lower/worse)
    percentile = (rank / total_unique_cards) * 100

    if percentile <= 1:
        return 1  # Tutorial/Staple - Top 1%
    elif percentile <= 20:
        return 2  # Easy - Top 20%
    elif percentile <= 60:
        return 3  # Medium - Top 60%
    else:
        return 4  # Hard - Bottom 40% (but still used)


def get_card_image_slug(card):
    """
    Generate the image slug for KRCG static files.
    Card images are at: https://static.krcg.org/card/{slug}.jpg
    """
    # KRCG uses lowercase name without spaces or punctuation
    name = card.name.lower()
    # Remove special characters and spaces
    slug = ''.join(c for c in name if c.isalnum())
    return slug


def generate_card_data(vtes_data, crypt_counter, library_counter):
    """
    Generate the final card data with difficulty levels.
    """
    crypt_cards = []
    library_cards = []

    # Sort cards by count (descending) for percentile calculation
    sorted_crypt = sorted(crypt_counter.items(), key=lambda x: x[1], reverse=True)
    sorted_library = sorted(library_counter.items(), key=lambda x: x[1], reverse=True)

    # Get all unique cards that appeared in TWDA
    total_crypt_in_twda = len([c for c in sorted_crypt if c[1] > 0])
    total_library_in_twda = len([c for c in sorted_library if c[1] > 0])

    print(f"\nUnique crypt cards in TWDA: {total_crypt_in_twda}")
    print(f"Unique library cards in TWDA: {total_library_in_twda}")

    # Process all cards in the database (iterate directly over VTES)
    for card in vtes_data:
        card_info = {
            "id": card.id,
            "name": card.name,
            "slug": get_card_image_slug(card),
            "types": list(card.types) if hasattr(card, 'types') and card.types else [],
        }

        # Add disciplines if available (list of strings like ['dom', 'pot', 'FOR'])
        if hasattr(card, 'disciplines') and card.disciplines:
            card_info["disciplines"] = list(card.disciplines)

        # Add clan if available
        if hasattr(card, 'clans') and card.clans:
            card_info["clan"] = list(card.clans)[0] if card.clans else None

        # Determine if crypt or library using the .crypt attribute
        is_crypt = card.crypt if hasattr(card, 'crypt') else False

        if is_crypt:
            count = crypt_counter.get(card.id, 0)
            difficulty = calculate_difficulty(
                card.id, count, sorted_crypt, total_crypt_in_twda
            )
            card_info["count"] = count
            card_info["difficulty"] = difficulty

            # Add crypt-specific info
            if hasattr(card, 'capacity'):
                card_info["capacity"] = card.capacity
            if hasattr(card, 'group'):
                card_info["group"] = card.group

            crypt_cards.append(card_info)
        else:
            count = library_counter.get(card.id, 0)
            difficulty = calculate_difficulty(
                card.id, count, sorted_library, total_library_in_twda
            )
            card_info["count"] = count
            card_info["difficulty"] = difficulty
            library_cards.append(card_info)

    # Sort by difficulty then by count (descending)
    crypt_cards.sort(key=lambda x: (x["difficulty"], -x["count"]))
    library_cards.sort(key=lambda x: (x["difficulty"], -x["count"]))

    return crypt_cards, library_cards


def print_stats(crypt_cards, library_cards):
    """Print statistics about the difficulty distribution."""
    print("\n" + "="*50)
    print("DIFFICULTY DISTRIBUTION")
    print("="*50)

    for card_type, cards in [("CRYPT", crypt_cards), ("LIBRARY", library_cards)]:
        print(f"\n{card_type}:")
        for level in range(1, 6):
            level_cards = [c for c in cards if c["difficulty"] == level]
            print(f"  Level {level}: {len(level_cards)} cards")

            # Show top 5 examples for each level
            if level_cards:
                examples = level_cards[:5]
                example_names = [f"{c['name']} ({c['count']})" for c in examples]
                print(f"    Examples: {', '.join(example_names)}")


def main():
    # Load data
    vtes_data, twda_data = load_data()

    # Count occurrences
    print("\nCounting card occurrences in TWDA...")
    crypt_counter, library_counter = count_card_occurrences(twda_data)

    # Generate card data with difficulty
    print("Calculating difficulty levels...")
    crypt_cards, library_cards = generate_card_data(
        vtes_data, crypt_counter, library_counter
    )

    # Print statistics
    print_stats(crypt_cards, library_cards)

    # Create output
    output = {
        "metadata": {
            "total_decks_analyzed": len(twda_data),
            "total_crypt_cards": len(crypt_cards),
            "total_library_cards": len(library_cards),
            "difficulty_levels": {
                "1": "Tutorial/Staple (Top 1%)",
                "2": "Easy (Top 2-20%)",
                "3": "Medium (Top 21-60%)",
                "4": "Hard (< 5 appearances or bottom 40%)",
                "5": "Impossible (Never used in TWDA)"
            }
        },
        "crypt": crypt_cards,
        "library": library_cards
    }

    # Write to file
    output_path = "vtes_guess_data.json"
    print(f"\nWriting to {output_path}...")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"Done! Generated {output_path}")
    print(f"Total cards: {len(crypt_cards) + len(library_cards)}")


if __name__ == "__main__":
    main()
