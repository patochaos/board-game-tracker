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
    Calculate difficulty level based on card's popularity rank among used cards.

    Logic:
    - Level 6: 0 appearances (handled before this function or simple check)
    - If count > 0, we check rank against total_unique_cards (N).
    
    Levels:
    - Level 1 (Staples): Top 10% (Rank 0 to 0.10 * N)
    - Level 2 (Common): Next 15% (Rank 0.10 * N to 0.25 * N)
    - Level 3 (Uncommon): Next 25% (Rank 0.25 * N to 0.50 * N)
    - Level 4 (Rare/Niche): Next 35% (Rank 0.50 * N to 0.85 * N)
    - Level 5 (Obscure): Bottom 15% (Rank 0.85 * N to 1.00 * N)
    """
    if count == 0:
        return 6  # The "Unknown" Tier - Never used in TWDA

    # Find rank (1-indexed)
    rank = None
    for i, (cid, _) in enumerate(sorted_cards, 1):
        if cid == card_id:
            rank = i
            break
            
    if rank is None:
        return 6 # Should not happen if count > 0 but safe fallback

    # Calculate percentile (lower is better rank, so top 1% is low percentile value here)
    # rank 1 is 1/N close to 0. rank N is N/N = 1.0
    percentile_rank = (rank / total_unique_cards)

    if percentile_rank <= 0.10:
        return 1  # Top 10%
    elif percentile_rank <= 0.25:
        return 2  # Next 15% (10-25)
    elif percentile_rank <= 0.50:
        return 3  # Next 25% (25-50)
    elif percentile_rank <= 0.85:
        return 4  # Next 35% (50-85)
    else:
        return 5  # Bottom 15%


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

    # Sort cards by count (descending) - ONLY those with count > 0 for ranking
    # We filter for count > 0 to establish the ranking "universe"
    active_crypt = [item for item in crypt_counter.items() if item[1] > 0]
    sorted_crypt = sorted(active_crypt, key=lambda x: x[1], reverse=True)
    
    active_library = [item for item in library_counter.items() if item[1] > 0]
    sorted_library = sorted(active_library, key=lambda x: x[1], reverse=True)

    # N for calculations
    total_crypt_in_twda = len(sorted_crypt)
    total_library_in_twda = len(sorted_library)

    print(f"\nUnique crypt cards in TWDA (N): {total_crypt_in_twda}")
    print(f"Unique library cards in TWDA (N): {total_library_in_twda}")

    # Process all cards in the database
    for card in vtes_data:
        card_info = {
            "id": card.id,
            "name": card.name,
            "slug": get_card_image_slug(card),
            "types": list(card.types) if hasattr(card, 'types') and card.types else [],
        }

        # Add disciplines if available
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
        for level in range(1, 7):
            level_cards = [c for c in cards if c["difficulty"] == level]
            print(f"  Level {level}: {len(level_cards)} cards")

            # Show top 5 examples for each level
            if level_cards and level < 6:
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

    # Print stats
    print_stats(crypt_cards, library_cards)

    # Create output
    output = {
        "metadata": {
            "total_decks_analyzed": len(twda_data),
            "total_crypt_cards": len(crypt_cards),
            "total_library_cards": len(library_cards),
            "difficulty_levels": {
                "1": "Level 1: Staples (Top 10%)",
                "2": "Level 2: Common (Next 15%)",
                "3": "Level 3: Uncommon (Next 25%)",
                "4": "Level 4: Rare (Next 35%)",
                "5": "Level 5: Obscure (Bottom 15%)",
                "6": "Level 6: Unknown (0 appearances)"
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
