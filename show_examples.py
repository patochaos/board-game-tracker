
iimport json
import random
import sys

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

# Load both files with UTF-8 encoding
with open('premium_distractors.json', 'r', encoding='utf-8') as f:
    distractors_data = json.load(f)

with open('public/vtes_guess_data.json', 'r', encoding='utf-8') as f:
    vtes_data = json.load(f)

# Create a mapping from card ID to card name for library cards
id_to_name = {}
for card in vtes_data.get('library', []):
    card_id = str(card.get('id', ''))
    name = card.get('name', 'Unknown')
    id_to_name[card_id] = name

print('=== 20 EJEMPLOS DE CARTAS CON DISTRACTORES SEMANTICOS ===')
print()

# Get 20 random cards
sample_ids = random.sample(list(distractors_data.keys()), min(20, len(distractors_data)))

for i, card_id in enumerate(sample_ids, 1):
    card_name = id_to_name.get(card_id, f'Unknown Card (ID: {card_id})')
    distractors = distractors_data[card_id]
    
    print(f'{i:2}. {card_name}')
    print(f'    -> Distractor 1: {distractors[0] if len(distractors) > 0 else "N/A"}')
    print(f'    -> Distractor 2: {distractors[1] if len(distractors) > 1 else "N/A"}')
    print(f'    -> Distractor 3: {distractors[2] if len(distractors) > 2 else "N/A"}')
    print()
