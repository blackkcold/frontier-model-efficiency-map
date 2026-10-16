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
  const ORBIT_TRIGGER_RADIUS=12, ORBIT_GROUP_RADIUS=34, ORBIT_MAX_GROUP=9;
  const ORBIT_CARD_W=188, ORBIT_CARD_H=52;
  let activeOrbitKey="", pendingOrbitFrame=0;
  function orbitKey(group) {
    return group.neighbors.map(p=>p.d.provider+":"+p.d.family+":"+p.d.effort).sort().join("|");
  }
  function pickModel(d) {
    state.selectedModel=d;
    renderModelDetail(d);
    closeOrbit();
  }
  function closeOrbit() {
    activeOrbitKey="";
    if(pendingOrbitFrame)window.cancelAnimationFrame(pendingOrbitFrame);
    pendingOrbitFrame=0;
    const layer=q("modelOrbit");
    layer.classList.remove("is-open","is-list");
    layer.replaceChildren();
    layer.setAttribute("aria-hidden","true");
  }
  function chartPoints() {
    if(!chart)return [];
    const canvas=q("modelChart"),rect=canvas.getBoundingClientRect();
    const wrap=q("modelCanvasWrap").getBoundingClientRect();
    const sx=rect.width/Math.max(chart.width,1),sy=rect.height/Math.max(chart.height,1);
    const area=chart.chartArea,points=[];
    chart.data.datasets.forEach((ds,idx)=>{
      if(ds._pareto)return;
      chart.getDatasetMeta(idx).data.forEach((el,i)=>{
        const d=ds._raw?.[i];
        if(!d||el.skip||!Number.isFinite(el.x)||!Number.isFinite(el.y))return;
        if(area&&(el.x<area.left-7||el.x>area.right+7||el.y<area.top-7||el.y>area.bottom+7))return;
        points.push({d,x:rect.left-wrap.left+el.x*sx,y:rect.top-wrap.top+el.y*sy});
      });
    });
    return points;
  }
  function hitGroup(clientX,clientY,trigger=ORBIT_TRIGGER_RADIUS) {
    const rect=q("modelCanvasWrap").getBoundingClientRect();
    const x=clientX-rect.left,y=clientY-rect.top,points=chartPoints();
    let first=null,nearest=Infinity;
    for(const p of points) {
      const distance=Math.hypot(p.x-x,p.y-y);
      if(distance<nearest){first=p;nearest=distance;}
    }
    if(!first||nearest>trigger)return null;
    const neighbors=points.map(p=>({...p,distance:Math.hypot(p.x-first.x,p.y-first.y)}))
      .filter(p=>p.distance<=ORBIT_GROUP_RADIUS).sort((a,b)=>a.distance-b.distance)
      .slice(0,ORBIT_MAX_GROUP);
    const anchor={x:neighbors.reduce((v,p)=>v+p.x,0)/neighbors.length,
      y:neighbors.reduce((v,p)=>v+p.y,0)/neighbors.length};
    return {first,neighbors,anchor,points};
  }
  function angleDelta(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b));}
  // Keep the angular order of original measured coordinates; attach a
  // numbered leader from each true dot to the corresponding label.
  function layoutOrbit(group,width,height) {
    const {anchor,points,neighbors}=group,n=neighbors.length;
    const hw=ORBIT_CARD_W/2,hh=ORBIT_CARD_H/2,gap=9,pad=8;
    if(width<ORBIT_CARD_W+pad*2||height<ORBIT_CARD_H*3)return null;
    const ordered=neighbors.map((p,i)=>({...p,originalIndex:i,
      angle:Math.atan2(p.y-anchor.y,p.x-anchor.x),
      radius:Math.hypot(p.x-anchor.x,p.y-anchor.y)}))
      .sort((a,b)=>a.angle-b.angle||a.d.family.localeCompare(b.d.family));
    const slots=Array.from({length:n},(_,i)=>-Math.PI+2*Math.PI*i/n);
    let rotation=0,minScore=Infinity;
    for(let k=0;k<n;k++){
      const score=ordered.reduce((sum,p,i)=>sum+Math.max(.07,Math.min(1,p.radius/13))*
        Math.pow(angleDelta(slots[(i+k)%n],p.angle),2),0);
      if(score<minScore){minScore=score;rotation=k;}
    }
    const placed=[];
    for(let i=0;i<n;i++){
      const p=ordered[i],target=slots[(i+rotation)%n];
      let best=null,bestScore=Infinity;
      for(const radius of [144,176,210,248,290,340,390]){
        for(const skew of [0,-.14,.14,-.3,.3,-.48,.48,-.7,.7]){
          const x=anchor.x+Math.cos(target+skew)*radius;
          const y=anchor.y+Math.sin(target+skew)*radius;
          const box={x,y,left:x-hw,right:x+hw,top:y-hh,bottom:y+hh};
          if(box.left<pad||box.right>width-pad||box.top<pad||box.bottom>height-pad)continue;
          if(placed.some(o=>box.left<o.right+gap&&box.right>o.left-gap&&
            box.top<o.bottom+gap&&box.bottom>o.top-gap))continue;
          const covers=points.reduce((sum,d)=>sum+
            (d.x>box.left-5&&d.x<box.right+5&&d.y>box.top-5&&d.y<box.bottom+5?1:0),0);
          const score=Math.abs(skew)*140+Math.abs(radius-170)*.18+covers*30+
            Math.abs(angleDelta(target+skew,p.angle))*p.radius*.15;
          if(score<bestScore){best=box;bestScore=score;}
        }
      }
      if(!best) {
        // Edge fallback: occupy a free nearby cell, but never reinterpret
        // a point's identity. Numbered lines still lead to the source dot.
        const xs=[],ys=[];
        for(let x=hw+pad;x<=width-hw-pad;x+=ORBIT_CARD_W+gap)xs.push(x);
        for(let y=hh+pad;y<=height-hh-pad;y+=ORBIT_CARD_H+gap)ys.push(y);
        xs.push(width-hw-pad);
        ys.push(height-hh-pad);
        for(const x of xs)for(const y of ys) {
          const box={x,y,left:x-hw,right:x+hw,top:y-hh,bottom:y+hh};
          if(placed.some(o=>box.left<o.right+gap&&box.right>o.left-gap&&
            box.top<o.bottom+gap&&box.bottom>o.top-gap))continue;
          const covers=points.reduce((sum,d)=>sum+
            (d.x>box.left-5&&d.x<box.right+5&&d.y>box.top-5&&d.y<box.bottom+5?1:0),0);
          const a=Math.atan2(y-anchor.y,x-anchor.x);
          const distance=Math.hypot(x-anchor.x,y-anchor.y);
          const score=Math.abs(angleDelta(a,target))*95+Math.abs(distance-170)*.25+
            covers*35;
          if(score<bestScore){best=box;bestScore=score;}
        }
      }
      if(!best)return null; // Fall back to a labeled list if nothing fits.
      placed.push({...best,originalIndex:p.originalIndex});
    }
    return placed.sort((a,b)=>a.originalIndex-b.originalIndex);
  }
  function orbitSvg(group,positions,width,height) {
    const ns="http://www.w3.org/2000/svg";
    const make=(tag,attrs)=>{
      const node=document.createElementNS(ns,tag);
      Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,String(value)));
      return node;
    };
    const svg=make("svg",{class:"orbit-leaders",viewBox:"0 0 "+width+" "+height,
      width,height,"aria-hidden":"true",focusable:"false"});
    group.neighbors.forEach((p,i)=>{
      const target=positions[i],dx=p.x-target.x,dy=p.y-target.y;
      const t=Math.min(.96,(ORBIT_CARD_W/2)/Math.max(Math.abs(dx),.00001),
        (ORBIT_CARD_H/2)/Math.max(Math.abs(dy),.00001));
      const color=D.providerColors[p.d.provider];
      svg.appendChild(make("line",{class:"orbit-link",x1:p.x,y1:p.y,
        x2:target.x+dx*t,y2:target.y+dy*t,stroke:color,pathLength:1}));
      const distance=Math.hypot(dx,dy),offset=Math.min(18,distance*.25);
      const mx=p.x-dx*offset/Math.max(distance,1),my=p.y-dy*offset/Math.max(distance,1);
      svg.appendChild(make("circle",{class:"orbit-source",cx:p.x,cy:p.y,r:3,fill:color}));
      svg.appendChild(make("circle",{class:"orbit-marker",cx:mx,cy:my,r:9,stroke:color}));
      const number=make("text",{class:"orbit-marker-text",x:mx,y:my});
      number.textContent=String(i+1);
      svg.appendChild(number);
    });
    return svg;
  }
  function openOrbit(group) {
    const layer=q("modelOrbit"),chartWrap=q("modelCanvasWrap");
    const key=orbitKey(group);
    if(key===activeOrbitKey)return;
    closeOrbit();
    const width=chartWrap.clientWidth,height=chartWrap.clientHeight;
    const positions=width<660?null:layoutOrbit(group,width,height);
    const listMode=!positions;
    activeOrbitKey=key;
    layer.setAttribute("aria-hidden","false");
    if(listMode)layer.classList.add("is-list");
    if(positions)layer.appendChild(orbitSvg(group,positions,width,height));
    const panel=document.createElement("div");
    panel.className=listMode?"orbit-choice-grid":"orbit-choice-layer";
    panel.setAttribute("role","group");
    panel.setAttribute("aria-label","按编号选择模型；连线指向原始散点");
    group.neighbors.forEach((p,i)=>{
      const button=document.createElement("button");
      button.type="button";button.className="orbit-choice";
      button.style.setProperty("--provider-color",D.providerColors[p.d.provider]);
      button.innerHTML='<span class="orbit-number" aria-hidden="true">'+(i+1)+'</span>'+
        '<span class="orbit-choice-text"><strong>'+p.d.family+'</strong><small>'+
        p.d.provider+' · '+effortLabel[p.d.effort]+' · '+ratio(p.d).toFixed(2)+'× Luna</small></span>';
      button.setAttribute("aria-label",(i+1)+" 号：查看 "+p.d.family+" "+effortLabel[p.d.effort]+" 的详情");
      if(positions){
        button.style.left=group.anchor.x+"px";button.style.top=group.anchor.y+"px";
        button.style.setProperty("--orbit-x",(positions[i].x-group.anchor.x)+"px");
        button.style.setProperty("--orbit-y",(positions[i].y-group.anchor.y)+"px");
      }
      button.addEventListener("click",event=>{event.stopPropagation();pickModel(p.d);});
      panel.appendChild(button);
    });
    layer.appendChild(panel);
    if(positions){
      const core=document.createElement("span");
      core.className="orbit-core";core.setAttribute("aria-hidden","true");
      core.style.left=group.anchor.x+"px";core.style.top=group.anchor.y+"px";
      layer.appendChild(core);
    }
    pendingOrbitFrame=window.requestAnimationFrame(()=>{
      pendingOrbitFrame=0;layer.classList.add("is-open");
    });
  }
  function bindModelOrbit() {
    const canvas=q("modelChart"),wrap=q("modelCanvasWrap");
    canvas.setAttribute("aria-label","模型散点图；悬停密集点可展开连接线和带编号标签，点击选择详情");
    canvas.addEventListener("pointermove",event=>{
      if(event.pointerType==="touch")return;
      const group=hitGroup(event.clientX,event.clientY);
      if(!group)return; // Do not collapse before the pointer reaches a petal.
      if(group.neighbors.length>1){
        if(orbitKey(group)!==activeOrbitKey)openOrbit(group);
      }else if(activeOrbitKey)closeOrbit();
    });
    canvas.addEventListener("click",event=>{
      const group=hitGroup(event.clientX,event.clientY,event.pointerType==="touch"?20:14);
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
