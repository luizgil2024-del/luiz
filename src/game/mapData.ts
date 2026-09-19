import { Building, Container, Vehicle } from '../types/game';
import { cloneItem } from './itemsData';

export const MAP_WIDTH = 3200;
export const MAP_HEIGHT = 2800;

export interface StreetRoad {
  x: number;
  y: number;
  width: number;
  height: number;
  isVertical: boolean;
  name: string;
}

export const STREETS: StreetRoad[] = [
  // Main Central Avenue (North-South) - Wide Avenue with yellow lines
  { x: 1400, y: 100, width: 220, height: 2600, isVertical: true, name: 'Avenida Central dos Pioneiros' },
  // East-West Boulevard (North)
  { x: 100, y: 650, width: 3000, height: 180, isVertical: false, name: 'Rua das Acácias' },
  // East-West Boulevard (South)
  { x: 100, y: 1750, width: 3000, height: 180, isVertical: false, name: 'Avenida Marechal Deodoro' },
  // West Lateral Street (North-South)
  { x: 450, y: 100, width: 150, height: 2600, isVertical: true, name: 'Rua do Comércio' },
  // East Lateral Street (North-South)
  { x: 2450, y: 100, width: 150, height: 2600, isVertical: true, name: 'Alameda dos Pinheiros' },
];

// Crosswalk locations at intersections
export const CROSSWALKS = [
  { x: 1400, y: 620, width: 220, height: 30 },
  { x: 1400, y: 830, width: 220, height: 30 },
  { x: 1370, y: 650, width: 30, height: 180 },
  { x: 1620, y: 650, width: 30, height: 180 },
  { x: 1400, y: 1720, width: 220, height: 30 },
  { x: 1400, y: 1930, width: 220, height: 30 },
  { x: 1370, y: 1750, width: 30, height: 180 },
  { x: 1620, y: 1750, width: 30, height: 180 },
  { x: 450, y: 620, width: 150, height: 30 },
  { x: 450, y: 830, width: 150, height: 30 },
  { x: 2450, y: 620, width: 150, height: 30 },
  { x: 2450, y: 830, width: 150, height: 30 },
];

export const BUILDINGS: Building[] = [
  // 1. Casa dos Sobreviventes (Inicial / Base Recomendada) - Top Left
  {
    id: 'b_house_1',
    name: 'Residência Familiar (Casa Segura)',
    type: 'residential',
    x: 650,
    y: 180,
    width: 380,
    height: 380,
    wallColor: '#8B5A2B',
    roofColor: '#A0522D',
    floorColor: '#DEB887',
    explored: false,
    doors: [
      { x: 800, y: 552, width: 80, height: 16, isOpen: true }, // Porta da Frente (Saída direta para a calçada e rua)
      { x: 642, y: 330, width: 16, height: 80, isOpen: true }, // Porta dos Fundos (Saída para o quintal)
    ],
    windows: [
      { x: 700, y: 560, width: 60, height: 12, isBroken: false },
      { x: 930, y: 560, width: 60, height: 12, isBroken: false },
      { x: 1030, y: 280, width: 12, height: 60, isBroken: false },
    ],
    rooms: [
      { name: 'Sala de Estar', x: 650, y: 340, width: 220, height: 220, type: 'living' },
      { name: 'Cozinha', x: 870, y: 340, width: 160, height: 220, type: 'kitchen' },
      { name: 'Quarto Principal', x: 650, y: 180, width: 220, height: 160, type: 'bedroom' },
      { name: 'Banheiro', x: 870, y: 180, width: 160, height: 160, type: 'bathroom' },
    ],
  },

  // 2. Supermercado Cidade Nova - Top Right (High Food & Water Loot)
  {
    id: 'b_supermarket',
    name: 'Supermercado Cidade Nova',
    type: 'grocery',
    x: 1700,
    y: 160,
    width: 520,
    height: 420,
    wallColor: '#4A5568',
    roofColor: '#2D3748',
    floorColor: '#E2E8F0',
    explored: false,
    doors: [
      { x: 1850, y: 580, width: 70, height: 16, isOpen: false }, // Entrance
      { x: 2220, y: 350, width: 16, height: 60, isOpen: false }, // Delivery door
    ],
    windows: [
      { x: 1720, y: 580, width: 90, height: 12, isBroken: true },
      { x: 1980, y: 580, width: 90, height: 12, isBroken: false },
      { x: 2100, y: 580, width: 90, height: 12, isBroken: true },
    ],
    rooms: [
      { name: 'Salão de Vendas', x: 1700, y: 280, width: 520, height: 300, type: 'shop_floor' },
      { name: 'Estoque de Alimentos', x: 1700, y: 160, width: 320, height: 120, type: 'storage' },
      { name: 'Câmara Fria & Escritório', x: 2020, y: 160, width: 200, height: 120, type: 'office' },
    ],
  },

  // 3. Farmácia & Clínica Saúde Total - Mid Left (High Medical Loot)
  {
    id: 'b_pharmacy',
    name: 'Farmácia Saúde & Vida',
    type: 'pharmacy',
    x: 680,
    y: 920,
    width: 360,
    height: 320,
    wallColor: '#2B6CB0',
    roofColor: '#2C5282',
    floorColor: '#EDF2F7',
    explored: false,
    doors: [
      { x: 830, y: 920, width: 60, height: 14, isOpen: false },
      { x: 680, y: 1060, width: 14, height: 50, isOpen: false },
    ],
    windows: [
      { x: 720, y: 920, width: 70, height: 12, isBroken: true },
      { x: 920, y: 920, width: 70, height: 12, isBroken: false },
    ],
    rooms: [
      { name: 'Balcão de Medicamentos', x: 680, y: 920, width: 360, height: 190, type: 'shop_floor' },
      { name: 'Depósito de Remédios', x: 680, y: 1110, width: 220, height: 130, type: 'storage' },
      { name: 'Sala de Procedimentos', x: 900, y: 1110, width: 140, height: 130, type: 'office' },
    ],
  },

  // 4. Delegacia de Polícia do Distrito 4 - Center East (High Weapon & Ammo Loot)
  {
    id: 'b_police',
    name: 'Delegacia de Polícia do Distrito 4',
    type: 'police',
    x: 1720,
    y: 900,
    width: 480,
    height: 380,
    wallColor: '#1A365D',
    roofColor: '#0F172A',
    floorColor: '#CBD5E1',
    explored: false,
    doors: [
      { x: 1930, y: 900, width: 60, height: 16, isOpen: false },
      { x: 2200, y: 1100, width: 16, height: 50, isOpen: false },
    ],
    windows: [
      { x: 1770, y: 900, width: 60, height: 12, isBroken: false },
      { x: 2060, y: 900, width: 60, height: 12, isBroken: false },
    ],
    rooms: [
      { name: 'Recepção e Plantão', x: 1720, y: 900, width: 480, height: 180, type: 'office' },
      { name: 'Arsenal de Armas e Munições', x: 1720, y: 1080, width: 260, height: 200, type: 'armory' },
      { name: 'Celas de Detenção', x: 1980, y: 1080, width: 220, height: 200, type: 'storage' },
    ],
  },

  // 5. Loja de Ferragens & Oficina Progresso - Bottom Left (Building Materials & Tools)
  {
    id: 'b_hardware',
    name: 'Depósito de Ferragens & Ferramentas',
    type: 'hardware',
    x: 650,
    y: 2020,
    width: 420,
    height: 380,
    wallColor: '#7B341E',
    roofColor: '#521B41',
    floorColor: '#A0AEC0',
    explored: false,
    doors: [
      { x: 820, y: 2020, width: 70, height: 16, isOpen: true },
      { x: 650, y: 2200, width: 16, height: 60, isOpen: false },
    ],
    windows: [
      { x: 710, y: 2020, width: 70, height: 12, isBroken: true },
      { x: 940, y: 2020, width: 70, height: 12, isBroken: false },
    ],
    rooms: [
      { name: 'Showroom de Ferramentas', x: 650, y: 2020, width: 420, height: 200, type: 'shop_floor' },
      { name: 'Depósito de Madeiras e Metais', x: 650, y: 2220, width: 260, height: 180, type: 'storage' },
      { name: 'Oficina de Solda e Carpintaria', x: 910, y: 2220, width: 160, height: 180, type: 'office' },
    ],
  },

  // 6. Residência da Família Silva - Bottom Center/Right
  {
    id: 'b_house_2',
    name: 'Sobrado da Família Silva',
    type: 'residential',
    x: 1700,
    y: 2020,
    width: 380,
    height: 340,
    wallColor: '#975A16',
    roofColor: '#744210',
    floorColor: '#D69E2E',
    explored: false,
    doors: [
      { x: 1860, y: 2020, width: 50, height: 14, isOpen: false },
      { x: 2080, y: 2180, width: 14, height: 50, isOpen: false },
    ],
    windows: [
      { x: 1750, y: 2020, width: 60, height: 12, isBroken: false },
      { x: 1960, y: 2020, width: 60, height: 12, isBroken: false },
    ],
    rooms: [
      { name: 'Sala de Jogos e Estar', x: 1700, y: 2020, width: 230, height: 190, type: 'living' },
      { name: 'Cozinha Americana', x: 1930, y: 2020, width: 150, height: 190, type: 'kitchen' },
      { name: 'Suíte Principal', x: 1700, y: 2210, width: 230, height: 150, type: 'bedroom' },
      { name: 'Despensa e Lavanderia', x: 1930, y: 2210, width: 150, height: 150, type: 'storage' },
    ],
  },

  // 7. Posto de Combustível e Loja de Conveniência - Bottom Far Right
  {
    id: 'b_gas_station',
    name: 'Posto PetroExpress & Conveniência',
    type: 'gas_station',
    x: 2200,
    y: 2020,
    width: 360,
    height: 320,
    wallColor: '#276749',
    roofColor: '#1C4532',
    floorColor: '#CBD5E1',
    explored: false,
    doors: [
      { x: 2350, y: 2020, width: 60, height: 16, isOpen: true },
    ],
    windows: [
      { x: 2240, y: 2020, width: 70, height: 12, isBroken: true },
      { x: 2450, y: 2020, width: 70, height: 12, isBroken: true },
    ],
    rooms: [
      { name: 'Loja de Conveniência', x: 2200, y: 2020, width: 360, height: 190, type: 'shop_floor' },
      { name: 'Oficina Mecânica', x: 2200, y: 2210, width: 360, height: 130, type: 'storage' },
    ],
  },
];

// Street Furniture / Obstacles (lamp posts, fire hydrants, trash cans, barricades)
export const STREET_PROPS = [
  { x: 1370, y: 550, type: 'lamppost', width: 16, height: 16 },
  { x: 1640, y: 550, type: 'lamppost', width: 16, height: 16 },
  { x: 1370, y: 1100, type: 'lamppost', width: 16, height: 16 },
  { x: 1640, y: 1100, type: 'lamppost', width: 16, height: 16 },
  { x: 1370, y: 1650, type: 'lamppost', width: 16, height: 16 },
  { x: 1640, y: 1650, type: 'lamppost', width: 16, height: 16 },
  { x: 1370, y: 2200, type: 'lamppost', width: 16, height: 16 },
  { x: 1640, y: 2200, type: 'lamppost', width: 16, height: 16 },
  { x: 420, y: 620, type: 'hydrant', width: 14, height: 14 },
  { x: 2420, y: 620, type: 'hydrant', width: 14, height: 14 },
  { x: 420, y: 1720, type: 'hydrant', width: 14, height: 14 },
  { x: 2420, y: 1720, type: 'hydrant', width: 14, height: 14 },
];

export function generateInitialContainers(): Container[] {
  return [
    // --- CASA 1 (Inicial) ---
    {
      id: 'c_h1_fridge',
      name: 'Geladeira Familiar',
      type: 'fridge',
      buildingId: 'b_house_1',
      x: 960,
      y: 370,
      width: 44,
      height: 38,
      searched: false,
      items: [cloneItem('fresh_water', 2), cloneItem('canned_beans', 2), cloneItem('energy_bar', 1)],
    },
    {
      id: 'c_h1_cabinet',
      name: 'Armário de Cozinha',
      type: 'cabinet',
      buildingId: 'b_house_1',
      x: 880,
      y: 360,
      width: 45,
      height: 30,
      searched: false,
      items: [cloneItem('knife', 1), cloneItem('duct_tape', 1), cloneItem('cloth', 2)],
    },
    {
      id: 'c_h1_bed',
      name: 'Gaveteiro do Quarto',
      type: 'cabinet',
      buildingId: 'b_house_1',
      x: 680,
      y: 200,
      width: 42,
      height: 32,
      searched: false,
      items: [cloneItem('bandage', 2), cloneItem('nails', 8), cloneItem('wood_plank', 2)],
    },
    {
      id: 'c_h1_firstaid',
      name: 'Armarinho de Remédios',
      type: 'firstaid',
      buildingId: 'b_house_1',
      x: 980,
      y: 200,
      width: 32,
      height: 32,
      searched: false,
      items: [cloneItem('bandage', 2), cloneItem('painkillers', 2), cloneItem('alcohol', 1)],
    },

    // --- SUPERMERCADO ---
    {
      id: 'c_sup_shelf1',
      name: 'Gôndola de Alimentos Enlatados',
      type: 'shelf',
      buildingId: 'b_supermarket',
      x: 1800,
      y: 350,
      width: 80,
      height: 32,
      searched: false,
      items: [cloneItem('canned_beans', 4), cloneItem('energy_bar', 3)],
    },
    {
      id: 'c_sup_shelf2',
      name: 'Gôndola de Bebidas',
      type: 'shelf',
      buildingId: 'b_supermarket',
      x: 1950,
      y: 350,
      width: 80,
      height: 32,
      searched: false,
      items: [cloneItem('fresh_water', 4), cloneItem('soda', 3)],
    },
    {
      id: 'c_sup_fridge',
      name: 'Freezer Industrial',
      type: 'fridge',
      buildingId: 'b_supermarket',
      x: 2120,
      y: 330,
      width: 60,
      height: 40,
      searched: false,
      items: [cloneItem('fresh_water', 3), cloneItem('energy_bar', 2)],
    },
    {
      id: 'c_sup_storage_crate',
      name: 'Caixa de Suprimentos do Estoque',
      type: 'crate',
      buildingId: 'b_supermarket',
      x: 1750,
      y: 190,
      width: 50,
      height: 45,
      searched: false,
      items: [cloneItem('canned_beans', 5), cloneItem('duct_tape', 2), cloneItem('alcohol', 2)],
    },
    {
      id: 'c_sup_office_safe',
      name: 'Cofre do Gerente',
      type: 'locker',
      buildingId: 'b_supermarket',
      x: 2140,
      y: 180,
      width: 40,
      height: 40,
      searched: false,
      items: [cloneItem('pistol_9mm', 1), cloneItem('ammo_9mm', 15), cloneItem('painkillers', 2)],
    },

    // --- FARMÁCIA ---
    {
      id: 'c_pha_counter',
      name: 'Balcão de Atendimento Farmacêutico',
      type: 'cabinet',
      buildingId: 'b_pharmacy',
      x: 750,
      y: 1000,
      width: 80,
      height: 35,
      searched: false,
      items: [cloneItem('bandage', 3), cloneItem('alcohol', 2), cloneItem('painkillers', 2)],
    },
    {
      id: 'c_pha_med_cabinet',
      name: 'Armário de Antibióticos Controlados',
      type: 'firstaid',
      buildingId: 'b_pharmacy',
      x: 720,
      y: 1140,
      width: 50,
      height: 40,
      searched: false,
      items: [cloneItem('antibiotics', 3), cloneItem('medkit', 1), cloneItem('bandage', 2)],
    },
    {
      id: 'c_pha_clinic_box',
      name: 'Maca e Suportes Cirúrgicos',
      type: 'crate',
      buildingId: 'b_pharmacy',
      x: 940,
      y: 1150,
      width: 45,
      height: 45,
      searched: false,
      items: [cloneItem('medkit', 1), cloneItem('cloth', 4), cloneItem('painkillers', 2)],
    },

    // --- DELEGACIA DE POLÍCIA ---
    {
      id: 'c_pol_desk',
      name: 'Mesa do Sargento',
      type: 'cabinet',
      buildingId: 'b_police',
      x: 1800,
      y: 950,
      width: 60,
      height: 40,
      searched: false,
      items: [cloneItem('ammo_9mm', 15), cloneItem('pistol_9mm', 1), cloneItem('crowbar', 1)],
    },
    {
      id: 'c_pol_armory_1',
      name: 'Armário de Armas de Choque e Táticas',
      type: 'locker',
      buildingId: 'b_police',
      x: 1750,
      y: 1120,
      width: 55,
      height: 40,
      searched: false,
      items: [cloneItem('shotgun_12g', 1), cloneItem('ammo_12g', 12), cloneItem('knife', 1)],
    },
    {
      id: 'c_pol_armory_2',
      name: 'Cofre Tático de Munições Pesadas',
      type: 'locker',
      buildingId: 'b_police',
      x: 1880,
      y: 1120,
      width: 55,
      height: 40,
      searched: false,
      items: [cloneItem('hunting_rifle', 1), cloneItem('ammo_rifle', 10), cloneItem('ammo_9mm', 25)],
    },

    // --- LOJA DE FERRAGENS ---
    {
      id: 'c_hrd_rack1',
      name: 'Prateleira de Ferramentas Pesadas',
      type: 'toolbox',
      buildingId: 'b_hardware',
      x: 720,
      y: 2060,
      width: 80,
      height: 35,
      searched: false,
      items: [cloneItem('fire_axe', 1), cloneItem('crowbar', 1), cloneItem('nails', 20)],
    },
    {
      id: 'c_hrd_woodpile',
      name: 'Pilha de Tábuas de Pinho',
      type: 'crate',
      buildingId: 'b_hardware',
      x: 700,
      y: 2260,
      width: 70,
      height: 50,
      searched: false,
      items: [cloneItem('wood_plank', 8), cloneItem('nails', 16), cloneItem('duct_tape', 2)],
    },
    {
      id: 'c_hrd_metal_shelf',
      name: 'Bancada de Sucata de Aço',
      type: 'crate',
      buildingId: 'b_hardware',
      x: 950,
      y: 2260,
      width: 60,
      height: 45,
      searched: false,
      items: [cloneItem('scrap_metal', 6), cloneItem('electronics', 3), cloneItem('barricade_wood', 1)],
    },

    // --- CASA 2 (Família Silva) ---
    {
      id: 'c_h2_kitchen',
      name: 'Despensa da Cozinha',
      type: 'fridge',
      buildingId: 'b_house_2',
      x: 1980,
      y: 2060,
      width: 45,
      height: 40,
      searched: false,
      items: [cloneItem('fresh_water', 2), cloneItem('canned_beans', 3), cloneItem('soda', 2)],
    },
    {
      id: 'c_h2_closet',
      name: 'Guarda-Roupa da Suíte',
      type: 'cabinet',
      buildingId: 'b_house_2',
      x: 1740,
      y: 2250,
      width: 55,
      height: 35,
      searched: false,
      items: [cloneItem('cloth', 4), cloneItem('spiked_bat', 1), cloneItem('bandage', 2)],
    },

    // --- POSTO DE COMBUSTÍVEL ---
    {
      id: 'c_gas_store',
      name: 'Balcão da Conveniência',
      type: 'shelf',
      buildingId: 'b_gas_station',
      x: 2260,
      y: 2060,
      width: 60,
      height: 35,
      searched: false,
      items: [cloneItem('energy_bar', 3), cloneItem('soda', 2), cloneItem('alcohol', 2)],
    },
    {
      id: 'c_gas_garage',
      name: 'Bancada do Mecânico',
      type: 'toolbox',
      buildingId: 'b_gas_station',
      x: 2320,
      y: 2250,
      width: 70,
      height: 45,
      searched: false,
      items: [cloneItem('car_battery', 1), cloneItem('scrap_metal', 4), cloneItem('duct_tape', 2)],
    },
  ];
}

export const VEHICLES: Vehicle[] = [
  // Yellow taxi (like in the photo)
  {
    id: 'veh_taxi_1',
    model: 'cab',
    x: 1470,
    y: 500,
    angle: 0.1,
    color: '#ECC94B',
    searched: false,
    items: [cloneItem('energy_bar', 1), cloneItem('soda', 1), cloneItem('bandage', 1)],
  },
  // Police cruiser
  {
    id: 'veh_police_1',
    model: 'police',
    x: 1530,
    y: 980,
    angle: -0.05,
    color: '#1A365D',
    searched: false,
    items: [cloneItem('ammo_9mm', 15), cloneItem('pistol_9mm', 1), cloneItem('bandage', 1)],
  },
  // Civilian sedan (Red)
  {
    id: 'veh_sedan_red',
    model: 'sedan',
    x: 1460,
    y: 1400,
    angle: 0.2,
    color: '#C53030',
    searched: false,
    items: [cloneItem('canned_beans', 1), cloneItem('fresh_water', 1), cloneItem('duct_tape', 1)],
  },
  // Yellow taxi 2 (near intersection like in photo)
  {
    id: 'veh_taxi_2',
    model: 'cab',
    x: 1510,
    y: 1950,
    angle: -0.15,
    color: '#ECC94B',
    searched: false,
    items: [cloneItem('car_battery', 1), cloneItem('scrap_metal', 2)],
  },
  // Delivery van (White)
  {
    id: 'veh_van_1',
    model: 'van',
    x: 1000,
    y: 720,
    angle: 1.57,
    color: '#E2E8F0',
    searched: false,
    items: [cloneItem('wood_plank', 4), cloneItem('nails', 15), cloneItem('canned_beans', 2)],
  },
  // Pickup truck (Green)
  {
    id: 'veh_pickup_1',
    model: 'pickup',
    x: 2000,
    y: 720,
    angle: 1.55,
    color: '#276749',
    searched: false,
    items: [cloneItem('scrap_metal', 3), cloneItem('alcohol', 1), cloneItem('crowbar', 1)],
  },
];
