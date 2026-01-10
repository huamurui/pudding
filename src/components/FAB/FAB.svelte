<script>
  import { onMount } from 'svelte';
  let percent = 0;
  let visible = false;

  function update() {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    const clientHeight = document.documentElement.clientHeight || document.body.clientHeight;
    const p = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100) || 0;
    percent = p;
    visible = scrollTop > 300;
  }

  onMount(() => {
    update();
    window.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  });

  function toTop(){ window.scrollTo({top:0, behavior:'smooth'}); }
</script>

<div class="floating-action-button" on:click={toTop} class:visible={visible} aria-hidden={!visible} title="回到顶部">
  <div class="icon">{percent}%</div>
  <svg width="62" height="62" viewBox="0 0 62 62"><circle cx="31" cy="31" r="30" stroke-width="4" fill="none" stroke="var(--primary-color)" stroke-dasharray="188.49555921538757" style="stroke-dashoffset: {188.49555921538757 - (percent/100)*188.49555921538757}" /></svg>
</div>

<style>
  .floating-action-button{position:fixed;right:20px;bottom:20px;cursor:pointer;display:none;}
  .floating-action-button.visible{display:block}
  .icon{background:rgba(0,0,0,0.1);padding:6px;border-radius:50%;}
</style>
