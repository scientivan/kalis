/* Manual tab switching with native focus order and keyboard support. */
(() => {
  const hero=document.querySelector('.hero');
  if(hero){const sizeBackdrop=()=>document.documentElement.style.setProperty('--hero-backdrop-height',`${Math.ceil(hero.getBoundingClientRect().bottom+window.scrollY)}px`);new ResizeObserver(sizeBackdrop).observe(hero);sizeBackdrop();}
  const list=document.querySelector('.method-tabs');
  if(!list)return;
  const tabs=[...list.querySelectorAll('[role="tab"]')];
  const mobile=matchMedia('(max-width: 760px)');
  function orientation(){list.setAttribute('aria-orientation',mobile.matches?'horizontal':'vertical');}
  orientation();mobile.addEventListener('change',orientation);
  function activate(index,focus=false){
    tabs.forEach((tab,i)=>{
      const selected=i===index;
      tab.setAttribute('aria-selected',String(selected));
      tab.tabIndex=selected?0:-1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden=!selected;
    });
    if(focus)tabs[index].focus();
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>activate(index));
    tab.addEventListener('keydown',event=>{
      let next=index;
      const forward=mobile.matches?'ArrowRight':'ArrowDown';
      const backward=mobile.matches?'ArrowLeft':'ArrowUp';
      if(event.key===forward)next=(index+1)%tabs.length;
      else if(event.key===backward)next=(index-1+tabs.length)%tabs.length;
      else if(event.key==='Home')next=0;
      else if(event.key==='End')next=tabs.length-1;
      else return;
      event.preventDefault();activate(next,true);
    });
  });
})();
