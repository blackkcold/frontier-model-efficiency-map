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
    sort: { key: "intelligence", dir: -1 }
  };

  const effortLabel = {none:"None",low:"Low",medium:"Medium",high:"High",xhigh:"XHigh",max:"Max",default:"Default"};
  const q = id => document.getElementById(id);

  function corr(d) { return state.correction ? (D.correction[d.effort] || 1) : 1; }
  function correctedCost(d) { return d.cost * corr(d); }
  function baselineCost() { return baselineRaw * (state.correction ? D.correction.max : 1); }
  function ratio(d) { return correctedCost(d) / baselineCost(); }
  function normalized(d) { return d.intelligence / leader * 100; }
  function xValue(d) { return state.xMetric === "ratio" ? ratio(d) : correctedCost(d); }
  function yValue(d) { return state.yMetric === "normalized" ? normalized(d) : d.intelligence; }

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

  const labelPlugin = {
    id:"featuredLabels",
    afterDatasetsDraw(chart) {
      const {ctx} = chart; ctx.save(); ctx.font='600 11px Inter, sans-serif'; ctx.textBaseline='middle';
      chart.data.datasets.forEach((dataset, di) => {
        if (dataset._pareto) return;
        const meta = chart.getDatasetMeta(di);
        meta.data.forEach((el, i) => {
          const raw = dataset._raw?.[i];
          if (!raw?.featured) return;
          const txt = `${raw.family} ${effortLabel[raw.effort]}`;
          const w = ctx.measureText(txt).width + 12;
          let x = el.x + 9, y = el.y - 13;
          if (x + w > chart.chartArea.right) x = el.x - w - 9;
          ctx.fillStyle='rgba(7,8,10,.86)'; ctx.strokeStyle='rgba(130,140,156,.45)'; ctx.lineWidth=1;
          ctx.beginPath(); ctx.roundRect(x,y-10,w,20,6); ctx.fill(); ctx.stroke();
          ctx.fillStyle='#e8ebf1'; ctx.fillText(txt,x+6,y);
        });
      }); ctx.restore();
    }
  };

  let chart;
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
        borderColor: arr.map(d=>d.measured?color:'#d8dde6'),
        backgroundColor: arr.map(d=>d.measured?`${color}d9`:'rgba(0,0,0,0)'),
        pointStyle: arr.map(d=>d.measured?st.pointStyle:'crossRot'),
        pointRadius: arr.map(d=>d.effort==='max'?7:d.effort==='xhigh'?6.5:6),
        pointHoverRadius: 9
      };
    });
    const p = pareto(points.filter(d=>d.measured));
    if(p.length>1) sets.push({
      label:"Pareto frontier", _pareto:true, data:p.map(d=>({x:xValue(d),y:yValue(d),raw:d})), parsing:false,
      borderColor:'rgba(210,218,231,.42)', borderDash:[6,5], borderWidth:1.2, pointRadius:0, pointHoverRadius:0, showLine:true, tension:.05, order:99
    });
    return sets;
  }

  function chartOptions() {
    const xTitle = state.xMetric === 'ratio' ? '任务消耗倍率（GPT‑6 Luna Max = 1×）' : 'AA 单任务成本（USD，含可选长任务修正）';
    const yTitle = state.yMetric === 'normalized' ? '综合能力（当前最高 = 100）' : 'Artificial Analysis Intelligence Index';
    return {
      responsive:true, maintainAspectRatio:false, interaction:{mode:'nearest',intersect:false},
      animation:{duration:260},
      plugins:{
        legend:{display:true,position:'bottom',labels:{color:'#aab1bc',boxWidth:10,boxHeight:10,usePointStyle:true,padding:18,font:{size:11},filter:item=>item.text!=="Pareto frontier"}},
        tooltip:{backgroundColor:'rgba(12,14,18,.96)',borderColor:'#303642',borderWidth:1,titleColor:'#fff',bodyColor:'#c5cbd5',padding:12,
          callbacks:{
            title(items){const d=items[0]?.raw?.raw; return d?`${d.family} · ${effortLabel[d.effort]}`:'';},
            label(ctx){const d=ctx.raw.raw;if(!d)return'';return [
              `Provider: ${d.provider}`,
              `AA Intelligence: ${d.intelligence}  ·  能力 ${normalized(d).toFixed(1)}`,
              `AA task cost: $${d.cost.toFixed(d.cost<0.01?4:2)}`,
              `调整后消耗: ${ratio(d).toFixed(2)}× Luna Max`,
              `${d.measured?'实测':'估算'}${d.status==='deprecated'?' · 已弃用':''}`,
              d.estimateNote || ''
            ].filter(Boolean);}
          }
        }
      },
      scales:{
        x:{type:state.logScale?'logarithmic':'linear',title:{display:true,text:xTitle,color:'#7e8794'},grid:{color:'rgba(95,105,120,.12)'},ticks:{color:'#8e96a3',callback:v=>state.xMetric==='ratio'?`${Number(v).toPrecision(2)}×`:`$${v}`}},
        y:{title:{display:true,text:yTitle,color:'#7e8794'},grid:{color:'rgba(95,105,120,.12)'},ticks:{color:'#8e96a3'},suggestedMin:state.yMetric==='normalized'?25:15,suggestedMax:state.yMetric==='normalized'?102:60}
      }
    };
  }

  function renderChart() {
    const points = visibleModels(); q('pointCount').textContent=`${points.length} points`;
    const data={datasets:buildDatasets(points)};
    if(chart){chart.data=data;chart.options=chartOptions();chart.update();return;}
    chart=new Chart(q('modelChart'),{type:'scatter',data,options:chartOptions(),plugins:[labelPlugin]});
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

  function update(){renderChart();renderTable();}
  function bind(){
    q('agentCorrection').onchange=e=>{state.correction=e.target.checked;update();};
    q('logScale').onchange=e=>{state.logScale=e.target.checked;update();};
    q('showEstimated').onchange=e=>{state.showEstimated=e.target.checked;update();};
    q('showDeprecated').onchange=e=>{state.showDeprecated=e.target.checked;update();};
    q('xMetric').onchange=e=>{state.xMetric=e.target.value;update();};
    q('yMetric').onchange=e=>{state.yMetric=e.target.value;update();};
    q('modelTable').querySelectorAll('th[data-sort]').forEach(th=>th.onclick=()=>{const k=th.dataset.sort;if(state.sort.key===k)state.sort.dir*=-1;else{state.sort.key=k;state.sort.dir=k==='provider'||k==='family'||k==='effort'?1:-1;}renderTable();});
  }

  makeFilters(); bind(); renderPlans(); renderSources(); update();
  const rec = D.models.find(d=>d.featured==='frontier-value');
  if(rec) q('frontierRatio').textContent=`≈${ratio(rec).toFixed(2)}× Luna Max`;
})();
