// ==UserScript==
// @name        真实世界 stat_data Schema
// @version     1.1.0
// @description 注册 stat_data zod schema for RealWorld 言灵穿越卡
// @author      RealWorld Project
// @match       *://*/*
// ==/UserScript==

(function() {
  'use strict';

  const StatDataSchema = z.object({
    user: z.object({
      name: z.string(),
      gender: z.enum(['男', '女']),
      birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      height: z.number().int().min(100).max(250),
      appearance: z.string(),
      clothing_style: z.string(),
      devices: z.object({
        phone: z.string(),
        laptop: z.string(),
      }).strict(),
      background: z.object({
        birthplace: z.string(),
        education: z.string(),
        current_status: z.string(),
        residence: z.string(),
      }).strict(),
      arrival_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }).strict(),

    time: z.object({
      current_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      day_count: z.number().int().min(0),
    }).strict(),

    geass: z.record(z.string().regex(/^[a-z]+_\d{3}$/), z.object({
      name: z.string(),
      description: z.string(),
      type: z.string(),
      total_uses: z.number().int().min(0),
      use_history: z.record(z.string().regex(/^[a-z]+_\d{3}$/), z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        target: z.string(),
        effect_desc: z.string(),
      }).strict()),
    }).strict()),

    tasks: z.record(z.string().regex(/^[a-z]+_\d{3}$/), z.object({
      name: z.string(),
      type: z.enum(['主线', '支线', '日常', '机遇']),
      goal: z.string(),
      status: z.enum(['进行中', '已完成', '已失败']),
      created_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }).strict()),

    npc_relations: z.record(z.string().regex(/^[a-z]+_\d{3}$/), z.object({
      name: z.string(),
      relationship: z.string(),
      impression: z.number().int().min(-100).max(100),
      known_since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      context: z.object({
        current_mood: z.string(),
        attitude_reason: z.string(),
        relationship_goal: z.string(),
        taboos: z.array(z.string()),
        unresolved_promises: z.array(z.string()),
      }).strict(),
    }).strict()),

    sexual: z.record(z.string().regex(/^[a-z]+_\d{3}$/), z.object({
      virgin: z.boolean(),
      virgin_exceptions: z.array(z.string()).optional(),
      body_count: z.number().int().min(0),
      relationship_status: z.string(),
      context: z.object({
        current_mood: z.string(),
        attitude_reason: z.string(),
        relationship_goal: z.string(),
        taboos: z.array(z.string()),
        unresolved_promises: z.array(z.string()),
      }).strict(),
      cycle: z.object({
        last_period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        cycle_length: z.number().int().min(1),
        period_length: z.number().int().min(1),
        phase: z.enum(['月经期', '卵泡期', '排卵期', '黄体期']),
      }).strict(),
      pregnancy: z.object({
        is_pregnant: z.boolean(),
        conception_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        weeks: z.number().int().min(0).optional(),
        due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      }).strict(),
    }).strict()),

    reputation: z.record(z.string().regex(/^[a-z]+_\d{3}$/), z.object({
      value: z.number().int().min(-100).max(100),
      label: z.string(),
    }).strict()),

    world: z.object({
      known_regions: z.record(z.string().regex(/^[a-z]+_\d{3}$/), z.object({
        name: z.string(),
        description: z.string(),
        connections: z.array(z.string()),
      }).strict()),
      location_library: z.record(z.string().regex(/^[a-z]+_\d{3}$/), z.object({
        name: z.string(),
        region: z.string(),
        description: z.string(),
        visited_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        notes: z.string(),
      }).strict()),
    }).strict(),

    situation: z.object({
      current: z.string(),
      opportunities: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        suggestions: z.array(z.string()).max(5),
      }).strict()),
    }).strict(),

    items: z.record(z.string().regex(/^[a-z]+_\d{3}$/), z.object({
      name: z.string(),
      quantity: z.number().int().min(0),
      description: z.string().optional(),
    }).strict()),

    assets: z.object({
      cash: z.number().min(0),
      bank: z.number().min(0),
      companies: z.record(z.string().regex(/^[a-z]+_\d{3}$/), z.object({
        name: z.string(),
        shares: z.string(),
      }).strict()),
      estates: z.record(z.string().regex(/^[a-z]+_\d{3}$/), z.object({
        name: z.string(),
        address: z.string(),
        area: z.string().optional(),
        value: z.number().optional(),
      }).strict()),
      vehicles: z.record(z.string().regex(/^[a-z]+_\d{3}$/), z.object({
        name: z.string(),
        plate: z.string(),
      }).strict()),
    }).strict(),

    _meta: z.object({
      schema_version: z.string(),
      uid_counters: z.record(z.string(), z.number().int().min(0)),
    }).strict(),
  });

  if (typeof registerMvuSchema === 'function') {
    registerMvuSchema('stat_data', StatDataSchema);
    console.log('[RealWorld] stat_data schema registered v1.1.0');
  } else {
    console.warn('[RealWorld] registerMvuSchema not available — MVU not loaded?');
  }
})();
