<script>
  import { onMount } from 'svelte';
  onMount(() => {
    const MAX_HEIGHT = 360;
    const preList = Array.from(document.querySelectorAll('pre.astro-code'));

    preList.forEach((pre) => {
      if (pre.getAttribute('data-enhanced') === '1') return;
      pre.setAttribute('data-enhanced', '1');

      const codeEl = pre.querySelector('code');
      if (!codeEl) return;

      const toolbar = document.createElement('div');
      toolbar.className = 'code-toolbar';

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'code-copy';
      copyBtn.innerText = '复制';

      let expandBtn = null;
      const needsCollapse = pre.scrollHeight > MAX_HEIGHT + 20;
      if (needsCollapse) {
        pre.classList.add('code-collapsed');
        expandBtn = document.createElement('button');
        expandBtn.type = 'button';
        expandBtn.className = 'code-expand';
        expandBtn.innerText = '展开';
      }

      toolbar.appendChild(copyBtn);
      if (expandBtn) toolbar.appendChild(expandBtn);
      pre.appendChild(toolbar);

      copyBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const text = codeEl.innerText.replace(/\u00A0/g, ' ');
        try {
          await navigator.clipboard.writeText(text);
          const old = copyBtn.innerText;
          copyBtn.innerText = '已复制';
          setTimeout(() => (copyBtn.innerText = old), 1500);
        } catch (err) {
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); } catch (e) {}
          document.body.removeChild(ta);
        }
      });

      if (expandBtn) {
        expandBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const isCollapsed = pre.classList.toggle('code-collapsed');
          if (!isCollapsed) {
            pre.classList.add('code-expanded');
            expandBtn.innerText = '收起';
          } else {
            pre.classList.remove('code-expanded');
            expandBtn.innerText = '展开';
          }
        });
      }
    });
  });
</script>
