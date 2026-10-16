/* global Chart, MODEL_DATA */
(() => {
  const D = window.MODEL_DATA;
  const leader = Math.max(...D.models.map(d => d.intelligence));
  const baselineRaw = D.baseline.costPerTask;
  const state = {
    providers: new Set(Object.keys(D.providerColors)),
    efforts: new Set(["none","low","medium","high","xhigh","max","default"]),
    showEstimated: true,
    showDeprecated: false,
    correction: true,
    logScale: true,
    xMetric: "ratio",
    yMetric: "normalized",
    selectedModel: null,
    sort: { key: "intelligence", dir: -1 }
  };

  const effortLabel = {none:"None",low:"Low",medium:"Medium",high:"High",xhigh:"XHigh",max:"Max",default:"Default"};
  const q = id => document.getElementById(id);


  const themeMedia = window.matchMedia("(prefers-color-scheme: light)");
  let themeChoice = "system";
  try {
    const saved = window.localStorage.getItem("frontier-theme-v1");
    if (["light", "dark", "system"].includes(saved)) themeChoice = saved;
  } catch (_) { /* Local storage may be unavailable in privacy mode. */ }
  function closeThemeMenu() {
    q("themeMenu").hidden = true;
    q("themeToggle").setAttribute("aria-expanded", "false");
  }
  function applyTheme() {
    const resolved = themeChoice === "system" ? (themeMedia.matches ? "light" : "dark") : themeChoice;
    document.documentElement.dataset.theme = resolved;
    document.querySelector('meta[name="theme-color"]').content = resolved === "light" ? "#f4f7fc" : "#08090c";
    q("themeCurrentLabel").textContent = ({light:"浅色",dark:"深色",system:"跟随系统"})[themeChoice];
    document.querySelectorAll("[data-theme-choice]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.themeChoice === themeChoice)));
    if (chart) renderChart();
  }
  function bindTheme() {
    q("themeToggle").addEventListener("click", () => {
      const opening = q("themeMenu").hidden;
      q("themeMenu").hidden = !opening;
      q("themeToggle").setAttribute("aria-expanded", String(opening));
    });
    document.querySelectorAll("[data-theme-choice]").forEach(button => button.addEventListener("click", () => {
      themeChoice = button.dataset.themeChoice;
      try { window.localStorage.setItem("frontier-theme-v1", themeChoice); } catch (_) { /* Nonessential preference. */ }
      applyTheme();
      closeThemeMenu();
      q("themeToggle").focus();
    }));
    document.addEventListener("pointerdown", event => {
      if (!q("themeSwitcher").contains(event.target)) closeThemeMenu();
    });
    document.addEventListener("keydown", event => { if (event.key === "Escape") closeThemeMenu(); });
    const changeHandler = () => { if (themeChoice === "system") applyTheme(); };
    if (themeMedia.addEventListener) themeMedia.addEventListener("change", changeHandler);
    else if (themeMedia.addListener) themeMedia.addListener(changeHandler);
    applyTheme();
  }

  function corr(d) { return state.correction ? (D.correction[d.effort] || 1) : 1; }
  function correctedCost(d) { return d.cost * corr(d); }
  function baselineCost() { return baselineRaw * (state.correction ? D.correction.max : 1); }
  function ratio(d) { return correctedCost(d) / baselineCost(); }
  function normalized(d) { return d.intelligence / leader * 100; }
  function xValue(d) { return state.xMetric === "ratio" ? ratio(d) : correctedCost(d); }
  function yValue(d) { return state.yMetric === "normalized" ? normalized(d) : d.intelligence; }

  function renderModelDetail(d) {
    const el = q("modelDetail");
    if (!d) {
      el.innerHTML = '<div class="model-detail-empty">点击散点或展开后的模型标签查看详情（悬浮不改变选择）</div>';
      return;
    }
    const dataTag = d.measured
      ? '<span class="tag">第三方统一实测</span>'
      : '<span class="tag est">估算 / 插值</span>';
    const statusTag = d.status === "deprecated" ? '<span class="tag dep">已弃用</span>' : '';
    const note = d.estimateNote
      || (d.measured ? '能力与单任务成本采用 Artificial Analysis 当前统一实测口径。' : '该点为官方存在档位的估算值，不作为最高能力结论依据。');
    el.innerHTML = `
      <div class="model-detail-main">
        <div class="card-label">MODEL DETAIL</div>
        <h3>${d.family} · ${effortLabel[d.effort]}</h3>${d.modelId ? `<small class="model-id">${d.modelId}</small>` : ""}
        <p>${d.provider} ${dataTag} ${statusTag}</p>
      </div>
      <div class="detail-metric"><span>AA Intelligence</span><b>${d.intelligence}</b></div>
      <div class="detail-metric"><span>综合能力</span><b>${normalized(d).toFixed(1)}</b></div>
      <div class="detail-metric"><span>AA 单任务成本</span><b>${d.cost.toFixed(d.cost < 0.01 ? 4 : 2)}</b></div>
      <div class="detail-metric"><span>调整后消耗倍率</span><b>${ratio(d).toFixed(2)}×</b></div>
      <div class="detail-note">${note}</div>
    `;
  }

  function visibleModels() {
    return D.models.filter(d => state.providers.has(d.provider)
      && state.efforts.has(d.effort)
      && (state.showEstimated || d.measured)
      && (state.showDeprecated || d.status !== "deprecated"));
  }

  function makeFilters() {
    const pf = q("providerFilters");
    Object.keys(D.providerColors).forEach(provider => {
      const b = document.createElement("button");
      b.className = "pill active";
      b.innerHTML = `<i style="--c:${D.providerColors[provider]}"></i>${provider}`;
      b.onclick = () => { state.providers.has(provider) ? state.providers.delete(provider) : state.providers.add(provider); b.classList.toggle("active"); update(); };
      pf.appendChild(b);
    });
    const ef = q("effortFilters");
    ["none","low","medium","high","xhigh","max","default"].forEach(effort => {
      const b = document.createElement("button"); b.className="pill active"; b.textContent=effortLabel[effort];
      b.onclick=()=>{state.efforts.has(effort)?state.efforts.delete(effort):state.efforts.add(effort);b.classList.toggle("active");update();};
      ef.appendChild(b);
    });
  }

  function pareto(points) {
    // Non-dominated: no other point is both cheaper and at least as capable, with one strict improvement.
    return points.filter(a => !points.some(b => b !== a && xValue(b) <= xValue(a) && yValue(b) >= yValue(a) && (xValue(b) < xValue(a) || yValue(b) > yValue(a))))
      .sort((a,b)=>xValue(a)-xValue(b));
  }

  const familyStyle = {};
  const pointStyles = ["circle","rectRounded","triangle","rect","crossRot","star"];
  function styleFor(family, provider) {
    if (!familyStyle[family]) {
      const providerFamilies = Object.keys(familyStyle).filter(k => familyStyle[k].provider === provider).length;
      familyStyle[family] = { provider, pointStyle: pointStyles[providerFamilies % pointStyles.length] };
    }
    return familyStyle[family];
  }


  let chart;
  let activeOrbitKey = "";
  let activeOrbitAnchor = null;
  let pendingOrbitFrame = 0;

  function pickModel(d) {
    state.selectedModel = d;
    renderModelDetail(d);
    closeOrbit();
  }

  function closeOrbit() {
    activeOrbitKey = "";
    activeOrbitAnchor = null;
    if (pendingOrbitFrame) window.cancelAnimationFrame(pendingOrbitFrame);
    pendingOrbitFrame = 0;
    const layer = q("modelOrbit");
    layer.classList.remove("is-open", "is-list");
    layer.replaceChildren();
    layer.setAttribute("aria-hidden", "true");
  }

  function chartPoints() {
    if (!chart) return [];
    const canvas = q("modelChart");
    const canvasRect = canvas.getBoundingClientRect();
    const wrapRect = q("modelCanvasWrap").getBoundingClientRect();
    const sx = canvasRect.width / Math.max(chart.width, 1);
    const sy = canvasRect.height / Math.max(chart.height, 1);
    const points = [];
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      if (dataset._pareto) return;
      const elements = chart.getDatasetMeta(datasetIndex).data;
      elements.forEach((element, i) => {
        const d = dataset._raw?.[i];
        if (!d || element.skip || !Number.isFinite(element.x) || !Number.isFinite(element.y)) return;
        points.push({
          d,
          x: canvasRect.left - wrapRect.left + element.x * sx,
          y: canvasRect.top - wrapRect.top + element.y * sy
        });
      });
    });
    return points;
  }

  function hitGroup(clientX, clientY) {
    const rect = q("modelCanvasWrap").getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    const points = chartPoints().map(p => ({...p, distance: Math.hypot(p.x-x, p.y-y)}));
    points.sort((a,b) => a.distance-b.distance);
    const first = points[0];
    if (!first || first.distance > 25) return null;
    const neighbors = points.filter(p => Math.hypot(p.x-first.x,p.y-first.y) <= 53).slice(0,12);
    return {first,neighbors,anchor:{x:first.x,y:first.y},points};
  }

  // Collision-aware "mechanical petals": no card may cover a sibling.
  // Choose positions along concentric arcs; clamp to the chart container.
  function layoutOrbit(anchor, count, width, height, otherPoints) {
    const positions=[], cardW=168,cardH=46, pad=8;
    for(let i=0;i<count;i++) {
      const phase = -Math.PI / 2 + i * (Math.PI * 2 / Math.max(count,1));
      let best=null;
      for(const radius of [100,134,168,202,238,278]) {
        for(const shift of [0,-.20,.20,-.40,.40,-.65,.65]) {
          const angle=phase+shift;
          const naturalX=anchor.x + Math.cos(angle)*radius;
          const naturalY=anchor.y + Math.sin(angle)*radius;
          const x=Math.max(cardW/2+pad,Math.min(width-cardW/2-pad,naturalX));
          const y=Math.max(cardH/2+pad,Math.min(height-cardH/2-pad,naturalY));
          const box={left:x-cardW/2,right:x+cardW/2,top:y-cardH/2,bottom:y+cardH/2};
          let penalty=Math.hypot(naturalX-x,naturalY-y)*5+radius*.045;
          for(const prev of positions) {
            const ox=Math.max(0,Math.min(box.right,prev.right+7)-Math.max(box.left,prev.left-7));
            const oy=Math.max(0,Math.min(box.bottom,prev.bottom+7)-Math.max(box.top,prev.top-7));
            penalty+=ox*oy*20;
          }
          for(const p of otherPoints) {
            if(p.x>box.left-8&&p.x<box.right+8&&p.y>box.top-8&&p.y<box.bottom+8)penalty+=10;
          }
          if(!best||penalty<best.penalty)best={x,y,...box,penalty};
          if(penalty<18)break;
        }
        if(best&&best.penalty<18)break;
      }
      positions.push(best);
    }
    return positions;
  }

  function openOrbit(group) {
    const layer=q("modelOrbit");
    const narrow=q("modelCanvasWrap").clientWidth < 660;
    const signature=group.neighbors.map(p=>p.d.provider+":"+p.d.family+":"+p.d.effort).sort().join("|");
    if(signature===activeOrbitKey)return;
    closeOrbit();
    activeOrbitKey=signature;
    activeOrbitAnchor=group.anchor;
    layer.setAttribute("aria-hidden", "false");
    if(narrow)layer.classList.add("is-list");

    const positions=narrow?[]:layoutOrbit(group.anchor,group.neighbors.length,
      q("modelCanvasWrap").clientWidth,q("modelCanvasWrap").clientHeight,group.points);
    const wrap=document.createElement("div");
    wrap.className=narrow?"orbit-choice-grid":"orbit-choice-layer";
    wrap.setAttribute("role","group");
    wrap.setAttribute("aria-label","选择附近模型");
    for(const [i,p] of group.neighbors.entries()) {
      const button=document.createElement("button");
      button.type="button";
      button.className="orbit-choice";
      button.style.setProperty("--provider-color",D.providerColors[p.d.provider]);
      button.innerHTML='<span class="orbit-provider-dot" aria-hidden="true"></span><span class="orbit-choice-text"><strong>'+
        p.d.family+'</strong><small>'+effortLabel[p.d.effort]+' · '+ratio(p.d).toFixed(2)+'× Luna</small></span>';
      button.setAttribute("aria-label","查看 "+p.d.family+" "+effortLabel[p.d.effort]+" 的详情");
      if(!narrow){
        button.style.left=group.anchor.x+"px";button.style.top=group.anchor.y+"px";
        button.style.setProperty("--orbit-x",(positions[i].x-group.anchor.x)+"px");
        button.style.setProperty("--orbit-y",(positions[i].y-group.anchor.y)+"px");
      }
      button.addEventListener("click",event=>{
        event.stopPropagation();
        pickModel(p.d);
      });
      wrap.appendChild(button);
    }
    layer.appendChild(wrap);
    const core=document.createElement("span");
    core.className="orbit-core"; core.setAttribute("aria-hidden","true");
    if(!narrow){core.style.left=group.anchor.x+"px";core.style.top=group.anchor.y+"px";}
    layer.appendChild(core);
    pendingOrbitFrame=window.requestAnimationFrame(()=>{
      pendingOrbitFrame=0;
      layer.classList.add("is-open");
    });
  }

  function bindModelOrbit() {
    const canvas=q("modelChart");
    const wrap=q("modelCanvasWrap");
    canvas.setAttribute("aria-label","模型能力与成本散点图；点击散点查看详情，靠近密集点时选择展开的模型按钮");
    canvas.addEventListener("pointermove",event=>{
      if(event.pointerType==="touch")return;
      const rect=wrap.getBoundingClientRect();
      const x=event.clientX-rect.left,y=event.clientY-rect.top;
      if(activeOrbitAnchor&&Math.hypot(x-activeOrbitAnchor.x,y-activeOrbitAnchor.y)<185)return;
      const group=hitGroup(event.clientX,event.clientY);
      if(group&&group.neighbors.length>1)openOrbit(group);
      else closeOrbit();
    });
    canvas.addEventListener("click",event=>{
      const group=hitGroup(event.clientX,event.clientY);
      if(!group){closeOrbit();return;}
      if(group.neighbors.length>1)openOrbit(group);
      else pickModel(group.first.d);
    });
    wrap.addEventListener("pointerleave",closeOrbit);
    document.addEventListener("keydown",event=>{
      if(event.key==="Escape"&&activeOrbitKey)closeOrbit();
    });
    window.addEventListener("resize",closeOrbit);
  }

  function buildDatasets(points) {
    const groups = new Map();
    points.forEach(d => {
      if(!groups.has(d.family)) groups.set(d.family, []);
      groups.get(d.family).push(d);
    });
    const sets = [...groups].map(([family, arr]) => {
      const provider = arr[0].provider; const st = styleFor(family, provider); const color = D.providerColors[provider];
      return {
        label: family, _raw: arr, data: arr.map(d=>({x:xValue(d),y:yValue(d),raw:d})),
        parsing:false, showLine:false, borderWidth: arr.map(d=>d.measured?1.5:2.2),
        borderColor: arr.map(d=>d.measured?color:(document.documentElement.dataset.theme === 'light'?'#5c6b85':'#d8dde6')),
        backgroundColor: arr.map(d=>d.measured?`${color}d9`:'rgba(0,0,0,0)'),
        pointStyle: arr.map(d=>d.measured?st.pointStyle:'crossRot'),
        pointRadius: arr.map(d=>d.effort==='max'?7:d.effort==='xhigh'?6.5:6),
        pointHoverRadius: 9,
        pointHitRadius: 10
      };
    });
    const p = pareto(points.filter(d=>d.measured));
    if(p.length>1) sets.push({
      label:"Pareto frontier", _pareto:true, data:p.map(d=>({x:xValue(d),y:yValue(d),raw:d})), parsing:false,
      borderColor:document.documentElement.dataset.theme === 'light'?'rgba(78,100,141,.55)':'rgba(210,218,231,.42)', borderDash:[6,5], borderWidth:1.2, pointRadius:0, pointHoverRadius:0, showLine:true, tension:.05, order:99
    });
    return sets;
  }

  function chartOptions() {
    const xTitle = state.xMetric === 'ratio' ? '任务消耗倍率（GPT‑6 Luna Max = 1×）' : 'AA 单任务成本（USD，含可选长任务修正）';
    const yTitle = state.yMetric === 'normalized' ? '综合能力（当前最高 = 100）' : 'Artificial Analysis Intelligence Index';
    const light = document.documentElement.dataset.theme === 'light';
    const axisColor = light ? '#5a6982' : '#8e96a3';
    const axisTitleColor = light ? '#52617a' : '#7e8794';
    const gridColor = light ? 'rgba(90,112,147,.18)' : 'rgba(95,105,120,.12)';
    return {
      responsive:true, maintainAspectRatio:false, interaction:{mode:'nearest',intersect:true},
      animation:{duration:260},
      plugins:{
        legend:{display:true,position:'bottom',labels:{color:axisColor,boxWidth:10,boxHeight:10,usePointStyle:true,padding:18,font:{size:11},filter:item=>item.text!=="Pareto frontier"}},
        tooltip:{enabled:false}
      },
      scales:{
        x:{type:state.logScale?'logarithmic':'linear',title:{display:true,text:xTitle,color:axisTitleColor},grid:{color:gridColor},ticks:{color:axisColor,callback:v=>state.xMetric==='ratio'?`${Number(v).toPrecision(2)}×`:`$${v}`}},
        y:{title:{display:true,text:yTitle,color:axisTitleColor},grid:{color:gridColor},ticks:{color:axisColor},suggestedMin:state.yMetric==='normalized'?25:15,suggestedMax:state.yMetric==='normalized'?102:60}
      }
    };
  }

  function renderChart() {
    closeOrbit();
    const points = visibleModels(); q('pointCount').textContent=`${points.length} points`;
    const data={datasets:buildDatasets(points)};
    if(chart){chart.data=data;chart.options=chartOptions();chart.update();return;}
    chart=new Chart(q('modelChart'),{type:'scatter',data,options:chartOptions(),plugins:[]});
  }

  function sortValue(d,key){
    if(key==='normalized')return normalized(d); if(key==='ratio')return ratio(d); return d[key] ?? '';
  }
  function renderTable(){
    const tbody=q('modelTable').querySelector('tbody'); tbody.innerHTML='';
    const arr=[...visibleModels()].sort((a,b)=>{
      const av=sortValue(a,state.sort.key),bv=sortValue(b,state.sort.key);
      return typeof av==='number'?(av-bv)*state.sort.dir:String(av).localeCompare(String(bv))*state.sort.dir;
    });
    arr.forEach(d=>{
      const tr=document.createElement('tr');
      tr.tabIndex=0; tr.setAttribute('role','button'); tr.setAttribute('aria-label',`查看 ${d.family} ${effortLabel[d.effort]} 的详情`);
      tr.addEventListener('click',()=>pickModel(d));
      tr.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pickModel(d);}});
      tr.innerHTML=`<td><span class="tag"><i style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${D.providerColors[d.provider]};margin-right:5px"></i>${d.provider}</span></td>
      <td>${d.family}${d.status==='deprecated'?' <span class="tag dep">deprecated</span>':''}</td><td>${effortLabel[d.effort]}</td>
      <td class="num">${d.intelligence}</td><td class="num">${normalized(d).toFixed(1)}</td><td class="num">$${d.cost.toFixed(d.cost<.01?4:2)}</td><td class="num">${ratio(d).toFixed(2)}×</td>
      <td>${d.measured?'<span class="tag">实测</span>':'<span class="tag est" title="'+(d.estimateNote||'')+'">估算</span>'}</td>`;
      tbody.appendChild(tr);
    });
  }

  function renderPlans(){
    const tbody=q('planTable').querySelector('tbody');
    D.plans.forEach(p=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${p.provider}</td><td>${p.plan}${p.recommended?' <span class="tag">推荐</span>':''}</td><td><b>${p.price}</b></td><td>${p.bestFor}</td><td>${p.note}</td>`;tbody.appendChild(tr);});
  }
  function renderSources(){
    q('sources').innerHTML=D.sources.map(s=>`<a href="${s.url}" target="_blank" rel="noreferrer">${s.label}</a>`).join('');
  }

  function update(){
    const visible=visibleModels();
    if(state.selectedModel && !visible.includes(state.selectedModel)) state.selectedModel=null;
    renderChart();
    renderTable();
    renderModelDetail(state.selectedModel);
  }
  function bind(){
    q('agentCorrection').onchange=e=>{state.correction=e.target.checked;update();};
    q('logScale').onchange=e=>{state.logScale=e.target.checked;update();};
    q('showEstimated').onchange=e=>{state.showEstimated=e.target.checked;update();};
    q('showDeprecated').onchange=e=>{state.showDeprecated=e.target.checked;update();};
    q('xMetric').onchange=e=>{state.xMetric=e.target.value;update();};
    q('yMetric').onchange=e=>{state.yMetric=e.target.value;update();};
    q('modelTable').querySelectorAll('th[data-sort]').forEach(th=>th.onclick=()=>{const k=th.dataset.sort;if(state.sort.key===k)state.sort.dir*=-1;else{state.sort.key=k;state.sort.dir=k==='provider'||k==='family'||k==='effort'?1:-1;}renderTable();});
  }

  makeFilters(); bind(); bindTheme(); renderPlans(); renderSources(); update(); bindModelOrbit();
  const rec = D.models.find(d=>d.featured==='frontier-value');
  if(rec) q('frontierRatio').textContent=`≈${ratio(rec).toFixed(2)}× Luna Max`;
})();
