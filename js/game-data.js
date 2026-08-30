(function () {
  const chapters = [
    {
      id: "chapter-1",
      number: "第一站",
      title: "智慧车站・一张车票的旅程",
      objective: "帮助三位旅客解决出行难题",
      background: "assets/backgrounds/chapter-1.webp",
      bgm: "assets/music/chapter-1.m4a",
      spawn: { x: 800, y: 790, direction: "up" },
      portal: { x: 800, y: 112, radius: 54, label: "下一关入口", color: "#33d5ff", width: 184 },
      badge: "智慧出行徽章",
      chapterArchive: "archive-smart-station",
      interactions: [
        {
          id: "c1-mobility",
          kind: "quiz",
          main: true,
          name: "行动不便的旅客",
          speaker: "行动不便的旅客",
          npcSprite: "mobility-passenger",
          npcHeight: 94,
          x: 1090,
          y: 420,
          prompt: "我的腿脚不太方便，担心检票和上车时跟不上，应该怎么办呢？",
          choices: ["让他自己慢慢走", "帮助联系重点旅客服务", "建议重新买票"],
          correct: 1,
          feedback: "行动不便等特殊需求旅客，可通过 12306 预约重点旅客服务，工作人员会做好站车衔接。科技让服务更便捷，工作人员让服务落到实处。",
          promptVoice: "c1_mobility_prompt",
          feedbackVoice: "c1_mobility_feedback",
          archive: {
            id: "archive-key-passenger",
            category: "智慧车站",
            title: "重点旅客服务",
            body: "行动不便等特殊需求旅客，可通过 12306 预约重点旅客服务，由工作人员做好站车衔接。"
          }
        },
        {
          id: "c1-id-card",
          kind: "quiz",
          main: true,
          name: "遗失身份证的旅客",
          speaker: "遗失身份证的旅客",
          npcSprite: "id-passenger",
          x: 505,
          y: 330,
          prompt: "我已经买好票了，可身份证刚刚丢了，还能乘车吗？",
          choices: ["直接放弃乘车", "办理临时乘车身份证明", "再买一张车票"],
          correct: 1,
          feedback: "符合条件的旅客可按规定办理临时乘车身份证明。智慧铁路不只有智能设备，更有完整的服务保障体系。",
          promptVoice: "c1_id_prompt",
          feedbackVoice: "c1_id_feedback",
          archive: {
            id: "archive-temp-id",
            category: "智慧车站",
            title: "临时乘车身份证明",
            body: "符合条件的旅客可按规定办理临时乘车身份证明，已购票不等于因证件遗失就必须放弃行程。"
          }
        },
        {
          id: "c1-elderly",
          kind: "quiz",
          main: true,
          name: "老年旅客",
          speaker: "老年旅客",
          npcSprite: "elderly-passenger",
          x: 800,
          y: 220,
          prompt: "我不太会用智能手机，到检票口该怎样检票呢？",
          choices: ["让老人自己研究手机", "引导使用适老化服务或人工通道", "告知无法乘车"],
          correct: 1,
          feedback: "数字化不会落下任何人。适老化服务、人工窗口、人工通道，都是铁路服务的重要组成部分。真正有温度的科技，要让每一个人都能用得上。",
          promptVoice: "c1_elderly_prompt",
          feedbackVoice: "c1_elderly_feedback",
          archive: {
            id: "archive-age-friendly",
            category: "智慧车站",
            title: "适老化与人工服务",
            body: "适老化服务、人工窗口和人工通道与数字化设备共同构成完整的铁路客运服务。"
          }
        },
        {
          id: "c1-service-desk",
          kind: "info",
          main: false,
          name: "服务台工作人员",
          speaker: "服务台工作人员",
          npcSprite: "station-staff",
          x: 810,
          y: 525,
          prompt: "通过铁路 12306 的重点旅客预约入口，可以填写乘车信息与服务需求。车站接到预约后，会安排站车衔接。建议有需要的旅客尽早提交预约。",
          promptVoice: "c1_service_info",
          archive: {"id":"archive-love-booking","category":"智慧车站","title":"12306 爱心预约","body":"重点旅客可通过铁路 12306 提交服务预约，填写乘车信息与服务需求，便于车站提前组织站车衔接。"}
        },
        {
          id: "c1-robot",
          kind: "info",
          main: false,
          name: "智能导航机器人",
          speaker: "智能导航机器人",
          npcSprite: "navigation-robot",
          x: 600,
          y: 645,
          prompt: "我能提供车站室内导航与位置指引。结合地图和定位技术，旅客可以更快找到检票口、服务台与候车区域。",
          promptVoice: "c1_robot_info",
          archive: {"id":"archive-indoor-navigation","category":"智慧车站","title":"车站室内导航","body":"室内地图与定位技术帮助旅客在大型车站内快速找到检票口、服务台和候车区域。"}
        },
        {
          id: "c1-gate",
          kind: "info",
          main: false,
          name: "自助检票闸机",
          speaker: "铁世一",
          x: 1000,
          y: 225,
          prompt: "电子客票把旅客、车次与席位信息关联起来。闸机核验有效乘车凭证后快速放行，同时仍保留人工服务通道。",
          promptVoice: "c1_gate_info",
          archive: {"id":"archive-e-ticket","category":"智慧车站","title":"电子客票核验","body":"电子客票系统关联旅客、车次与席位信息，闸机完成核验后放行，并与人工通道共同保障通行。"}
        }
      ]
    },
    {
      id: "chapter-2",
      number: "第二站",
      title: "未来列车・速度背后的科技",
      objective: "完成车头、行车安全与气密性三项调试",
      background: "assets/backgrounds/chapter-2.webp",
      bgm: "assets/music/chapter-2.m4a",
      spawn: { x: 270, y: 595, direction: "right" },
      portal: { x: 1510, y: 585, radius: 50, label: "下一关入口", color: "#33d5ff", width: 184 },
      badge: "智慧高铁徽章",
      chapterArchive: "archive-future-train",
      interactions: [
        {
          id: "c2-nose",
          kind: "quiz",
          main: true,
          name: "车头外形选型",
          speaker: "铁世一",
          x: 780,
          y: 560,
          prompt: "哪一种设计更有利于高速列车降低空气阻力？",
          choices: ["方正宽大车头", "长流线型车头", "完全垂直车头"],
          correct: 1,
          feedback: "高速列车采用流线型车头，是为了让空气更顺畅地流过车体。看似简单的外形变化，背后是无数次仿真计算和风洞试验。",
          promptVoice: "c2_nose_prompt",
          feedbackVoice: "c2_nose_feedback",
          archive: {"id":"archive-aerodynamics","category":"未来列车","title":"高速列车空气动力学","body":"长流线型车头有助于降低高速运行时的空气阻力，其设计需要仿真计算和风洞试验验证。"}
        },
        {
          id: "c2-wind",
          kind: "quiz",
          main: true,
          name: "大风应急处置",
          speaker: "动车组司机",
          npcSprite: "train-driver",
          x: 255,
          y: 535,
          prompt: "前方区段监测到大风。为了保证运行安全，应该怎样处置？",
          choices: ["维持原速运行", "根据系统提示采取限速措施", "全速通过"],
          correct: 1,
          feedback: "铁路运行永远把安全放在第一位。系统会综合线路、列车、环境监测信息，按安全规则采取对应措施。安全抵达，才是快的意义。",
          promptVoice: "c2_wind_prompt",
          feedbackVoice: "c2_wind_feedback",
          archive: {"id":"archive-wind-safety","category":"未来列车","title":"大风监测与限速","body":"铁路系统综合线路、列车和环境监测信息，按安全规则采取限速等措施，把安全置于速度之前。"}
        },
        {
          id: "c2-airtight",
          kind: "quiz",
          main: true,
          name: "气密性调试",
          speaker: "铁世一",
          x: 880,
          y: 580,
          prompt: "高速列车会车或通过隧道时气压变化明显。车门密封条压力应调到哪里？",
          choices: ["低于标准区间", "保持标准区间", "越高越好"],
          correct: 1,
          feedback: "高速列车会车、过隧道时会产生剧烈气压变化，良好的气密性是保障乘坐舒适度的关键，也是列车高速运行的核心技术之一。",
          promptVoice: "c2_airtight_prompt",
          feedbackVoice: "c2_airtight_feedback",
          archive: {"id":"archive-airtight","category":"未来列车","title":"车体气密性","body":"良好气密性能够减缓会车和过隧道时的车内压力变化，是高速列车舒适性的重要保障。"}
        },
        {
          id: "c2-mechanic",
          kind: "info",
          main: false,
          name: "随车机械师",
          speaker: "随车机械师",
          npcSprite: "mechanic",
          x: 1130,
          y: 565,
          prompt: "列车运行时，车载系统会持续监测关键设备状态。出现异常趋势后，系统及时预警，再由专业人员判断和处置。",
          promptVoice: "c2_mechanic_info",
          archive: {"id":"archive-train-monitoring","category":"未来列车","title":"全车状态监测","body":"车载系统持续采集关键设备状态并提供故障预警，专业人员依据数据完成判断与处置。"}
        },
        {
          id: "c2-pantograph",
          kind: "info",
          main: false,
          name: "受电弓模型",
          speaker: "铁世一",
          x: 1285,
          y: 550,
          prompt: "受电弓要在高速运行中与接触网保持稳定接触。主动控制和结构优化能提升受流稳定性，为列车持续获得电能。",
          promptVoice: "c2_pantograph_info",
          archive: {"id":"archive-pantograph","category":"未来列车","title":"稳定受流技术","body":"受电弓通过结构优化和主动控制，在高速运行中尽量保持与接触网稳定接触。"}
        },
        {
          id: "c2-power",
          kind: "info",
          main: false,
          name: "座椅充电口",
          speaker: "铁世一",
          x: 575,
          y: 565,
          prompt: "小小的充电口背后，是列车辅助供电系统。牵引供电负责让列车前进，辅助供电则服务照明、空调和旅客用电等设备。",
          promptVoice: "c2_power_info",
          archive: {"id":"archive-aux-power","category":"未来列车","title":"牵引与辅助供电","body":"牵引供电为列车运行提供动力，辅助供电服务照明、空调和旅客用电等设备。"}
        }
      ]
    },
    {
      id: "chapter-3",
      number: "第三站",
      title: "钢轨守护区・看不见的安全防线",
      objective: "完成隐患排查、信号确认与绿色制动任务",
      background: "assets/backgrounds/chapter-3.webp",
      bgm: "assets/music/chapter-3.m4a",
      spawn: { x: 800, y: 700, direction: "up" },
      portal: { x: 1500, y: 485, radius: 50, label: "下一关入口", color: "#59f18d", width: 184 },
      badge: "安全守护徽章",
      chapterArchive: "archive-rail-guard",
      interactions: [
        {
          id: "c3-inspection",
          kind: "quiz",
          main: true,
          name: "安全隐患排查",
          speaker: "铁世一",
          x: 805,
          y: 495,
          prompt: "检测系统给出三处图像：A 区钢轨正常，B 区扣件异常，C 区线路正常。应重点复核哪个区域？",
          choices: ["A区域A", "B区域B", "C区域C"],
          correct: 1,
          feedback: "智能检测设备可采集大量线路图像与状态数据，AI 辅助工作人员快速筛查可疑区域，再由专业人员确认处置。AI 是帮手，不是替代，这就是人机协同的运维模式。",
          promptVoice: "c3_inspection_prompt",
          feedbackVoice: "c3_inspection_feedback",
          archive: {"id":"archive-ai-inspection","category":"钢轨守护","title":"AI 辅助巡检","body":"智能检测设备采集线路图像与状态数据，AI 辅助筛查可疑区域，最终由专业人员确认处置。"}
        },
        {
          id: "c3-signal",
          kind: "quiz",
          main: true,
          name: "信号机确认",
          speaker: "线路工作人员",
          npcSprite: "rail-worker",
          x: 230,
          y: 500,
          prompt: "请和我共同确认信号机显示状态。面对行车指令，正确做法是什么？",
          choices: ["凭经验越过信号", "按显示状态与行车指令核对执行", "只看列车速度"],
          correct: 1,
          feedback: "铁路信号系统是列车运行的‘眼睛’，从地面信号到列控系统，层层保障着行车安全与秩序。",
          promptVoice: "c3_signal_prompt",
          feedbackVoice: "c3_signal_feedback",
          archive: {"id":"archive-signal-system","category":"钢轨守护","title":"铁路信号系统","body":"地面信号与列控系统共同传递和执行行车许可，保障列车运行安全与秩序。"}
        },
        {
          id: "c3-regeneration",
          kind: "quiz",
          main: true,
          name: "再生制动能量利用",
          speaker: "铁世一",
          x: 1210,
          y: 500,
          prompt: "重载货运列车下坡制动时，怎样把部分动能重新利用起来？",
          choices: ["全部转化为热量散失", "通过再生制动转化为电能", "关闭所有电气设备"],
          correct: 1,
          feedback: "再生制动技术可将列车制动的部分动能转化为电能，回馈电网或用于列车其他设备。铁路不仅要跑得快，更要跑得绿色、高效。",
          promptVoice: "c3_regen_prompt",
          feedbackVoice: "c3_regen_feedback",
          archive: {"id":"archive-regeneration","category":"钢轨守护","title":"再生制动","body":"再生制动可将部分制动动能转化为电能，回馈电网或供其他设备使用，提高能源利用效率。"}
        },
        {
          id: "c3-patrol-car",
          kind: "info",
          main: false,
          name: "智能巡检车",
          speaker: "智能巡检车",
          npcSprite: "inspection-rover",
          npcHeight: 78,
          x: 515,
          y: 495,
          prompt: "我沿线路采集高清图像和状态信息。AI 可以快速比对大量数据，提示可疑位置，再交给工作人员复核。",
          promptVoice: "c3_patrol_info",
          archive: {"id":"archive-patrol-car","category":"钢轨守护","title":"智能巡检车","body":"智能巡检车沿线路采集图像和状态信息，用于辅助发现设备异常。"}
        },
        {
          id: "c3-ultrasonic",
          kind: "info",
          main: false,
          name: "钢轨探伤仪",
          speaker: "铁世一",
          x: 950,
          y: 495,
          prompt: "超声波进入钢轨后，遇到内部缺陷会产生不同的反射信号。专业人员据此判断钢轨内部是否存在异常。",
          promptVoice: "c3_ultrasonic_info",
          archive: {"id":"archive-ultrasonic","category":"钢轨守护","title":"超声波钢轨探伤","body":"超声波在钢轨内部传播并产生反射信号，可辅助专业人员发现肉眼看不到的内部异常。"}
        },
        {
          id: "c3-track-circuit",
          kind: "info",
          main: false,
          name: "轨道电路设备",
          speaker: "线路工作人员",
          npcSprite: "rail-worker",
          x: 1080,
          y: 495,
          prompt: "轨道电路等设备可以参与判断区段是否被列车占用，为信号控制和行车调度提供基础信息。",
          promptVoice: "c3_track_circuit_info",
          archive: {"id":"archive-track-circuit","category":"钢轨守护","title":"列车位置感知","body":"轨道电路等系统参与判断区段占用状态，为信号控制和行车调度提供基础信息。"}
        }
      ]
    },
    {
      id: "chapter-4",
      number: "第四站",
      title: "世界一流站・向未来再出发",
      objective: "自由参观五块展示牌，全部体验后开启探索终点",
      background: "assets/backgrounds/chapter-4.webp",
      bgm: "assets/music/chapter-4.m4a",
      spawn: { x: 800, y: 805, direction: "up" },
      portal: { x: 800, y: 690, radius: 58, label: "结束探索", color: "#ffd35a", ending: true, requiresAllInteractions: true, width: 184 },
      badge: "通关纪念徽章",
      chapterArchive: null,
      interactions: [
        {
          id: "c4-network",
          kind: "info",
          main: false,
          name: "路网规模质量世界一流",
          speaker: "铁世一",
          x: 285,
          y: 485,
          prompt: "到 2030 年，全国铁路营业里程将达到 18 万公里左右，其中高铁 6 万公里左右，复线率和电气化率分别达到 64% 和 78%。‘八纵八横’高铁系统全面成网，战略骨干通道持续加强，区域互联互通水平显著提升，货运网络能力大幅增强，基本建成世界一流的现代化铁路网。",
          promptVoice: "c4_network_info",
          archive: {"id":"archive-world-network","category":"世界一流","title":"路网规模质量世界一流","body":"面向 2030 年，现代化铁路网将进一步完善规模、质量、骨干通道与区域互联互通能力。"}
        },
        {
          id: "c4-transport",
          kind: "info",
          main: false,
          name: "运输保障能力世界一流",
          speaker: "铁世一",
          x: 540,
          y: 485,
          prompt: "国铁企业核心功能与核心竞争力持续增强，安全保障体系更为健全。全国 1、2、3 小时铁路出行圈和 1、2、3 天快货物流圈全面形成，中国高铁、中国铁路物流、中欧班列等品牌优势充分彰显，实现人享其行、物畅其流。",
          promptVoice: "c4_transport_info",
          archive: {"id":"archive-world-transport","category":"世界一流","title":"运输保障能力世界一流","body":"铁路运输保障面向安全、出行圈、快货物流圈与客货运输品牌能力持续提升。"}
        },
        {
          id: "c4-innovation",
          kind: "info",
          main: false,
          name: "科技创新水平世界一流",
          speaker: "铁世一",
          x: 800,
          y: 485,
          prompt: "铁路总体技术水平保持世界领先，科技创新体系更加完善，高铁技术国际标杆地位更加稳固，关键领域核心技术持续突破，‘人工智能+’行动取得标志性成果，数智化技术应用水平大幅提升。",
          promptVoice: "c4_innovation_info",
          archive: {"id":"archive-world-innovation","category":"世界一流","title":"科技创新水平世界一流","body":"完善科技创新体系，巩固高铁技术标杆地位，推动核心技术、人工智能和数智化应用持续突破。"}
        },
        {
          id: "c4-operation",
          kind: "info",
          main: false,
          name: "企业经营质效世界一流",
          speaker: "铁世一",
          x: 1060,
          y: 485,
          prompt: "市场化法治化国际化经营机制更加完善，主要客货运输经济指标保持世界领先，单位产出成本、单位运输工作量综合能耗达到世界领先水平，运输效率、劳动生产率等不断提升。",
          promptVoice: "c4_operation_info",
          archive: {"id":"archive-world-operation","category":"世界一流","title":"企业经营质效世界一流","body":"通过完善经营机制、提升运输效率和能源利用水平，夯实铁路高质量发展的经济基础。"}
        },
        {
          id: "c4-governance",
          kind: "info",
          main: false,
          name: "铁路治理体系世界一流",
          speaker: "铁世一",
          x: 1315,
          y: 485,
          prompt: "党对国铁企业的全面领导和完善公司治理实现有机统一，中国特色国铁现代企业制度更加成熟、定型，战略管理、依法治理、风险防控等达到世界一流水平，铁路治理体系和治理能力基本实现现代化。",
          promptVoice: "c4_governance_info",
          archive: {"id":"archive-world-governance","category":"世界一流","title":"铁路治理体系世界一流","body":"推动现代企业制度、战略管理、依法治理和风险防控能力协同提升，实现治理体系和治理能力现代化。"}
        }
      ]
    }
  ];

  const chapterArchives = {
    "archive-tieshiyi-ip": {
      id: "archive-tieshiyi-ip",
      category: "铁路科普 IP 形象",
      title: "铁世一｜CR450 复兴号智能动车组",
      body: "铁世一是铁路科普 IP 形象，身穿 CR450 复兴号智能动车组主题装备，用三视图和引擎腰带讲解中国铁路的速度、科技与安全。",
      images: [
        { src: "assets/generated/tieshiyi-ip-character-sheet.webp", alt: "铁世一角色三视图与 CR450 复兴号介绍" },
        { src: "assets/generated/tieshiyi-ip-belt-guide.webp", alt: "铁世一三色状态与世界一流引擎腰带介绍" }
      ]
    },
    "archive-smart-station": { id: "archive-smart-station", category: "章节档案", title: "智慧车站与数字化服务", body: "从电子客票到重点旅客预约，智慧设备与人工服务共同构成便捷、有温度的出行体系。" },
    "archive-future-train": { id: "archive-future-train", category: "章节档案", title: "高速列车核心技术", body: "流线型设计、环境监测、车体气密性、状态监测和稳定供电共同支撑高速列车安全舒适运行。" },
    "archive-rail-guard": { id: "archive-rail-guard", category: "章节档案", title: "线路运维与绿色铁路", body: "AI 辅助巡检、信号系统、钢轨探伤和再生制动构成看得见与看不见的安全绿色防线。" }
  };

  const ending = [
    { speaker: "铁世一", text: "恭喜你完成全部铁路科技探索任务！", voice: "ending_1" },
    { speaker: "铁世一", text: "从一张电子车票到飞驰的高铁，从智能监测到 AI 巡检，再到绿色铁路运输……铁路科技，就藏在每一次便捷出行和安全抵达之中。", voice: "ending_2" },
    { speaker: "铁世一", text: "但探索不会在这里结束。铁路的发展也从未停下前进的脚步——新的技术还在不断涌现，新的突破仍在持续发生。", voice: "ending_3" },
    { speaker: "铁世一", text: "今天的终点，也许正是下一段探索的起点。", voice: "ending_4" },
    { speaker: "铁世一", text: "让我们一起期待，中国铁路驶向更智能、更安全、更绿色的未来！", voice: "ending_5" }
  ];

  window.GAME_DATA = {
    title: "前方到站，世界一流！",
    subtitle: "铁世一的铁路科技像素冒险",
    world: { width: 1600, height: 900 },
    chapters,
    chapterArchives,
    ending,
    controls: {
      speed: 245,
      interactionRadius: 108,
      // 碰撞盒相对主角脚底锚点的尺寸；比角色立绘更小，便于贴墙和穿行。
      playerCollision: { width: 24, height: 30, offsetX: 12, offsetY: 32 }
    },
    saveKey: "railway-pixel-adventure-progress-v1"
  };
})();
