import { z } from 'zod';

// ============================================================
// RealWorld 言灵穿越 · stat_data schema
// Version: 1.1.0
//
// 2026-07-26 v1.0.0 — initial release
// 2026-07-26 v1.1.0 — add user.*(height/appearance/clothing_style/
//   devices/background), items, assets; fix missing WorldSchema
// ============================================================

// ---------- helpers ----------

const DateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const UidString = z.string().regex(/^[a-z]+_\d{3}$/);

// ---------- ① user ----------

const DeviceSchema = z.object({
  phone: z.string(),
  laptop: z.string(),
}).strict();

const BackgroundSchema = z.object({
  birthplace: z.string(),
  education: z.string(),
  current_status: z.string(),
  residence: z.string(),
}).strict();

const UserSchema = z.object({
  name: z.string(),
  gender: z.enum(['男', '女']),
  birth_date: DateString,
  height: z.number().int().min(100).max(250),
  appearance: z.string(),
  clothing_style: z.string(),
  devices: DeviceSchema,
  background: BackgroundSchema,
  arrival_date: DateString,
}).strict();

// ---------- ② time ----------

const TimeSchema = z.object({
  current_date: DateString,
  day_count: z.number().int().min(0),
}).strict();

// ---------- ③ geass ----------

const GeassUseSchema = z.object({
  date: DateString,
  target: z.string(),
  effect_desc: z.string(),
}).strict();

const GeassEntrySchema = z.object({
  name: z.string(),
  description: z.string(),
  type: z.string(),
  total_uses: z.number().int().min(0),
  use_history: z.record(UidString, GeassUseSchema),
}).strict();

// ---------- ④ tasks ----------

const TaskSchema = z.object({
  name: z.string(),
  type: z.enum(['主线', '支线', '日常', '机遇']),
  goal: z.string(),
  status: z.enum(['进行中', '已完成', '已失败']),
  created_date: DateString,
  deadline: DateString.optional(),
}).strict();

// ---------- ⑤ npc_relations ----------

const RelationContextSchema = z.object({
  current_mood: z.string(),
  attitude_reason: z.string(),
  relationship_goal: z.string(),
  taboos: z.array(z.string()),
  unresolved_promises: z.array(z.string()),
}).strict();

const NpcRelationEntrySchema = z.object({
  name: z.string(),
  relationship: z.string(),
  impression: z.number().int().min(-100).max(100),
  known_since: DateString,
  context: RelationContextSchema,
}).strict();

// ---------- ⑥ sexual ----------

const CyclePhaseSchema = z.object({
  last_period_start: DateString,
  cycle_length: z.number().int().min(1),
  period_length: z.number().int().min(1),
  phase: z.enum(['月经期', '卵泡期', '排卵期', '黄体期']),
}).strict();

const PregnancySchema = z.object({
  is_pregnant: z.boolean(),
  conception_date: DateString.optional(),
  weeks: z.number().int().min(0).optional(),
  due_date: DateString.optional(),
}).strict();

const SexualEntrySchema = z.object({
  virgin: z.boolean(),
  virgin_exceptions: z.array(z.string()).optional(),
  body_count: z.number().int().min(0),
  relationship_status: z.string(),
  context: RelationContextSchema,
  cycle: CyclePhaseSchema,
  pregnancy: PregnancySchema,
}).strict();

// ---------- ⑦ reputation ----------

const ReputationEntrySchema = z.object({
  value: z.number().int().min(-100).max(100),
  label: z.string(),
}).strict();

// ---------- ⑧ world ----------

const RegionEntrySchema = z.object({
  name: z.string(),
  description: z.string(),
  connections: z.array(z.string()),
}).strict();

const LocationEntrySchema = z.object({
  name: z.string(),
  region: z.string(),
  description: z.string(),
  visited_date: DateString,
  notes: z.string(),
}).strict();

const WorldSchema = z.object({
  known_regions: z.record(UidString, RegionEntrySchema),
  location_library: z.record(UidString, LocationEntrySchema),
}).strict();

// ---------- ⑨ situation ----------

const OpportunitySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  suggestions: z.array(z.string()).max(5),
}).strict();

const SituationSchema = z.object({
  current: z.string(),
  opportunities: z.array(OpportunitySchema),
}).strict();

// ---------- ⑩ items ----------

const ItemEntrySchema = z.object({
  name: z.string(),
  quantity: z.number().int().min(0),
  description: z.string().optional(),
}).strict();

// ---------- ⑪ assets ----------

const CompanyEntrySchema = z.object({
  name: z.string(),
  shares: z.string(),
}).strict();

const EstateEntrySchema = z.object({
  name: z.string(),
  address: z.string(),
  area: z.string().optional(),
  value: z.number().optional(),
}).strict();

const VehicleEntrySchema = z.object({
  name: z.string(),
  plate: z.string(),
}).strict();

const AssetsSchema = z.object({
  cash: z.number().min(0),
  bank: z.number().min(0),
  companies: z.record(UidString, CompanyEntrySchema),
  estates: z.record(UidString, EstateEntrySchema),
  vehicles: z.record(UidString, VehicleEntrySchema),
}).strict();

// ---------- _meta (UID counters, schema version) ----------

const MetaSchema = z.object({
  schema_version: z.string(),
  uid_counters: z.record(z.string(), z.number().int().min(0)),
}).strict();

// ============================================================
// Root
// ============================================================

export const StatDataSchema = z.object({
  user: UserSchema,
  time: TimeSchema,
  geass: z.record(UidString, GeassEntrySchema),
  tasks: z.record(UidString, TaskSchema),
  npc_relations: z.record(UidString, NpcRelationEntrySchema),
  sexual: z.record(UidString, SexualEntrySchema),
  reputation: z.record(UidString, ReputationEntrySchema),
  world: WorldSchema,
  situation: SituationSchema,
  items: z.record(UidString, ItemEntrySchema),
  assets: AssetsSchema,
  _meta: MetaSchema,
}).strict();

export type StatData = z.infer<typeof StatDataSchema>;
