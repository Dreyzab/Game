import type { WorldNpcDefinition } from '../shared/types/worldNpc'

export const SEED_NPCS: WorldNpcDefinition[] = [
    // 1. Мастер Дитер (Sergei Realist)
    {
        id: 'dieter_craftsman_artisan',
        name: 'dieter',
        characterName: 'Мастер Дитер',
        description: 'Главный механик города. Чинит, улучшает и собирает снаряжение. Знакомство с ним открывает путь в ремесленное сообщество.',
        defaultLocationId: 'workshop_center',

        archetype: 'grey_realist',
        faction: 'artisans',
        philosophy: 'pragmatism',
        ethel_affinity: 'rust_of_time',

        services: ['repair', 'crafting', 'upgrade', 'storage'],
        dialogues: ['craftsman_meeting_dialog', 'weapon_repair_dialog'],
        questBindings: ['chance_for_a_newbie', 'whispers_of_rift', 'pressure_balance'],

        atmosphere: 'Тёплая, шумная мастерская, пахнущая маслом и горячим металлом.',
        sceneBindings: [
            {
                sceneId: 'dieter_hans_mention',
                triggerType: 'click',
                conditions: {
                    flags: ['has_dieter_parts'],
                    notFlags: ['delivered_parts_to_dieter'],
                },
                priority: 100,
            },
            {
                sceneId: 'dieter_schlossberg_return',
                triggerType: 'click',
                conditions: {
                    flags: ['schlossberg_crystal_obtained', 'met_dieter'],
                    notFlags: ['schlossberg_crystal_delivered'],
                },
                priority: 95,
            },
            {
                sceneId: 'dieter_workshop_approach',
                triggerType: 'click',
                conditions: {
                    notFlags: ['met_dieter'],
                },
                priority: 50,
            },
            {
                sceneId: 'dieter_schlossberg_quest',
                triggerType: 'click',
                conditions: {
                    flags: ['met_dieter', 'whispers_quest_active'],
                    notFlags: ['talked_schlossberg_with_dieter'],
                },
                priority: 80,
            },
            {
                sceneId: 'dieter_farewell',
                triggerType: 'click',
                conditions: {
                    flags: ['met_dieter'],
                },
                priority: 10,
            },
        ],
    },

    // 2. Отец Иоанн (Quiet Humanist)
    {
        id: 'father_johann',
        name: 'johann',
        characterName: 'Отец Иоанн',
        description: 'Настоятель собора. Организовал в крипте лазарет для тех, кого отвергла официальная медицина.',
        defaultLocationId: 'cathedral',

        archetype: 'quiet_humanist',
        faction: 'old_believers',
        philosophy: 'traditionalism',
        ethel_affinity: 'humility',
        perk: 'soul_shelter',

        services: ['healing', 'sanctuary', 'cleansing'],
        questBindings: ['sanctuary_blessing'],

        atmosphere: 'Тишина, запах ладана и ощущение абсолютной безопасности.',
        sceneBindings: [
            {
                sceneId: 'father_johann_meeting',
                triggerType: 'click',
                conditions: { notFlags: ['met_father_johann'] },
                priority: 50,
            },
            {
                sceneId: 'johann_candles_return',
                triggerType: 'click',
                conditions: { flags: ['sanctuary_blessing_active', 'has_candles_for_johann'] },
                priority: 80,
            },
            {
                sceneId: 'johann_return_visit',
                triggerType: 'click',
                conditions: { flags: ['met_father_johann'] },
                priority: 10,
            },
        ]
    },

    // 3. Лена Рихтер (Quiet Humanist)
    {
        id: 'npc_lena_richter',
        name: 'lena',
        characterName: 'Лена Рихтер',
        description: 'Врач, разрывающийся между долгом и нехваткой лекарств. Тайно лечит бойцов Сопротивления.',
        defaultLocationId: 'synthesis_medical_center',

        archetype: 'quiet_humanist',
        faction: 'synthesis',
        ethel_affinity: 'scientific_skepticism',

        services: ['healing', 'medicine_trade', 'first_aid_training'],
        dialogues: ['field_medicine_quest', 'medical_assistance'],
        questBindings: ['field_medicine', 'medical_supplies_quest'],

        atmosphere: 'Стерильный, но не лишённый человеческого тепла медицинский блок.',
    },

    // 4. Элиас (Quiet Profiteer)
    {
        id: 'npc_elias_trader',
        name: 'elias',
        characterName: 'Элиас',
        description: 'Торгует всем подряд. Не задает вопросов, откуда товар.',
        defaultLocationId: 'market_square_elias_stall',

        archetype: 'quiet_profiteer',
        faction: 'merchants',
        // Using 'merchants' or 'traders' based on codebase consistency. mapPoints used 'trader' category but 'neutral' faction often.
        // Spec said "Торговцы (Лавочник)".

        services: ['trade', 'information', 'rumors'],
        questBindings: ['chance_for_a_newbie', 'sanctuary_blessing'],

        atmosphere: 'Тесный прилавок, заваленный коробками и ящиками. Элиас зорко следит за каждым болтом и гайкой.',
        sceneBindings: [
            {
                sceneId: 'trader_meeting_dialog',
                triggerType: 'click',
                conditions: { flags: ['chance_for_newbie_active'], notFlags: ['has_dieter_parts'] },
                priority: 100,
            },
            {
                sceneId: 'elias_candles_purchase',
                triggerType: 'click',
                conditions: { flags: ['need_candles_for_johann'] },
                priority: 80,
            },
            {
                sceneId: 'elias_shop',
                triggerType: 'click',
                priority: 10,
            },
        ],
    },

    // 5. Сержант Ганс (Devoted Comrade)
    {
        id: 'sgt_hans',
        name: 'hans',
        characterName: 'Сержант Ганс',
        description: 'Командир отделения FJR на КПП. Он готов нарушить устав ради спасения людей.',
        defaultLocationId: 'sgt_hans_station', // We will keep this point as a location "Station Checkpoint"

        archetype: 'devoted_comrade',
        faction: 'fjr',
        ethel_affinity: 'wall',
        perk: 'fire_support',

        dialogues: ['hans_post_prologue_dialog'],
        atmosphere: 'Ганс проверяет снаряжение, готовый выдвинуться в любой момент.',
        sceneBindings: [
            {
                sceneId: 'hans_reminder_dialog',
                triggerType: 'click',
                conditions: { flags: ['met_hans', 'hans_gave_first_quest'], notFlags: ['completed_dieter_delivery'] },
                priority: 1,
            },
        ],
    },

    // 6. Асуа "Звездочет" (Free Rescuer)
    {
        id: 'asua_scout',
        name: 'asua',
        characterName: 'Асуа "Звездочет"',
        description: 'Тайный наблюдательный пост на крыше.',
        defaultLocationId: 'asua_lookout',

        archetype: 'free_rescuer',
        faction: 'anarchists',
        ethel_affinity: 'intuitive_empath',
        perk: 'wind_paths',

        questBindings: ['echo_in_silence'],
        dialogues: ['asua_dreams', 'asua_synthesis_interest', 'echo_in_silence_start'],
        atmosphere: 'Ветер треплет флаги. Асуа смотрит в бинокль, но её мысли где-то далеко.',
        unlockRequirements: { flags: ['anarchist_territory_entered'] },
        sceneBindings: [
            {
                sceneId: 'asua_stargazer',
                triggerType: 'click',
                conditions: { flags: ['anarchist_territory_entered'] },
                priority: 1,
            },
        ],
    },

    // 7. Карл "Шестеренка" (Lone Pragmatist)
    {
        id: 'carl_gears',
        name: 'carl',
        characterName: 'Карл "Шестерёнка"',
        description: 'Гениальный механик. Чинит то, что другие считают мусором.',
        defaultLocationId: 'carl_private_workshop',

        archetype: 'lone_pragmatist',
        faction: 'artisans',
        philosophy: 'pragmatism',
        ethel_affinity: 'techno_magic_craft',

        services: ['crafting', 'upgrades'],
        dialogues: ['carl_introduction', 'invention_discussion'],
        questBindings: ['repair_generator_with_crystal'],
        atmosphere: 'Тесное, заваленное деталями помещение. Среди хаоса виден порядок.',
    },

    // 8. Вальдемар "Один" (Clan Predator)
    {
        id: 'waldemar_one',
        name: 'waldemar',
        characterName: 'Вальдемар "Один"',
        description: 'Лидер боевого крыла анархистов. Считает, что город должен сгореть.',
        defaultLocationId: 'augustinerplatz_waldemar',

        archetype: 'clan_predator',
        faction: 'anarchists',
        philosophy: 'egoism_collective',
        ethel_affinity: 'blood_power',
        danger_level: 'high',

        dialogues: ['waldemar_introduction', 'waldemar_ideology'],
        atmosphere: 'Граффити, баррикады, костры. Люди смотрят на чужаков с подозрением.',
        unlockRequirements: { flags: ['anarchist_contact'], minReputation: { faction: 'anarchists', value: 10 } },
        sceneBindings: [
            {
                sceneId: 'augustinerplatz_warning',
                triggerType: 'click',
                conditions: { notFlags: ['anarchist_contact'] },
                priority: 1,
            },
        ],
    },

    // 9. Командант Мартен Хольц (Clan Predator)
    {
        id: 'commandant_holtz',
        name: 'holtz',
        characterName: 'Мартен Хольц',
        description: 'Лидер радикального крыла FJR.',
        defaultLocationId: 'fjr_commandant_holtz',

        archetype: 'clan_predator',
        faction: 'fjr',
        philosophy: 'order_sacrificial',

        dialogues: ['holtz_audience', 'holtz_mission_briefing'],
        atmosphere: 'Строгий порядок, карты зачистки на стенах. Хольц не терпит возражений.',
        unlockRequirements: { flags: ['fjr_trusted'], minReputation: { faction: 'fjr', value: 30 } },
    },

    // 10. Густав (Grey Realist)
    {
        id: 'gustav_customs',
        name: 'gustav',
        characterName: 'Густав',
        description: 'Таможенник. Мелкий чиновник, который просто делает свою работу.',
        defaultLocationId: 'npc_gustav',

        archetype: 'grey_realist',
        faction: 'neutral',
        philosophy: 'bureaucracy',

        services: ['pass_check'],
        dialogues: ['gustav_check', 'gustav_bribe'],
        atmosphere: 'Скучающий вид, штамп в руке. Густав устало смотрит на очередь.',
    },

    // 11. Инквизитор Маркус (System Functionary)
    {
        id: 'inquisitor_marcus',
        name: 'marcus',
        characterName: 'Инквизитор Маркус',
        description: 'Представитель Ватикана. Ищет признаки Одержимости.',
        defaultLocationId: 'npc_inquisitor_marcus',

        archetype: 'system_functionary',
        faction: 'old_believers',
        philosophy: 'purification',

        dialogues: ['marcus_interrogation', 'marcus_quest'],
        atmosphere: 'Холодный взгляд, запах старых книг и ладана.',
    },

    // 12. Аурелия Фокс (System Functionary)
    {
        id: 'mayor_fox',
        name: 'aurelia',
        characterName: 'Аурелия Фокс',
        description: 'Мэр города. Архитектор компромисса.',
        defaultLocationId: 'mayor_aurelia_fox',

        archetype: 'system_functionary',
        faction: 'ordnung',
        philosophy: 'law_and_order',
        ethel_affinity: 'resource_and_threat',
        perk: 'license_to_live',

        dialogues: ['fox_audience'],
        atmosphere: 'Холодная роскошь, идеальный порядок.',
        unlockRequirements: { flags: ['mayor_summons'], minReputation: { faction: 'fjr', value: 50 } },
    },

    // 13. Староста Марта (Devoted Comrade)
    {
        id: 'elder_martha',
        name: 'martha',
        characterName: 'Староста Марта',
        description: 'Матриарх общины. Жесткая, но справедливая.',
        defaultLocationId: 'settlement_white_creek',

        archetype: 'devoted_comrade',
        faction: 'farmers',
        philosophy: 'agrarianism',

        services: ['food_trade', 'rest', 'herbalism'],
        questBindings: ['harvest_of_corruption', 'protect_livestock'],
        atmosphere: 'Запах мокрой земли, мычание мутировавших коров, ощущение тяжелого труда.',
    },

    // 14. Рико (Lone Wolf)
    {
        id: 'rico_demolitionist',
        name: 'rico',
        characterName: 'Рико',
        description: 'Эксперт по взрывчатке. "Бум — это дипломатия."',
        defaultLocationId: 'rico_workshop_ceh4',

        archetype: 'lone_wolf',
        faction: 'independent',
        ethel_affinity: 'unstable_crystals',

        services: ['explosives', 'crafting'],
        dialogues: ['rico_greeting', 'rico_trade'],
        atmosphere: 'Запах пороха и масла. Везде провода.',
        unlockRequirements: { flags: ['rico_hideout_marker'] },
    },

    // 15. Траверс (Lone Pragmatist)
    {
        id: 'traverse_broker',
        name: 'traverse',
        characterName: 'Траверс',
        description: 'Информационный брокер. Знает всё обо всех.',
        defaultLocationId: 'traverse_office',

        archetype: 'lone_pragmatist',
        faction: 'independent',
        philosophy: 'info_is_currency',

        atmosphere: 'Полумрак, дым сигар, шёпот. Траверс знает всё о каждом.',
        dialogues: ['traverse_deal', 'traverse_information'],
        unlockRequirements: { flags: ['sewers_access'] },
    },

    // 16. Шрам (The Boss of The Hole)
    {
        id: 'scar_boss',
        name: 'scar',
        characterName: 'Шрам',
        description: 'Лидер Анархистов в клубе "Дыра".',
        defaultLocationId: 'the_hole_club',

        archetype: 'underground_boss',
        faction: 'anarchists',
        philosophy: 'nihilism',

        services: ['rumors', 'black_market_info'],
        dialogues: ['scar_introduction', 'scar_shopkeeper_deal'],
        questBindings: ['shopkeeper_truant'],

        atmosphere: 'Громкая музыка, дым, неоновые граффити. Свобода граничит с хаосом.',
        unlockRequirements: { flags: ['tenement_evidence_found'] },
        sceneBindings: [
            {
                sceneId: 'hole_club_entry',
                triggerType: 'click',
                conditions: {
                    flags: ['tenement_evidence_found'],
                    notFlags: ['shopkeeper_truant_completed'],
                },
                priority: 1,
            },
        ],
    },

    // 17. Профессор Штейнбах
    {
        id: 'prof_steinbach',
        name: 'steinbach',
        characterName: 'Профессор Штейнбах',
        description: 'Глава исследований Синтеза.',
        defaultLocationId: 'synthesis_campus',

        archetype: 'transhumanist_scholar',
        faction: 'synthesis',
        philosophy: 'transhumanism',

        questBindings: ['delivery_for_professor'],
        atmosphere: 'Стерильный хай-тек, гудение серверов.',
        sceneBindings: [
            {
                sceneId: 'university_wait_evening',
                triggerType: 'click',
                conditions: {
                    flags: ['waiting_for_kruger'],
                },
                priority: 100,
            },
            {
                sceneId: 'university_gate_denial',
                triggerType: 'click',
                conditions: {
                    notFlags: ['visited_synthesis_campus'],
                },
                priority: 90,
            },
        ],
    },

    // 18. Старушка-регистратор
    {
        id: 'old_lady_registrar',
        name: 'registrar',
        characterName: 'Старушка-регистратор',
        description: 'Небольшое окошко регистрации и справок.',
        defaultLocationId: 'info_bureau',

        archetype: 'registrar',
        faction: 'fjr',

        services: ['information', 'registration'],
        questBindings: ['first_steps_in_freiburg'],
        atmosphere: 'Тёплый уголок с замусоленными бумажками. Старушка приветливо кивает каждому новому лицу.',
        unlockRequirements: {
            flags: ['arrived_at_freiburg'],
        },
        sceneBindings: [
            {
                sceneId: 'info_bureau_meeting',
                triggerType: 'click',
                conditions: {
                    flags: ['arrived_at_freiburg'],
                    notFlags: ['visited_info_bureau'],
                },
                priority: 10,
            },
            {
                sceneId: 'info_bureau_return',
                triggerType: 'click',
                conditions: {
                    flags: ['arrived_at_freiburg', 'visited_info_bureau'],
                },
                priority: 1,
            },
        ],
    },

    // 19. Люда (Барменша)
    {
        id: 'luda_bartender',
        name: 'luda',
        characterName: 'Люда',
        description: 'Хозяйка бара "У Люды".',
        defaultLocationId: 'ludas_bar',

        archetype: 'bartender',
        faction: 'civilians',

        services: ['rumors', 'drinks', 'rest'],
        dialogues: ['luda_gossip_dialog', 'luda_shopkeeper_info'],
        questBindings: ['shopkeeper_truant'],

        atmosphere: 'Тусклый свет, запах дешёвого пива и табака. Люда протирает стаканы за стойкой.',
        sceneBindings: [
            {
                sceneId: 'luda_introduction',
                triggerType: 'click',
                conditions: {
                    flags: ['arrived_at_freiburg'],
                },
                priority: 1,
            },
        ],
    },

    // 20. Карапуз
    {
        id: 'karapuz',
        name: 'karapuz',
        characterName: 'Карапуз',
        description: 'Торговец и посредник на Швабской площади.',
        defaultLocationId: 'schwabian_square',

        archetype: 'street_kid',
        faction: 'street_kids',

        dialogues: ['karapuz_introduction', 'karapuz_quest_shopkeeper'],
        questBindings: ['shopkeeper_truant'],

        atmosphere: 'Шум торговли, крики разносчиков, запах жареных колбасок.',
        sceneBindings: [
            {
                sceneId: 'karapuz_meeting',
                triggerType: 'click',
                conditions: {
                    flags: ['arrived_at_freiburg'],
                    notFlags: ['met_karapuz'],
                },
                priority: 1,
            },
        ],
    },

    // 21. Фленс
    {
        id: 'flens_merchant',
        name: 'flens',
        characterName: 'Фленс',
        description: 'Торговец на главном рынке.',
        defaultLocationId: 'main_market_flens',

        archetype: 'merchant',
        faction: 'traders',

        services: ['trade', 'information'],
        dialogues: ['flens_introduction', 'flens_shopkeeper_details'],
        questBindings: ['shopkeeper_truant'],
        atmosphere: 'Аккуратная лавка с разнообразным товаром. Фленс щурится на каждого покупателя.',
    }
]
