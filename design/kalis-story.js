(() => {
const scenes = [["Publish expertise", "An expert packages a private method and lists it for sale."], ["Buy a method", "A buyer pays for access. The method stays private."], ["Run privately", "The method meets the buyer\u2019s data inside protected execution."], ["Open the result", "Only the buyer opens the answer returned by the private run."], ["Fund improvements", "Payment supports the expert, execution and shared improvements."], ["Improve together", "Contributors improve open modules. Reviewed work earns a bounty."]];
const panels=[...document.querySelectorAll('[data-panel]')],steps=[...document.querySelectorAll('[data-story-step]')];
const root=document.getElementById('experience'),play=document.getElementById('story-play'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
let index=0,timer=null,playing=!reduced.matches;
function schedule(){clearTimeout(timer);if(playing&&!document.hidden)timer=setTimeout(()=>{show(index+1);schedule()},7000)}
function show(n){index=(n+panels.length)%panels.length;window.kalisCycle?.show(index);panels.forEach((p,i)=>p.hidden=i!==index);steps.forEach((s,i)=>{s.setAttribute('aria-pressed',String(i===index));if(i===index)s.setAttribute('aria-current','step');else s.removeAttribute('aria-current')});document.getElementById('story-location').textContent=scenes[index][0];document.getElementById('story-caption').textContent=scenes[index][1];document.getElementById('story-position').textContent=`${index+1} / ${panels.length}`}
function sync(){window.kalisCycle?.setPlaying(playing&&!document.hidden&&!reduced.matches);root.classList.toggle('is-playing',playing&&!document.hidden);play.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+(playing?'M9 6v12M15 6v12':'m9 5 10 7-10 7Z')+'"/></svg>';play.setAttribute('aria-label',reduced.matches?'Next stage':playing?'Pause animation':'Play animation');play.setAttribute('aria-pressed',String(playing));schedule()}
function manual(n){playing=false;show(n);sync()}
steps.forEach((s,i)=>s.addEventListener('click',()=>manual(i)));
document.getElementById('story-prev').addEventListener('click',()=>manual(index-1));
document.getElementById('story-next').addEventListener('click',()=>manual(index+1));
play.addEventListener('click',()=>{if(reduced.matches){manual(index+1);return}playing=!playing;sync()});
document.getElementById('explore').addEventListener('click',()=>{show(0);playing=!reduced.matches;sync();root.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'center'})});
document.addEventListener('visibilitychange',sync);
reduced.addEventListener('change',()=>{playing=false;sync();if(reduced.matches)play.setAttribute('aria-label','Next stage')});
root.addEventListener('focusin',event=>{if(event.target===play)return;playing=false;sync()});
show(0);sync();if(reduced.matches)play.setAttribute('aria-label','Next stage');
})();
