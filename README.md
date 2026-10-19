<p align="center">
  <img src="assets/logo.svg" alt="Frontier Model Efficiency Map logo" width="128" />
</p>

<h1 align="center">Frontier Model Efficiency Map</h1>

<p align="center">
  把 <strong>模型能力 × Reasoning 档位 × 单任务消耗 × 订阅 Plan</strong> 放到同一张交互地图里。
</p>

<p align="center">
  <a href="https://blackkcold.github.io/frontier-model-efficiency-map/"><strong>Open Live Map ↗</strong></a>
  ·
  <a href="#怎么读这张图">How to read</a>
  ·
  <a href="#方法论">Methodology</a>
  ·
  <a href="LICENSE">MIT</a>
</p>

<p align="center">
  Data snapshot: <strong>2026-10-19</strong> · 8 providers · AA v4.3.2 · No tracking
</p>

---

## 先看体验

<p align="center">
  <a href="https://blackkcold.github.io/frontier-model-efficiency-map/">
    <img src="assets/readme-overview.svg" alt="Frontier Model Efficiency Map interface preview" width="100%" />
  </a>
</p>

这不是一个“模型排行榜”，而是一张**决策地图**：

- 顶部三张卡片直接给出当前的 **前沿性价比 / 绝对能力 / 开放权重性价比**。
- 主图把能力放在纵轴、任务消耗放在横轴，**越靠左上越优**。
- Provider、Reasoning 档位、Log 横轴、估算点、历史模型都可以即时筛选。
- 排名表、Plan 推荐与方法论继续向下展开，不需要在多个 benchmark 页面之间来回切换。

> 当前前沿性价比推荐：**GPT-6.1 Sol · Medium**。  
> 当前绝对能力最高点：**Claude Opus 5.5 · Max**。

## 交互细节

<p align="center">
  <img src="assets/readme-interaction.svg" alt="Model detail and compact tooltip preview" width="100%" />
</p>

图表交互刻意做得更克制：

- **外观设置**：右上角可选择「浅色 / 深色 / 跟随系统」；本地保存偏好，系统模式会响应系统配色变化；图表、卡片与数据表同步调整。
- **精确密集点选择环**：鼠标进入实际散点中心 12px 内才展开（原 25px）；邻近模型聚合范围缩至 34px（原 53px）。标签按照原始散点方位进行有序排布，每条连接线从真实散点延伸至对应按钮，两端使用同编号明确对应关系；边缘或空间不足时退化为可点击列表，不会随机错配。移动端点按散点展开列表。
- **点击才显示详情**：只有点击散点、展开的模型按钮或排名表的可访问行才更新模型详情；单纯悬停不会覆盖当前选择。支持 Escape 关闭、键盘选择和减少动画偏好。
- **完整详情固定显示**在筛选器与图表之间，包括 AA Intelligence、归一化能力、AA 单任务成本、修正后倍率、实测 / 估算状态。
- 点击后信息保持，手机端也不依赖 hover；如果筛选条件把当前模型隐藏，详情会自动清空。浏览器窗口尺寸/筛选状态变化会清理展开环。

## 当前覆盖

| Provider | 当前模型族 |
| --- | --- |
| OpenAI | GPT-6 Luna · GPT-6.1 Sol · GPT-6 Astra · GPT-6 Sol（历史） |
| Anthropic | Claude Haiku 5.5 · Claude Sonnet 5.5 · Claude Opus 5.5 · Claude Fable 5.1 |
| Google | Gemini 3.8 Flash · Gemini 4 Argon |
| DeepSeek | V4.1 Flash-1017 Max（当前 AA 实测 45 / $0.26）、High（待测） · V4.1 Flash 0910（历史 AA） |
| Z.ai | GLM-5.3 · GLM-5.3 Flash |
| Kimi | Kimi K3 |
| Xiaomi | MiMo V2.6 Pro · MiMo V2.6 Flash（AA 实测）；Pro UltraSpeed（独立服务档，非 AA 实测点） |
| xAI | Grok 4.7 · Grok 4.6（官方 API + AA 独立测量档位） |

### 当前快照的三个锚点

| 目标 | 推荐 | AA Index | AA task cost | 备注 |
| --- | --- | ---: | ---: | --- |
| 前沿性价比 | **GPT-6.1 Sol · Medium** | 48 | $0.21 | 能力门槛之上的最低实测任务成本 |
| 绝对能力 | **Claude Opus 5.5 · Max** | 58 | $5.98 | 当前页面统一能力口径最高点 |
| 开放权重性价比 | **MiMo V2.6 Pro** | 46 | $0.13 | AA 实测，能力高且成本低于原 GLM-5.3 Flash 推荐 |

## 怎么读这张图

### 1. 纵轴：能力

默认使用 **Artificial Analysis Intelligence Index v4.3.2**，并把当前最高点线性归一为 100：

```text
normalized capability = AA Intelligence Index / 58 × 100
```

这样不同 Provider 不需要混用各自的厂商 benchmark。

### 2. 横轴：单任务消耗

默认使用 Artificial Analysis 的 **Cost per Intelligence Index Task**，再以 GPT-6 Luna Max 作为 1× 基准：

```text
consumption ratio = corrected task cost / corrected GPT-6 Luna Max task cost
```

跨厂商的 ChatGPT allowance、Claude session cap、Kimi credits 等内部额度并不等价，所以主图不直接把订阅额度强行换算到同一条轴上。

### 3. 长 Agent 修正

AA 的 task cost 已包含 reasoning token；页面额外提供一个**可关闭的长任务修正层**，用于近似持续 Agent loop 的订阅额度体感：

| Effort | 修正 |
| --- | ---: |
| Low | 1.00× |
| Medium | 1.00× |
| High | 1.05× |
| XHigh | 1.10× |
| Max | 1.18× |

它不是厂商官方计费倍率。

## 数据可信度

页面把三类信息明确区分：

**官方信息**  
用于确认模型是否存在、Reasoning / Effort 档位、订阅 Plan、价格、额度和产品政策。

**统一第三方实测**  
Artificial Analysis 用于跨厂商能力与单任务成本的统一比较。

**显式估算**  
只有在“官方确认该档位存在、但当前 AA 没有对应统一测量”时才补点；UI 使用叉形空心点，并允许一键隐藏。

当前估算点包括 Gemini 3.8 Flash Low、历史版 DeepSeek V4.1 Flash 0910 Low / High、GLM-5.3 High、Kimi K3 High。1017 Max 已获得独立 AA 实测；1017 High 尚无匹配的独立 AA 数值，单独标为待测，不生成模型能力或成本插值。

## 方法论

“前沿性价比”不是简单做 **能力 ÷ 价格**。极便宜但能力明显偏低的模型会在这种公式里被数学性放大，因此本项目采用：

1. 先设能力门槛：当前为 **AA Index ≥ 48**；
2. 再在满足门槛的实测点中寻找最低任务成本；
3. 估算点不参与“最高能力”结论；
4. Plan 推荐与 API task cost 分开处理。

这让推荐更接近“这个模型能不能完成目标任务，以及完成它要消耗多少资源”。

## 2026-10-19 AA 实测更新：DeepSeek V4.1 Flash 1017 Max

- **Artificial Analysis 于 2026-10-18 新增独立模型评测**：DeepSeek V4.1 Flash **1017 Max** 的 **Intelligence Index v4.3.2 = 45**、**Cost per Intelligence Index Task = $0.26**，输出速度约 **230 tokens/s**。上一代 0910 Max 对应的历史固定快照为 **39 / $0.27**；能力约提升 15.4%，AA 同口径单任务成本小幅下降。请勿将 AA 的实时网页单价与该历史固定快照混为一次重测。[AA 1017 Max 详情](https://artificialanalysis.ai/zh/models/deepseek-v4-1-flash-1017) · [AA 全局榜单](https://artificialanalysis.ai/leaderboards/models?is_open_weights=open_source&size_class=small)
- **显示与评测口径**：1017 **Max 正式加入能力–成本散点图和排名表**，版本对照卡展示 45 / $0.26；1017 **High** 仍是独立待测记录，四项 AA/成本指标继续 N/A，不以 Max 结果推算 High。0910 None / Low / High / Max 四项旧点继续默认显示，标明为历史版本，历史点不参与当前 Pareto 前沿。其他模型数据与长 Agent 修正规则保持原样。
- **推荐评估**：当前绝对能力仍为 Claude Opus 5.5 Max（58）；能力门槛 AA Index ≥48 的前沿性价比仍是 GPT-6.1 Sol Medium；开放权重的既有 MiMo V2.6 Pro（46 / $0.13）对比新 DeepSeek 1017 Max（45 / $0.26）仍同时拥有更高指数和更低成本，故推荐**不变**。Plan 推荐、API 峰谷定价与政策均不改动。

## 2026-10-18 DeepSeek V4.1 Flash 1017（10 月 17 日官方发布）

**可见性修复（10/18，当时数据状态）**：1017 当前版最初仅在版本对照卡和排名表中显示 N/A，直到 10/18 AA Max 新实测发布。现已按 10/19 章节补入 1017 Max 实测；1017 High 仍为 N/A。0910 上代的四个散点及历史 AA 数值在图表和表格中默认显示。上代历史值不进入当前 Pareto 前沿。用户可以同时查看两版，不会将旧版成绩冒充 1017 的评测。

- **现行模型**：DeepSeek 已将 `DeepSeek-V4.1-Flash` 升级至 **`DeepSeek-V4.1-Flash-1017`**，其网页、App 及 API 全部使用新模型；正式 API 名称仍为 **`deepseek-flash`**，旧 `deepseek-v4-flash` 与 `deepseek-v4-flash-vision-exp` 兼容别名也已路由至新版本。权重已在 Hugging Face 发布。[官方更新日志](https://api-docs.deepseek.com/zh-cn/updates/) · [官方发布](https://api-docs.deepseek.com/zh-cn/news/news261017/) · [开源权重](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017)
- **Token 价格与 effort 不变**：高峰期每百万 tokens 的缓存命中输入 **$0.006**、非缓存输入 **$0.30**、输出 **$1.20**；低谷依次 **$0.003 / $0.15 / $0.60**。高峰期为 UTC 工作日 01:00–04:00 与 06:00–10:00（不含中国公众假日），其余时间均为谷段。仍提供非思考与 low/high/max 思考档位；暂无新增 reasoning 档位证据。[官方价格 / 高峰时段](https://api-docs.deepseek.com/quick_start/pricing/) · [Thinking Mode](https://api-docs.deepseek.com/guides/thinking_mode/)
- **官方公布能力（不能等同 AA 复测）**：Terminal-Bench 4.0 **31.2 → 42.3**、DeepSWE v1.1 **74.2 → 77.0**、ProgramBench **20.3 → 29.1**、NL2Repo-Bench **65.4 → 68.2**、Automation-Bench **54.8 → 60.5**。厂商还报告更短输出与更快任务完成，但因测试 Harness 与统计口径不同，不据此推算 AA Intelligence Index 或每任务美元成本。[DeepSeek 原始成绩及测试说明](https://api-docs.deepseek.com/zh-cn/updates/)
- **新增 Search / Fetch（10/17）**：两个独立工具接口均收费 **$0.75/1000 次成功调用**，通过 DeepSeek Harness、Claude Code、Codex 的服务端 Search / Fetch 请求当前免请求费，**北京时间 2026-11-01 00:00** 起按次计费；模型 tokens 单独收费。[官方计费与日期](https://api-docs.deepseek.com/quick_start/pricing/) · [工具 API 使用指南](https://api-docs.deepseek.com/zh-cn/guides/search/)
- **AA 版本隔离**：目前已确认 AA 的 None **25 / $0.15**、Max **39 / $0.27** 及 Low/High 插值仍属于 **2026-09-10 旧 checkpoint**，不是 1017 的独立测量。保留这四个旧散点并标为 **0910 (historical AA)**，默认显示、并明确标记为历史 AA 版本。现行 1017 版最初以图表上方版本对照卡及模型列表 N/A 行独立呈现；10/18 已取得 Max 同口径测量并于 10/19 补入图表，其他未经实测档位仍留空，**不使用官方得分填充第三方能力坐标**。[AA 历史模型发布页](https://artificialanalysis.ai/models/releases/deepseek-v4-1-flash)
- **推荐与算法**：前沿性价比 GPT-6.1 Sol Medium、绝对能力 Claude Opus 5.5 Max、开放权重性价比 MiMo V2.6 Pro，以及现有 Plan 推荐暂不变化；High 1.05×、XHigh 1.10×、Max 1.18× 修正保留。本条记录的是 10/18 之前的模型政策更新；1017 Max 的 AA 实测已在上方 10/19 章节补入。

## 2026-10-17 Gemini 4 Argon GA 与 Kimi 中国区新套餐

本轮只录入已有厂商**官方生效的模型可用性与订阅额度政策**。Artificial Analysis 指标继续沿用可比实测快照，不因官方自报指标或服务速度上升而擅自生成新散点。

- **Google · Gemini 4 Argon（10 月 13 日 GA）**：Google Gemini API 已正式提供 `gemini-4-argon`；官方确认 Low / Medium / High 思考强度，默认 Medium。付费 API 目前为引导价：**$2/百万输入 tokens、$10/百万输出 tokens（含思考输出）**，隐式缓存命中可享输入 95% 折扣；**2026-12-01** 起将变为 **$4/$20**。Gemini App 与 Search AI Mode 对符合条件的 **Google AI Pro / Ultra** 开放；在 **Antigravity** 中的 Argon 为 **Google AI Ultra** 专属，不能把 App 订阅权益解释为 API 赠送额度。当前主图保留此前可比的 **High AA 实测 53 / $1.99/task**，将生命周期由 preview 改为 current；缺少同口径 Low/Medium AA 测量，**不造估算点**。[Google 官方 GA 发布](https://blog.google/innovation-and-ai/technology/developers-tools/build-with-gemini-4-argon/) · [Gemini API 官方模型文档与价格](https://ai.google.dev/gemini-api/docs/latest-model) · [Gemini App 访问政策](https://blog.google/innovation-and-ai/products/gemini-app/gemini-4-argon-availability/)
- **Kimi · 国内新会员档（10 月 12 日官方页面核实）**：Go **¥49/月**、Plus **¥99/月**、Pro **¥199/月**、Max **¥699/月**；年付折算月费另有优惠，不能当作实际月扣费。Go 无 Kimi Code，Plus 及以上含 Kimi Code，新会员 Kimi Code **取消周限额**，仍有滚动 5 小时限额与全产品共享的月度 token 额度；同一额度池覆盖 Agent、Kimi Code、Kimi Work 等，未用完月度额度不结转。Andante、Moderato、Allegretto、Allegro 是**旧版存量订阅**，允许旧用户继续使用及续订，旧版保留 5 小时与每周限额；本次在 Plan 表保留并明确标注，不能混为新方案。[Kimi 官方中国区价格](https://www.kimi.com/help/membership/membership-pricing) · [会员权益](https://www.kimi.com/help/membership/membership-overview) · [Kimi Code 新旧规则](https://www.kimi.com/help/kimi-code/benefits)
- **推荐变化**：Kimi 国内推荐由旧版 **Moderato ¥99/月** 调整为新订阅 **Plus ¥99/月**（保留旧版供存量订户对照）；其他推荐不变：前沿性价比 GPT-6.1 Sol Medium、绝对能力 Claude Opus 5.5 Max、开放权重性价比 MiMo V2.6 Pro。API 单任务成本、订阅额和滚动限流单独标记，不能推导保证的 token 或任务次数。
- **来源时间与范围**：本页数据快照记录至 10 月 17 日，**AA 实测数值并未在本次刷新**；Google 价格按公开 API 美元价，Kimi 价格按中国区连续包月价；不同地区、老用户的购买/续订资格以各自官方结算页为准。

## 2026-10-16 xAI Grok 与密集点交互修复

- **xAI Grok 模型**：新增第八家 Provider，覆盖 Grok 4.7（官方 9/21 发布）与 Grok 4.6（官方 8/12 发布），均支持 Low / Medium / High（默认）/ XHigh 推理深度，不能关闭推理；500K 上下文。官方全球 API 在提示输入 ≤200K 时每百万 token 为 $2 输入、$0.50 缓存输入、$6 输出；超过 200K 的输入 / 缓存 / 输出分别为 $4 / $1 / $12，区域端点另可能溢价。[xAI 发布记录](https://docs.x.ai/developers/release-notes) · [推理档位](https://docs.x.ai/developers/model-capabilities/text/reasoning) · [官方定价](https://docs.x.ai/developers/pricing)
- **Grok AA 统一实测**：4.7 Low 42/$1.25、High 46/$2.73、XHigh 46/$3.74；4.6 Low 35/$0.38、Medium 43/$1.14、High 44/$1.48、XHigh 44/$1.75（AA Intelligence Index / 每任务 USD）。虽然 4.7 官方支持 Medium，但当前未确认可直接比较的 AA Medium 测量值，故不合成虚构数值。[AA 4.7 Low 对比](https://artificialanalysis.ai/models/comparisons/grok-4-7-low-vs-grok-4-7) · [AA 4.7 High 对比](https://artificialanalysis.ai/models/comparisons/grok-4-7-high-vs-grok-4-6) · [AA 4.6 对比](https://artificialanalysis.ai/models/comparisons/grok-4-6-low-vs-grok-4-6-medium)
- **The X Subscription（10/12 发布）**：新用户包含 Free $0、Plus $8、Premium $30、Super $100、Ultra $200/月，以及 Teams $30+/席位/月、Enterprise 定制；Premium/Super/Ultra 按 Plus 共用基础额度的 4×/15×/50×计，不提供可跨厂商等价换算的固定 token 总量。周额度由 Grok（Chat/Imagine/Voice/Bot）、Cursor 等共享；第三方 Cursor 模型按 API 单独付费，xAI API 也另付费；现有 SuperGrok、Cursor 与 X Premium 用户仍可保留旧方案。[官方新方案公告](https://x.ai/news/x-subscription) · [官方套餐详情](https://x.ai/pricing)
- **交互修复**：移除三张推荐模型的永久图表浮动标签；禁用原生 hover 提示与 hover 更新详情。新增密集点感知与“拟物弹簧式”模型选择环，进行画布边界约束和标签碰撞检测；仅点击按钮/散点才固定详情；触屏改为弹出列表，支持键盘操作、Esc 关闭及 reduced-motion。
- **推荐保持**：当前纳入的 AA 数据未改变 GPT-6.1 Sol Medium 前沿性价比、Claude Opus 5.5 Max 绝对能力、MiMo V2.6 Pro 开放权重性价比。Grok Premium / Super 作为最新 Plan 参与比较，但由于官方仅给共享相对额度，暂不凭空估计等价 token 总数。

## 2026-10-15 小米 MiMo V2.6 与主题升级

- **MiMo V2.6（官方 9/22 发布）**：新增 Xiaomi 第七家 Provider；AA 独立实测 MiMo V2.6 Flash（AA Index **38**，**$0.06/task**）及 Pro（**46**，**$0.13/task**）。两者只设置 `Default`，因为官方虽允许传入 `reasoning.effort`，但实际仅支持开启或关闭深度思考，无法将 low/medium/high/xhigh/max 当作独立推理强度。**不人为插值生成未测试的档位**。[AA 实测](https://artificialanalysis.ai/models/comparisons/mimo-v2-6-flash-vs-mimo-v2-6-pro) · [官方推理参数](https://mimo.mi.com/docs/en-US/api/chat/responses)
- **Pro UltraSpeed**：官方提供最高 **20× 输出速度**，API 海外实时输入 **$4.35/M**、输出 **$8.70/M**（普通 Pro 的 10×）；无独立 AA 单任务能力和成本测量，因此仅在模型说明区披露，不创建虚构的数据点。[官方 API 价格](https://mimo.mi.com/docs/pricing)
- **模型生命周期**：MiMo V2.5-Pro / V2.5 自 10/14 起自动路由至 V2.6 Pro / Flash，旧 ID 将于 **2026-10-21 10:00（北京时间）** 停用。[官方文档](https://mimo.mi.com/docs/en-US)
- **Token Plan**：加入 Lite（$6 / ¥39；4.1B Credits）、Standard（$16 / ¥99；11B）、Pro（$50 / ¥329；38B）、Max（$100 / ¥659；82B）。这些属于编码场景订阅，不与按量 API 余额通用。[官方方案](https://mimo.mi.com/docs/zh-CN/tokenplan)
- **推荐模型更新**：开放权重性价比由 GLM-5.3 Flash（42 / $0.25）改为 MiMo V2.6 Pro（46 / $0.13），原前沿性价比 GPT-6.1 Sol Medium 与绝对能力 Claude Opus 5.5 Max 不变。原有 Plan 推荐不变，新增 MiMo 四个 Plan 供对比，暂不跨厂商换算 Credits 为使用次数。
- **浅色主题**：新增「浅色 / 深色 / 跟随系统」设置，并可持久化选择；图表轴、标签、表格与 hover 同步适配浅色背景。

## 2026-10-12 官方政策补录（AA 实测值沿用 10/10 快照）

- **OpenAI GPT-6.1 Sol Ultrafast（10/8）**：这是 GPT-6.1 Sol 的低延迟服务档位，**不是新模型或新 reasoning 档位**。官方 API 定价 $12/M input、$60/M output，为 Standard 的 6×；不能把官方最高可达 8× 速度提升当作能力分数。Work / Codex 仅 Pro $500、符合条件的 Enterprise / Edu 支持；Pro $500 内含使用量按 Standard 的 8× 扣减，额度用尽后 credits 按 Standard 的 6× 扣减。Plus、Pro $100/$200 和 Business 暂不支持（购买 credits 也不解锁）。对应第三方 AA 能力/单任务成本数据未改变，**不新增虚构的 Ultrafast 测试点**。[官方产品文档](https://developers.openai.com/api/docs/models/gpt-6.1-sol) · [官方 Work/Codex 用量政策](https://help.openai.com/en/articles/20001516-managing-usage-with-gpt-6-astra-in-work-and-codex) · [官方推出公告](https://community.openai.com/t/ultrafast-is-rolling-out-today-for-gpt-6-1-sol-in-the-api-codex-and-chatgpt-work/1404475)
- **Google Gemini API 生命周期（10/8）**：`gemini-3.7-flash` 已弃用并自动路由至 `gemini-3.8-flash`，`gemini-3.5-flash` 已弃用并自动路由至 `gemini-3.6-flash`；`deep-research-pro-preview-12-2025` 已弃用，计划 **10/23 停止服务**，应迁移至 `deep-research-preview-04-2026` 或 `deep-research-max-preview-04-2026`。当前图表未包含上述已弃用旧型号，故不新增对比点。[官方 Gemini API release notes](https://ai.google.dev/gemini-api/docs/changelog)
- **推荐未调整**：前沿性价比仍为 GPT-6.1 Sol · Medium，绝对能力为 Claude Opus 5.5 · Max；订阅 Plan 推荐不变。Ultrafast 的速度、购买资格与额度消耗单独披露，不得混入同一 AA 成本/能力坐标。

## 2026-10 快照变化

- **Google AI Ultra（已于 2026-05 宣布，本次修正旧快照）**：不再是单一 $249.99/月；美国官网现列 **Ultra 5x $99.99/月**、**Ultra 20x $199.99/月**，分别提供约 AI Pro 的 5x / 20x Gemini App 与 Antigravity 用量。Google AI Plus 为 $4.99/月、Google AI Pro 为 $19.99/月（美国官网月价）。
- **Gemini App 个人账号（2026-10-09 起逐步实施）**：Google 专项通知列出 Free 手动可选 Flash-Lite；AI Plus 可选 Flash-Lite / Flash、不再提供手动 Pro；AI Pro 与 Ultra 可选 Flash-Lite / Flash / Pro。AI Plus 生效时间由 Google 单独邮件通知。*通用帮助页仍描述 Auto 自动模型路由/动态访问，故“手动不可选”不等于证明后台绝不使用高级模型；此限制也不等同 Gemini Developer API 政策。*
- **Gemini reasoning 档位**：官方 Gemini App 帮助文档列出 Low / Medium / High，可手动选择时由账户权限与模型决定。高 thinking level 可能占用更多订阅额度；这是 **Gemini App 产品设置**，未当作独立的 API 模型 benchmark 点。<https://support.google.com/gemini/answer/18648722?hl=en>
- **来源**：[Google AI 订阅官网](https://gemini.google.com/advanced) · [Google 2026 I/O 官方公告](https://blog.google/products-and-platforms/products/google-one/google-ai-subscriptions/) · [Google Gemini 访问政策](https://support.google.com/gemini/answer/17004136?hl=en) · [通用额度文档](https://support.google.com/gemini/answer/16275805?hl=en)

- **Claude Haiku 5.5（10/7）**：新增 Low / Medium / High / XHigh / Max 五个 AA 实测点；AA Index 29 → 43，AA task cost $0.02 → $0.21。官方定价（≤100K prompt）为 $0.10/M input、$0.50/M output、$0.01/M cache read。
- **Claude Sonnet 5.5（10/7）**：Anthropic 将 cache read 从 $0.20/M 下调到 $0.10/M；按当前 AA 统一口径刷新后，Low / Medium / High / XHigh / Max task cost 约为 $0.35 / $0.48 / $0.88 / $2.01 / $5.46。
- **Claude Max / Team（10/7）**：Max 5x / 20x 新增 $100 / $200 每月 Claude Platform API credit；Team 按席位发放并共享池化，最高 $500/月。该 credit 不能用于 Claude 或 Claude Code 的额外交互用量。
- **GPT-6 in ChatGPT（10/7）**：Plus / Pro / Business / Enterprise 的 Chat 默认进入 GPT-6 Sol；Pro 的 Pro reasoning 继续使用 GPT-6 Astra。Work / Codex 模型未因这次 Chat 发布而替换。
- **OpenAI Pro policy**：Pro 200 已重新开放新订阅；官方同时注明非 grandfathered 的新 Pro 订阅内含用量低于旧档。Pro 500 仍是唯一包含 Astra Ultrafast 的自助 Pro 档。
- **Claude Fable 5.1**：继续保留当前实测前沿点。
- **Gemini 4 Argon（当时状态）**：10 月 10 日快照仍为 limited rollout / preview；该状态已被 **2026-10-13 GA** 的官方发布取代，现以页面顶部新章节为准。
- **GPT-6 Sol**：保留历史对比，但默认隐藏，由 GPT-6.1 Sol 取代当前位置。

**推荐结论未变化**：前沿性价比仍为 **GPT-6.1 Sol · Medium**；绝对能力仍为 **Claude Opus 5.5 · Max**。原有跨厂商 Plan 推荐不变；Google 的新 Ultra 5x 现在提供介于 AI Pro 与最高 Ultra 之间的重度使用选项。Claude Max 新增 API credit 价值仍保留。

更完整的来源链接在网页的 **Methodology & Sources** 区域以及 `data.js` 中。

## 本地运行

这是纯静态站点，不需要构建步骤：

```bash
python3 -m http.server 8000
```

然后打开 `http://localhost:8000`。

## Project

- Live site: https://blackkcold.github.io/frontier-model-efficiency-map/
- License: [MIT](LICENSE)
- Contribution: [CONTRIBUTING.md](CONTRIBUTING.md)
- Security: [SECURITY.md](SECURITY.md)
- Validation: `Static validation`
- Deployment: GitHub Pages
- Governance: CODEOWNERS + protected `main`

---

<p align="center">
  <sub>Static site · No analytics · No tracking · Built for GitHub Pages</sub>
</p>
