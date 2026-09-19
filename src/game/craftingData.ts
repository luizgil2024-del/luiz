import { CraftingRecipe } from '../types/game';
import { cloneItem } from './itemsData';

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  // --- SOBREVIVÊNCIA ---
  {
    id: 'craft_bandage',
    name: 'Bandagem Estéril',
    category: 'survival',
    description: 'Rasga pedaços de tecido e esteriliza com álcool para estancar sangramentos.',
    resultItem: cloneItem('bandage', 2),
    materials: [
      { itemId: 'cloth', name: 'Tecido', quantity: 2 },
      { itemId: 'alcohol', name: 'Álcool', quantity: 1 },
    ],
    craftTimeSeconds: 1.5,
  },
  {
    id: 'craft_medkit',
    name: 'Kit Médico Avançado',
    category: 'survival',
    description: 'Combinação de bandagens, antibióticos e fita para curativos pesados.',
    resultItem: cloneItem('medkit', 1),
    materials: [
      { itemId: 'bandage', name: 'Bandagem', quantity: 2 },
      { itemId: 'antibiotics', name: 'Antibióticos', quantity: 1 },
      { itemId: 'duct_tape', name: 'Fita Adesiva', quantity: 1 },
    ],
    requiredSkill: { skillId: 'medicine', minLevel: 1 },
    craftTimeSeconds: 3.0,
  },
  {
    id: 'craft_purified_water',
    name: 'Ferver Água Potável',
    category: 'survival',
    description: 'Ferve a água coletada da chuva em recipientes para eliminar parasitas e vírus.',
    resultItem: cloneItem('fresh_water', 1),
    materials: [
      { itemId: 'dirty_water', name: 'Água Suja', quantity: 1 },
    ],
    craftTimeSeconds: 2.0,
  },

  // --- ARMAS ---
  {
    id: 'craft_spiked_bat',
    name: 'Taco de Beisebol com Pregos',
    category: 'weapons',
    description: 'Arma brutal feita com tábuas e pregos para estraçalhar crânios infectados.',
    resultItem: cloneItem('spiked_bat', 1),
    materials: [
      { itemId: 'wood_plank', name: 'Tábua de Madeira', quantity: 2 },
      { itemId: 'nails', name: 'Pregos', quantity: 8 },
      { itemId: 'duct_tape', name: 'Fita Adesiva', quantity: 1 },
    ],
    craftTimeSeconds: 2.5,
  },
  {
    id: 'craft_molotov',
    name: 'Coquetel Molotov Incendiário',
    category: 'weapons',
    description: 'Garrafa cheia de álcool com pavio de pano. Incinera grupos de infectados.',
    resultItem: cloneItem('molotov', 2),
    materials: [
      { itemId: 'alcohol', name: 'Álcool 70%', quantity: 1 },
      { itemId: 'cloth', name: 'Tecido', quantity: 2 },
    ],
    craftTimeSeconds: 2.0,
  },

  // --- BASE & CONSTRUÇÃO ---
  {
    id: 'craft_barricade_wood',
    name: 'Barricada de Madeira',
    category: 'building',
    description: 'Reforço de tábuas e pregos para bloquear passagens, portas e janelas de casas.',
    resultItem: cloneItem('barricade_wood', 1),
    materials: [
      { itemId: 'wood_plank', name: 'Tábua de Madeira', quantity: 3 },
      { itemId: 'nails', name: 'Pregos', quantity: 6 },
    ],
    craftTimeSeconds: 2.0,
  },
  {
    id: 'craft_barricade_metal',
    name: 'Barricada Reforçada de Aço',
    category: 'building',
    description: 'Defesa pesada soldada com sucata metálica. Quase indestrutível à noite.',
    resultItem: cloneItem('barricade_metal', 1),
    materials: [
      { itemId: 'scrap_metal', name: 'Sucata de Metal', quantity: 3 },
      { itemId: 'wood_plank', name: 'Tábua de Madeira', quantity: 2 },
      { itemId: 'nails', name: 'Pregos', quantity: 8 },
    ],
    requiredSkill: { skillId: 'engineering', minLevel: 1 },
    craftTimeSeconds: 4.0,
  },
  {
    id: 'craft_spike_trap',
    name: 'Armadilha de Espinhos de Chão',
    category: 'building',
    description: 'Coloque no solo para ferir e desacelerar zumbis que se aproximam da base.',
    resultItem: cloneItem('spike_trap', 2),
    materials: [
      { itemId: 'wood_plank', name: 'Tábua de Madeira', quantity: 2 },
      { itemId: 'nails', name: 'Pregos', quantity: 12 },
    ],
    craftTimeSeconds: 2.5,
  },
  {
    id: 'craft_storage_chest',
    name: 'Baú de Suprimentos Seguro',
    category: 'building',
    description: 'Estoque seus itens e armas com segurança dentro da sua casa fortificada.',
    resultItem: cloneItem('storage_chest', 1),
    materials: [
      { itemId: 'wood_plank', name: 'Tábua de Madeira', quantity: 4 },
      { itemId: 'nails', name: 'Pregos', quantity: 10 },
      { itemId: 'scrap_metal', name: 'Sucata de Metal', quantity: 1 },
    ],
    craftTimeSeconds: 3.0,
  },
  {
    id: 'craft_rain_collector',
    name: 'Coletor de Água da Chuva',
    category: 'building',
    description: 'Captura água continuamente durante o dia ou chuvas para suprir a sede.',
    resultItem: cloneItem('rain_collector', 1),
    materials: [
      { itemId: 'wood_plank', name: 'Tábua de Madeira', quantity: 3 },
      { itemId: 'cloth', name: 'Tecido', quantity: 3 },
      { itemId: 'duct_tape', name: 'Fita Adesiva', quantity: 2 },
    ],
    requiredSkill: { skillId: 'survival', minLevel: 1 },
    craftTimeSeconds: 3.5,
  },
  {
    id: 'craft_campfire',
    name: 'Fogueira de Sobrevivência',
    category: 'building',
    description: 'Fonte de luz e calor para cozinhar alimentos e purificar água.',
    resultItem: cloneItem('campfire', 1),
    materials: [
      { itemId: 'wood_plank', name: 'Tábua de Madeira', quantity: 3 },
      { itemId: 'cloth', name: 'Tecido', quantity: 1 },
    ],
    craftTimeSeconds: 2.0,
  },
  {
    id: 'craft_sleeping_bag',
    name: 'Saco de Dormir',
    category: 'building',
    description: 'Permite descansar em segurança para passar as horas perigosas da noite.',
    resultItem: cloneItem('sleeping_bag', 1),
    materials: [
      { itemId: 'cloth', name: 'Tecido', quantity: 5 },
      { itemId: 'duct_tape', name: 'Fita Adesiva', quantity: 1 },
    ],
    craftTimeSeconds: 2.5,
  },
  {
    id: 'craft_spotlight',
    name: 'Holofote Defensivo 12V',
    category: 'building',
    description: 'Iluminação perimetral de alta intensidade ligada à bateria de carro.',
    resultItem: cloneItem('spotlight', 1),
    materials: [
      { itemId: 'car_battery', name: 'Bateria Automotiva', quantity: 1 },
      { itemId: 'electronics', name: 'Componentes Eletrônicos', quantity: 2 },
      { itemId: 'scrap_metal', name: 'Sucata de Metal', quantity: 2 },
    ],
    requiredSkill: { skillId: 'engineering', minLevel: 2 },
    craftTimeSeconds: 5.0,
  },

  // --- MUNIÇÃO ---
  {
    id: 'craft_ammo_9mm',
    name: 'Munição 9mm Artesanal (x15)',
    category: 'ammo',
    description: 'Fabrica cartuchos 9mm usando sucata de metal e componentes.',
    resultItem: cloneItem('ammo_9mm', 15),
    materials: [
      { itemId: 'scrap_metal', name: 'Sucata de Metal', quantity: 1 },
      { itemId: 'electronics', name: 'Componentes', quantity: 1 },
    ],
    requiredSkill: { skillId: 'combat', minLevel: 1 },
    craftTimeSeconds: 3.0,
  },
  {
    id: 'craft_ammo_12g',
    name: 'Cartuchos Calibre 12 (x6)',
    category: 'ammo',
    description: 'Cartuchos de caça pesados fabricados na bancada de trabalho.',
    resultItem: cloneItem('ammo_12g', 6),
    materials: [
      { itemId: 'scrap_metal', name: 'Sucata de Metal', quantity: 2 },
      { itemId: 'duct_tape', name: 'Fita Adesiva', quantity: 1 },
    ],
    requiredSkill: { skillId: 'combat', minLevel: 2 },
    craftTimeSeconds: 3.5,
  },
];
