var Me=Object.defineProperty;var Se=(t,e,n)=>e in t?Me(t,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[e]=n;var v=(t,e,n)=>(Se(t,typeof e!="symbol"?e+"":e,n),n);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))r(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const i of s.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&r(i)}).observe(document,{childList:!0,subtree:!0});function n(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerpolicy&&(s.referrerPolicy=o.referrerpolicy),o.crossorigin==="use-credentials"?s.credentials="include":o.crossorigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function r(o){if(o.ep)return;o.ep=!0;const s=n(o);fetch(o.href,s)}})();var P=(t=>(t.black="black",t.red="red",t))(P||{});const E=["black","black-king","red","red-king","empty"],ne=[[-1],[-1,1],[1],[-1,1]],Fe=ne.map(t=>t.map(e=>e*2)),A=[P.black,P.red],g=E.length-1;class d{constructor(e,n,r=g){v(this,"indices");v(this,"value");this.indices={row:e,column:n},this.value=r}static updateFactory(e,n,...r){let o=[];return o.push(new d(e.finalRow,e.finalColumn,n)),r.forEach(({indices:s})=>o.push(new d(s.row,s.column))),o}}const $e=(t,...e)=>{const n=Object.entries(t).filter(([,r])=>Boolean(r)).map(([r])=>r);return[...e,...n].join(" ")};function re(t){for(let e=0;e<8;e++)for(let n=0;n<8;n++)t(e,n)}function T(t){return t!==g?E[t].split("-")[0]:void 0}function ke(t){return["b","B","r","R","-"].reduce((e,n,r)=>e.replaceAll(n,String(r)),t)}function oe(t){return t===A[0]?A[1]:A[0]}function Oe(t,{finalRow:e,finalColumn:n,startRow:r,startColumn:o}){const i=se(t,{startRow:r,startColumn:o}).find(({finalCell:a})=>a.row===e&&a.column===n);if(!i)return[];const{updates:l}=i;return(e===7||e===0)&&l.length>0&&l.push(new d(e,n,E.indexOf(T(t.grid[r][o])+"-king"))),l}function se({grid:t,turn:e},{startRow:n,startColumn:r}){const o=t[n][r];return o===g||T(o)!==e?[]:De(t,T(t[n][r]))?I(t,n,r):ae(t,n,r)}function De(t,e){return J(t,e).some(({row:n,column:r})=>I(t,n,r).length>0)}function I(t,e,n){const r=[2,-2],o=[],s=t[e][n];if(s===g)return o;for(let i of Fe[s])for(let l of r){let a=e+i,u=n+l;if(ie(a)||le(u))continue;let f=t[a][u],$=e+(Math.abs(i)-1)*Math.sign(i),k=n+(Math.abs(l)-1)*Math.sign(l),O=t[$][k];f===g&&T(O)===oe(T(s))&&o.push({finalCell:{row:a,column:u},updates:d.updateFactory({finalRow:a,finalColumn:u},s,new d($,k),new d(e,n))})}return o}function J(t,e){const n=[];return re((r,o)=>{T(t[r][o])===e&&n.push({row:r,column:o})}),n}function xe(t,e){return!J(t,e).some(({row:n,column:r})=>I(t,n,r).length>0||ae(t,n,r).length>0)}const Ae=t=>t.map(e=>e.map(n=>n));function ie(...t){return t.some(e=>e>=8||e<0)}function le(...t){return t.some(e=>e>=8||e<0)}function ae(t,e,n){const r=[1,-1];let o=[],s=t[e][n];if(s===g)return o;for(let i of ne[s])for(let l of r){let a=e+i,u=n+l;if(ie(a)||le(u))continue;t[a][u]===g&&o.push({finalCell:{row:a,column:u},updates:d.updateFactory({finalRow:a,finalColumn:u},s,new d(e,n))})}return o}class y{constructor(e,n,{flaggedCell:r}={}){v(this,"grid");v(this,"turn");v(this,"flaggedCell");v(this,"piecesThatCanMove");this.grid=e,this.turn=n,this.flaggedCell=r,this.piecesThatCanMove=this.getPiecesThatCanMove()}updatedGrid(e){let n=y.computeGrid(this.grid,e);return new y(n,this.turn)}updateFlaggedCell(e){return new y(this.grid,this.turn,{flaggedCell:e})}updateCurrentTurn(){let e=this.grid;return new y(e,oe(this.turn))}getPiecesThatCanMove(){return(this.flaggedCell?[this.flaggedCell]:J(this.grid,this.turn)).filter(({row:e,column:n})=>this.getLegalTargets(e,n).length)}getLegalTargets(e,n){return se(this,{startRow:e,startColumn:n}).map(({finalCell:r})=>r)}static computeGrid(e,n){let r=Ae(e);return n.forEach(({indices:{row:o,column:s},value:i})=>{r[o][s]=i}),r}serialize(){const e=["b","B","r","R","-"];return{grid:this.grid.map(n=>n.map(r=>e[r]).join("")).join(`
`),turn:this.turn}}}const N={turn:P.black,grid:`
-r-r-r-r
r-r-r-r-
-r-r-r-r
--------
--------
b-b-b-b-
-b-b-b-b
b-b-b-b-
`.trim().split(`
`).filter(Boolean).join(`
`)},q="state",K="grid",_="turn",{pathname:ce,href:Pe}=window.location,Be=()=>{try{return JSON.parse(localStorage.getItem(q))}catch{return}},Ie=()=>{const t=new URLSearchParams(window.location.search),e=t.get(K),n=t.get(_);return e?{grid:e,turn:n}:void 0},ue=()=>(window.location.search?Ie():Be())||N,Ne=({grid:t,turn:e}=N)=>{const n=new URLSearchParams;n.set(K,t),n.set(_,e),history.pushState(null,"",`${ce}?${n.toString()}`),localStorage.setItem(q,JSON.stringify({grid:t,turn:e}))},Ue=()=>{history.pushState(null,"",ce),localStorage.removeItem(q)};function ze(){const t=new URLSearchParams,{grid:e,turn:n}=ue();return t.set(K,e),t.set(_,n),`${Pe.split("?")[0]}?${t.toString()}`}const Ge={fetch:ue,persist:Ne,reset:Ue,compileSharingUrl:ze},{fetch:Ye,persist:Re,reset:Xe,compileSharingUrl:je}=Ge,C={get serialized(){return Ye()},set serialized({grid:t,turn:e}){Re({grid:t,turn:e})},reset:Xe,get share(){return je()}};let w=[C.serialized],b=0;const L={resetStack:()=>{w=[N],b=0},add:t=>{w[++b]=t,w.splice(b+1)},dec:()=>w[--b],inc:()=>w[++b],get isEmpty(){return b===0},get isEnd(){return b===w.length-1}},h=t=>document.getElementById(t),F=h("table"),He=h("turnDiv"),D=h("trailingDiv"),G=h("containerBoard"),Ve=h("reset"),Je=h("share"),Y=h("undo"),R=h("redo"),U=t=>(e,n)=>e.addEventListener(t,n),x=U("click"),qe=U("mousedown"),Ke=U("mouseover"),_e=U("touchstart"),Qe="legal-target",de="can-move",Q=E.map((t,e)=>`piece-${E[e]}`),We=Q[g],Ze=Object.fromEntries(A.map(t=>[t,`piece-${t}`])),ge=(t,e)=>F.rows[t].cells[e],ee=t=>{const e=new Set(t.map(({row:n,column:r})=>`${n},${r}`));return(n,r)=>e.has(`${n},${r}`)};let X=!1,j;const fe=t=>re((e,n)=>t({row:e,column:n,domCell:ge(e,n)})),et=(t,{legalTargets:e,piecesThatCanMove:n,turn:r})=>{He.className=Ze[r],Y.disabled=L.isEmpty,R.disabled=L.isEnd;const o=ee(e),s=ee(n);fe(({row:i,column:l,domCell:a})=>{const u=t[i][l],f=$e({[Qe]:o(i,l),[de]:s(i,l)&&!X},Q[u]);a.className!==f&&(a.className=f)})};qe(F,t=>{he(t,{moveEvent:"mousemove",endEvent:"mouseup",coordsExtractor:e=>e})});_e(F,t=>{he(t,{moveEvent:"touchmove",endEvent:"touchend",coordsExtractor:e=>e.changedTouches[0]})});function he(t,{moveEvent:e,endEvent:n,coordsExtractor:r}){const{clientX:o,clientY:s}=r(t);let{row:i,column:l}=te({clientX:o,clientY:s});const a=new Set(Array.from(ge(i,l).classList)),u=a.has.bind(a);if(!u(de)||u(We))return;X=!0,G.addEventListener(e,Z),G.addEventListener(n,Le,{once:!0});const f=Q.find(u);f&&(D.className=f);const{width:$,height:k}=D.getBoundingClientRect();j.updateUI(i,l);const O=(p,m)=>D.style.transform=`translateX(${p}px) translateY(${m}px)`,{x:we,y:ye}=ve({clientX:o,clientY:s}),Ee=we%$,Te=ye%k,W=({clientX:p,clientY:m})=>O(p-Ee,m-Te);W({clientX:o,clientY:s});function Z(p){const{clientX:m,clientY:z}=r(p);W({clientX:m,clientY:z})}function Le(p){G.removeEventListener(e,Z),D.style.backgroundImage="",O(-1e3,-1e3),X=!1;let{row:m,column:z}=te(r(p));j.handleMove(m,z,i,l)}}let{left:pe,top:me,width:H,height:V}=F.getBoundingClientRect();window.onresize=()=>({left:pe,top:me,width:H,height:V}=F.getBoundingClientRect());function ve({clientX:t,clientY:e}){const n=pe+window.pageXOffset,r=me+window.pageYOffset,o=t-n,s=e-r;return{x:o,y:s}}function te({clientX:t,clientY:e}){const{x:n,y:r}=ve({clientX:t,clientY:e});return n>H||r>V?{row:-1,column:-1}:{row:Math.floor(r/V*8),column:Math.floor(n/H*8)}}const M={updateDOM({grid:t,turn:e,legalTargets:n,piecesThatCanMove:r}){et(t,{legalTargets:n,piecesThatCanMove:r,turn:e})},registerShare:t=>x(Je,t),registerUndo:(t,e)=>{x(Y,t),x(R,e),window.addEventListener("keydown",({key:n})=>{n==="ArrowLeft"&&!Y.disabled&&t(),n==="ArrowRight"&&!R.disabled&&e()})},registerReset:t=>x(Ve,t),registerHover(t){fe(({domCell:e,row:n,column:r})=>{Ke(e,()=>t(n,r))})},registerStateControllers(t){j=t}};function be(t,e=2e3){const n=document.createElement("div");n.classList.add("toast"),n.innerText=t,document.body.appendChild(n),setTimeout(()=>{document.body.removeChild(n)},e)}function tt(t,e,n,r){if(c.grid[t][e]!==g||t===-1&&e===-1){S(c);return}let s=Oe(c,{finalRow:t,finalColumn:e,startRow:n,startColumn:r});if(s.length>0){let l=c.updatedGrid(s),a=s.length===3&&E[s[s.length-1].value].split("-")[1]!=="king"||s.length===4,u=I(l.grid,t,e).length!==0;c=a&&u?l.updateFlaggedCell({row:t,column:e}):l.updateFlaggedCell().updateCurrentTurn(),xe(c.grid,c.turn)&&(be(`${c.turn} lost! :(`,5e3),Ce())}S(c);const i=c.serialize();C.serialized=i,L.add(i)}function B({grid:t,turn:e}){const n=ke(t).trim().split(`
`).map(s=>s.trim()),o=Array.from({length:8},()=>Array.from({length:8})).map((s,i)=>s.map((l,a)=>Number(n[i].charAt(a))));return S(new y(o,e))}let c=B(C.serialized);function Ce(){L.resetStack(),C.reset(),c=B(N)}function S(t,e=[]){return M.updateDOM({grid:t.grid,turn:t.turn,legalTargets:e,piecesThatCanMove:t.piecesThatCanMove}),t}M.registerStateControllers({handleMove:tt,updateUI:(t,e)=>{S(c.updatedGrid([new d(t,e,g)]),c.getLegalTargets(t,e))}});M.registerShare(()=>{navigator.clipboard.writeText(C.share).then(()=>{be("URL with game-state copied to clipboard! \u{1F386}\u{1F386}\u{1F386}")})});M.registerReset(Ce);M.registerHover((t,e)=>S(c,c.getLegalTargets(t,e)));M.registerUndo(()=>{c=B(L.dec()),C.serialized=c.serialize()},()=>{c=B(L.inc()),C.serialized=c.serialize()});
//# sourceMappingURL=index.332ae089.js.map
