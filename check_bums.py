import requests
import json

URL_TWDA = "https://static.krcg.org/data/twda.json"
CARD_NAME = "Bum's Rush"

print(f"--- DESCARGANDO TWDA MANUALMENTE DESDE {URL_TWDA} ---")

try:
    # 1. Bajamos el archivo crudo
    response = requests.get(URL_TWDA)
    response.raise_for_status()
    decks = response.json() # Esto suele ser una LISTA de mazos
    
    print(f"¡Descarga exitosa! Analizando {len(decks)} mazos ganadores...")

    total_copies = 0
    decks_with_card = 0

    # 2. Iteramos a lo bruto
    for deck in decks:
        # La estructura suele ser deck['library']['cards'] -> lista de {count, name, id}
        library_cards = deck.get('library', {}).get('cards', [])
        
        found_in_deck = False
        
        for card in library_cards:
            # A veces viene como diccionario, a veces hay que tener cuidado
            if card.get('name') == CARD_NAME:
                count = card.get('count', 0)
                total_copies += count
                found_in_deck = True
                
        if found_in_deck:
            decks_with_card += 1

    print(f"\nRESULTADOS PARA: '{CARD_NAME}'")
    print(f"------------------------------------------------")
    print(f"Total de copias físicas jugadas: {total_copies}")
    print(f"Aparece en {decks_with_card} mazos distintos.")
    
    if len(decks) > 0:
        percentage = (decks_with_card / len(decks)) * 100
        print(f"Porcentaje de uso (Meta Presence): {percentage:.2f}%")

except Exception as e:
    print(f"ERROR FATAL: {e}")