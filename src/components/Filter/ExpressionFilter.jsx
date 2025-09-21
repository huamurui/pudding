// src/components/ExpressionFilter/ExpressionFilter.jsx
import { createSignal, onMount } from 'solid-js';
import './ExpressionFilter.css';
import { evaluateExpression } from './Expression';

export default function ExpressionFilter(props) {
  const [expression, setExpression] = createSignal('');
  const [error, setError] = createSignal('');
  const [history, setHistory] = createSignal([]);

  // 应用筛选
  const applyFilter = () => {
    setError('');

    if (!expression().trim()) {
      props.onFilterResult?.(props.allPosts || []);
      return;
    }

    try {
      const result = (props.allPosts || []).filter(post =>
        evaluateExpression(expression(), post.tags, props.allTags || [])
      );

      props.onFilterResult?.(result);

      // 添加到历史记录（去重）
      if (!history().includes(expression())) {
        setHistory(prev => [expression(), ...prev.slice(0, 4)]);
      }
    } catch (err) {
      setError(err.message);
      props.onFilterResult?.([]);
    }
  };

  const selectFromHistory = (expr) => {
    setExpression(expr);
    // 可以选择自动应用筛选，或者让用户手动点击应用
    // applyFilter(); // 取消注释此行可自动应用历史记录
  };

  // 初始化时显示所有文章
  onMount(() => {
    props.onFilterResult?.(props.allPosts || []);
  });

  return (
    <div class="expression-filter">
      <div class="expression-input">
        <label for="tag-expression">标签表达式:</label>
        <input
          id="tag-expression"
          type="text"
          value={expression()}
          onInput={(e) => setExpression(e.target.value)}
          placeholder="例如: Astro & 教程 | (React & !入门)"
          onKeyPress={(e) => e.key === 'Enter' && applyFilter()}
        />
        <button onClick={applyFilter}>应用筛选</button>
        
        {error() && <div class="error">{error()}</div>}
      </div>

      {history().length > 0 && (
        <div class="history">
          <h4>最近使用的表达式:</h4>
          <ul>
            {history().map((expr, index) => (
              <li key={index}>
                <button 
                  class="history-item"
                  onClick={() => selectFromHistory(expr)}
                >
                  {expr}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div class="help">
        <h4>表达式语法帮助:</h4>
        <ul>
          <li><code>&</code> 或 <code>&amp;&amp;</code> - 与操作（必须同时包含）</li>
          <li><code>|</code> 或 <code>||</code> - 或操作（包含任意一个）</li>
          <li><code>!</code> - 非操作（不包含）</li>
          <li><code>( )</code> - 分组操作</li>
          <li>示例: <code>(前端 & 框架) | (后端 & 语言)</code></li>
        </ul>
      </div>
    </div>
  );
}