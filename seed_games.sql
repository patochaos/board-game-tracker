-- Seed file from collection.csv
-- Generated at: 2026-01-17T07:25:12.034Z

INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  359871,
  'Arcs',
  2024,
  NULL,
  NULL,
  2,
  4,
  120,
  8.02697,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  419279,
  'Arcs: Leaders & Lore Pack',
  2024,
  NULL,
  NULL,
  2,
  4,
  120,
  8.56628,
  'expansion'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'expansion';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  170216,
  'Blood Rage',
  2015,
  NULL,
  NULL,
  2,
  4,
  90,
  7.90311,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  260605,
  'Camel Up (Second Edition)',
  2018,
  NULL,
  NULL,
  3,
  8,
  45,
  7.54723,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  295947,
  'Cascadia',
  2021,
  NULL,
  NULL,
  1,
  4,
  45,
  7.89813,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  271320,
  'The Castles of Burgundy',
  2019,
  NULL,
  NULL,
  1,
  4,
  120,
  8.44949,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  178900,
  'Codenames',
  2015,
  NULL,
  NULL,
  2,
  8,
  15,
  7.52729,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  313010,
  'Cosmic Encounter: 42nd Anniversary Edition',
  2018,
  NULL,
  NULL,
  3,
  5,
  120,
  8.13425,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  61001,
  'Cosmic Encounter: Cosmic Incursion',
  2010,
  NULL,
  NULL,
  3,
  6,
  60,
  8.22503,
  'expansion'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'expansion';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  360372,
  'Cosmic Encounter: Cosmic Odyssey',
  2022,
  NULL,
  NULL,
  3,
  8,
  0,
  8.75358,
  'expansion'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'expansion';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  324856,
  'The Crew: Mission Deep Sea',
  2021,
  NULL,
  NULL,
  2,
  5,
  20,
  8.06288,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  285192,
  'Destinies',
  2021,
  NULL,
  NULL,
  1,
  3,
  150,
  7.66325,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  316554,
  'Dune: Imperium',
  2020,
  NULL,
  NULL,
  1,
  4,
  120,
  8.41406,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  199792,
  'Everdell',
  2018,
  NULL,
  NULL,
  1,
  4,
  80,
  7.98818,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  289056,
  'Everdell: Spirecrest',
  2020,
  NULL,
  NULL,
  1,
  4,
  100,
  8.27559,
  'expansion'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'expansion';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  295770,
  'Frosthaven',
  2022,
  NULL,
  NULL,
  1,
  4,
  180,
  8.75812,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  181279,
  'Fury of Dracula (Third/Fourth Edition)',
  2015,
  NULL,
  NULL,
  2,
  5,
  180,
  7.39595,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  390478,
  'Gloomhaven (Second Edition)',
  2025,
  NULL,
  NULL,
  1,
  4,
  120,
  8.16374,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  291457,
  'Gloomhaven: Jaws of the Lion',
  2020,
  NULL,
  NULL,
  1,
  4,
  120,
  8.36944,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  366013,
  'Heat: Pedal to the Metal',
  2022,
  NULL,
  NULL,
  1,
  6,
  60,
  8.00518,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  450619,
  'Just One: New Version',
  2025,
  NULL,
  NULL,
  3,
  7,
  20,
  7.85519,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  356033,
  'Libertalia: Winds of Galecrest',
  2022,
  NULL,
  NULL,
  1,
  6,
  60,
  7.44133,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  312484,
  'Lost Ruins of Arnak',
  2020,
  NULL,
  NULL,
  1,
  4,
  120,
  8.07926,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  341254,
  'Lost Ruins of Arnak: Expedition Leaders',
  2021,
  NULL,
  NULL,
  1,
  4,
  120,
  8.70191,
  'expansion'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'expansion';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  244992,
  'The Mind',
  2018,
  NULL,
  NULL,
  2,
  4,
  20,
  6.72395,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  422780,
  'Mistborn: The Deckbuilding Game',
  2024,
  NULL,
  NULL,
  1,
  4,
  60,
  7.71037,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  310100,
  'Nemesis: Lockdown',
  2022,
  NULL,
  NULL,
  1,
  5,
  180,
  8.25884,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  251661,
  'Oathsworn: Into the Deepwood',
  2022,
  NULL,
  NULL,
  1,
  4,
  90,
  8.78477,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  161936,
  'Pandemic Legacy: Season 1',
  2015,
  NULL,
  NULL,
  2,
  4,
  60,
  8.50611,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  266524,
  'PARKS',
  2019,
  NULL,
  NULL,
  1,
  5,
  60,
  7.62546,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  244521,
  'Quacks',
  2018,
  NULL,
  NULL,
  2,
  4,
  45,
  7.80507,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  269259,
  'The Quacks of Quedlinburg: The Herb Witches',
  2019,
  NULL,
  NULL,
  2,
  5,
  45,
  8.00163,
  'expansion'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'expansion';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  237182,
  'Root',
  2018,
  NULL,
  NULL,
  2,
  4,
  90,
  8.06889,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  272638,
  'Root: The Exiles and Partisans Deck',
  2020,
  NULL,
  NULL,
  2,
  6,
  0,
  8.70374,
  'expansion'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'expansion';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  330149,
  'Root: The Marauder Expansion',
  2022,
  NULL,
  NULL,
  2,
  6,
  90,
  8.83278,
  'expansion'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'expansion';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  272637,
  'Root: The Underworld Expansion',
  2020,
  NULL,
  NULL,
  2,
  6,
  90,
  8.71157,
  'expansion'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'expansion';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  418059,
  'SETI: Search for Extraterrestrial Intelligence',
  2024,
  NULL,
  NULL,
  1,
  4,
  160,
  8.409,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  329839,
  'So Clover!',
  2021,
  NULL,
  NULL,
  3,
  6,
  30,
  7.5928,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  162886,
  'Spirit Island',
  2017,
  NULL,
  NULL,
  1,
  4,
  120,
  8.34018,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  193065,
  'Spirit Island: Branch & Claw',
  2017,
  NULL,
  NULL,
  1,
  4,
  120,
  8.97945,
  'expansion'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'expansion';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  356510,
  'Spirit Island: Feather & Flame',
  2022,
  NULL,
  NULL,
  1,
  4,
  120,
  9.00019,
  'expansion'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'expansion';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  262722,
  'Spirit Island: Jagged Earth',
  2020,
  NULL,
  NULL,
  1,
  6,
  120,
  9.33162,
  'expansion'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'expansion';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  365137,
  'Spirit Island: Nature Incarnate',
  2023,
  NULL,
  NULL,
  1,
  6,
  180,
  9.33881,
  'expansion'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'expansion';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  329500,
  'Unconscious Mind',
  2024,
  NULL,
  NULL,
  1,
  4,
  120,
  7.9105,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  183394,
  'Viticulture Essential Edition',
  2015,
  NULL,
  NULL,
  1,
  6,
  90,
  7.96253,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  202174,
  'Viticulture: Tuscany Essential Edition',
  2016,
  NULL,
  NULL,
  1,
  6,
  150,
  8.53678,
  'expansion'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'expansion';
INSERT INTO public.games (bgg_id, name, year_published, image_url, thumbnail_url, min_players, max_players, playing_time, bgg_rating, type)
VALUES (
  262543,
  'Wavelength',
  2019,
  NULL,
  NULL,
  2,
  12,
  45,
  7.20821,
  'standalone'
)
ON CONFLICT (bgg_id) DO UPDATE SET type = 'standalone';
