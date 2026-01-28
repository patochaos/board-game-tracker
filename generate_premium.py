import json
import requests
from sentence_transformers import SentenceTransformer, util
import torch

# --- CONFIGURACIÓN ---
TOTAL_OPTIONS = 4
DISTRACTORS_NEEDED = TOTAL_OPTIONS - 1 
URL_OFICIAL = "https://static.krcg.org/data/vtes.json"

print("--- INICIANDO MODO MANUAL ---")

# 1. DESCARGA MANUAL DE DATOS (Bypassing librerías)
print(f"Descargando base de datos oficial desde {URL_OFICIAL}...")
try:
    response = requests.get(URL_OFICIAL)
    response.raise_for_status() # Lanza error si falla la descarga
    all_cards_raw = response.json() # Esto es una LISTA de diccionarios
    print(f"¡Descarga exitosa! Se bajaron {len(all_cards_raw)} cartas crudas.")
except Exception as e:
    print(f"ERROR FATAL descargando el JSON: {e}")
    exit()

# 2. FILTRADO (Library Cards = non-Vampire cards)
print("Filtrando cartas de Library...")
library_cards = []

for card in all_cards_raw:
    # En el JSON crudo, los campos son claves de diccionario (card['types'])
    # Library cards son las que NO son Vampire
    if 'types' in card and card['types'] and 'Vampire' not in card['types']:
        library_cards.append(card)

if len(library_cards) == 0:
    print("ERROR: Siguen saliendo 0 cartas. Algo pasa con el filtrado.")
    exit()

print(f"¡Ahora sí! Tenemos {len(library_cards)} cartas de Library.")

# 3. CARGAR IA
print("Cargando Cerebro Digital (Model: all-mpnet-base-v2)...")
model = SentenceTransformer('all-mpnet-base-v2')

# 4. GENERAR PERFILES
print("Generando perfiles semánticos...")
card_profiles = []
card_ids_list = [] # Guardamos IDs para mapear después

for card in library_cards:
    # Extracción de datos segura (usando .get para evitar errores si falta un campo)
    name = card.get('name', 'Unknown')
    card_type = card.get('types', ['Unknown'])[0]
    
    disciplines_list = card.get('disciplines', [])
    disciplines = " ".join(disciplines_list) if disciplines_list else "No Discipline"
    
    text = card.get('card_text', '')
    text_clean = text.replace('\n', ' ').replace('/', ' ')
    
    # Prompt semántico
    profile = f"{name} {card_type} {disciplines} {text_clean}"
    
    card_profiles.append(profile)
    card_ids_list.append(card.get('id'))

# 5. VECTORIZACIÓN
print("Vectorizando... (Paciencia, son 2-3 minutos)")
embeddings = model.encode(card_profiles, convert_to_tensor=True, show_progress_bar=True)

# 6. BÚSQUEDA DE SIMILITUD
print("Buscando gemelos malvados...")
distractors_db = {}

# Matriz de similitud
cosine_scores = util.cos_sim(embeddings, embeddings)

for i in range(len(library_cards)):
    target_card = library_cards[i]
    target_id = str(target_card.get('id')) # Convertimos a string por si acaso
    
    # Top 20 candidatos
    scores, indices = torch.topk(cosine_scores[i], k=20)
    
    best_matches = []
    target_types = target_card.get('types', [])
    
    for idx in indices:
        candidate_idx = idx.item()
        candidate_card = library_cards[candidate_idx]
        
        # --- FILTROS ---
        if candidate_idx == i: continue # No ella misma
        
        # Filtro de Tipo Principal (Master con Master)
        cand_types = candidate_card.get('types', [])
        if not target_types or not cand_types: continue
        if target_types[0] != cand_types[0]: continue
        
        # Filtro de Nombre (evita duplicados obvios)
        if target_card['name'] in candidate_card['name']: continue

        best_matches.append(candidate_card['name'])
        
        if len(best_matches) >= DISTRACTORS_NEEDED:
            break
            
    distractors_db[target_id] = best_matches

# 7. GUARDAR JSON
output_file = "premium_distractors.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(distractors_db, f, indent=2)

print(f"¡ÉXITO TOTAL! Archivo '{output_file}' generado con {len(distractors_db)} entradas.")