---
icon: edit
date: 2025-09-21
title: 物理模拟
tags: ['物理模拟', 'web','编程']
---

>可能... 是我最开始学编程，做小玩具的时候喜欢的想做的一些东西，今天想整理一下，顺便学一下怎么写数学公式，调调博客各种内容的样式。

##  Web 动画

Web 画图可以用一个个小元素拼，也可以用 canvas，但像物理模拟这种事情还是用 canvas 比较合适。  
而，除了画图，让画面动起来，物理模拟也还需要有时间的概念。  

这在 web 中有许多方式，古老的 setInterval 会按照传入的时间间隔去调用一个函数，这个函数自然可以是更新画面。  
而对于动画，专门的 requestAnimationFrame 会更合适，会在浏览器每次重绘之前调用传入的函数，传入的回调也会给一个时间戳的入参，外面写个变量记一下也能挺容易算出两次调用的时间间隔 $$\Delta t$$ 。而对回调函数的调用频率也会和设备刷新率相匹配，也许通常是 60Hz。总之，对于动画，用它就不用再考虑很多奇奇怪怪的问题了。  

```js
let last
function draw(now) {
  const diff = time - last // delta time
  last = now
  /*
   更新画面
   ......
  */
  requestAnimationFrame(draw);
}
```

## 时间积分/时间离散/时间步进

上面提到的 web 中有关时间和动画 的 API 都是离散的，所以，一些物理模拟中的时间也一样要跟着是离散的。  
对于一般的运动模拟，通常关注 x, v, a 这几个物理量就足够了。

怎么做呢?

### 最简单的

$$x(t + \Delta t) = x(t) + v(t) \Delta t$$

$$v(t + \Delta t) = v(t) + a(t) \Delta t$$

这应该算最简单的方法了，简单到我甚至才知道它还有个专门名字，叫欧拉方法，知道它们有好多种，统称数值方法。

### Verlet 积分

最近又看到一个 Verlet 积分：

$$x(t+\Delta t) = 2x(t) - x(t-\Delta t) + a(t)\Delta t^2$$

还有带速度版本的：

$$x(t + \Delta t) = x(t) + v(t) \Delta t + \frac{1}{2} a(t) \Delta t^2$$

$$v(t + \Delta t) = v(t) + \frac{a(t) + a(t + \Delta t)}{2} \Delta t $$

>看起来它在计算位移时不仅考虑了 v 还同时考虑了 a，像泰勒展开多展开了几项，应该会更精确一些吧...  
>去查了查那些别的数值方法，这些东西长的都像是能用泰勒展开推出来的，一些更简单方便计算的式子...？  
>虽然我会觉得怀疑它们一开始是被用各种稀奇古怪的手段弄出来的。  

## 弹簧与碰撞

### 胡克定律  

$$F = -k \Delta x$$

然而，在实际应用中，许多材料的弹性行为是非线性的。当应力超过一定阈值时，材料的应变与应力之间的关系将不再保持线性。为了描述这种非线性行为，需要对胡克定律进行扩展。一种常见的非线性扩展形式是：​

$$F = -k \Delta x - b (\Delta x)^3$$

>### 物理中的碰撞
>弹性碰撞时的动量,能量守恒
>$$m_1 v_1 + m_2 v_2 = m_1 v_1' + m_2 v_2'$$  
>$$\frac{1}{2} m_1 v_1^2 + \frac{1}{2} m_2 v_2^2 = \frac{1}{2} m_1 v_1'^2 + \frac{1}{2} m_2 v_2'^2$$  
>推导碰撞后的速度  
>$$v_1' = \frac{m_1 - m_2}{m_1 + m_2} v_1 + \frac{2 m_2}{m_1 + m_2} v_2$$  
>$$v_2' = \frac{2 m_1}{m_1 + m_2} v_1 + \frac{m_2 - m_1}{m_1 + m_2} v_2$$  
>最后推导的结果其实是，某种对称的，交换 `1` `2` 位置就是互相的式子。    
>所以，对于 `1` 和 `2` 如果将当前想要求解速度的物体记为 `self` ，另一个物体记为 `other` ，最后的这两个式子其实是一个  
>$$v_{\text{self}}' = v_{\text{self}} + \frac{2 m_{\text{other}}}{m_{\text{self}} + m_{\text{other}}} (v_{\text{other}} - v_{\text{self}})$$  

### 游戏中的碰撞

然而，在游戏中，质量并不是一个常被关注量，游戏中更需要花功夫考虑的是不是碰撞结果的计算而是碰撞的检测。

```js
// AABB碰撞检测
function aabbCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y;
}

// 圆形碰撞检测
function circleCollision(circ1, circ2) {
    const dx = circ1.cx - circ2.cx;
    const dy = circ1.cy - circ2.cy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < circ1.radius + circ2.radius;
}

// 分离轴定理(SAT)检测多边形碰撞
function satCollision(poly1, poly2) {
    // 获取多边形的边向量
    function getEdges(points) {
        const edges = [];
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            edges.push({
                x: p2.x - p1.x,
                y: p2.y - p1.y
            });
        }
        return edges;
    }

    // 获取垂直于边的轴
    function getAxes(edges) {
        return edges.map(edge => ({
            x: -edge.y,
            y: edge.x
        }));
    }

    // 投影多边形到轴上
    function project(points, axis) {
        let min = points[0].x * axis.x + points[0].y * axis.y;
        let max = min;
        
        for (const p of points) {
            const val = p.x * axis.x + p.y * axis.y;
            min = Math.min(min, val);
            max = Math.max(max, val);
        }
        return { min, max };
    }

    // 检查投影是否重叠
    function projectionsOverlap(p1, p2) {
        return !(p1.max < p2.min || p2.max < p1.min);
    }

    const edges1 = getEdges(poly1.points);
    const edges2 = getEdges(poly2.points);
    const axes1 = getAxes(edges1);
    const axes2 = getAxes(edges2);

    // 检查所有轴
    for (const axis of [...axes1, ...axes2]) {
        const p1 = project(poly1.points, axis);
        const p2 = project(poly2.points, axis);
        
        if (!projectionsOverlap(p1, p2)) {
            return false; // 找到分离轴，无碰撞
        }
    }

    return true; // 所有轴都重叠，有碰撞
}
```

以及，处理大量物体时，会考虑做空间分割，只计算一个区域内的物体是否有碰撞。

## 弹簧质点模型

最后，我想做那种软软弹弹的像果冻一样的效果  

弹簧质点模型，就像它的名字一样，对于一个物体，不是一下创完整体，而摆好一堆质点，将它们用弹簧连起来，然后你就得到了一坨软软的东西。

而对弹性，对质点间弹簧的不同处理则会，有不一样的软软的感觉。

对于布料，只将质点间十字连接就好，对于弹簧的性质，会需要那种比较难拉伸但比较容易压缩弯曲的弹簧。  

而对于果冻，为了产生形变同时又防止过分的折叠和压缩，会考虑十字加上对角线方向的弹簧，会需要中等的拉伸与压缩系数。  

```js
// Create jelly particles
const startX = width / 4;
const startY = height / 2;

for (let y = 0; y < validGridSize; y++) {
    for (let x = 0; x < validGridSize; x++) {
        const px = startX + x * particleRadius * 1.5
        const py = startY + y * particleRadius * 1.5
        
        // No fixed particles for better movement
        this.particles.push(new Particle(px, py, false));
    }
}

// Create springs between adjacent particles
for (let y = 0; y < validGridSize; y++) {
    for (let x = 0; x < validGridSize; x++) {
        const index = y * validGridSize + x;
        if (!this.particles[index]) continue;
        
        // Connect to right neighbor
        if (x < validGridSize - 1) {
            const rightIndex = y * validGridSize + (x + 1);
            if (this.particles[rightIndex]) {
                this.springs.push(new Spring(
                    this.particles[index],
                    this.particles[rightIndex],
                    null,
                    this.params.stiffness,
                    this.params.nonLinearity
                ));
            }
        }
        
        // Connect to bottom neighbor
        if (y < validGridSize - 1) {
            const bottomIndex = (y + 1) * validGridSize + x;
            if (this.particles[bottomIndex]) {
                this.springs.push(new Spring(
                    this.particles[index],
                    this.particles[bottomIndex],
                    null,
                    this.params.stiffness,
                    this.params.nonLinearity
                ));
            }
        }
        
        // Connect to diagonal neighbors
        if (x < validGridSize - 1 && y < validGridSize - 1) {
            const diagIndex = (y + 1) * validGridSize + (x + 1);
            if (this.particles[diagIndex]) {
                this.springs.push(new Spring(
                    this.particles[index],
                    this.particles[diagIndex],
                    null,
                    this.params.stiffness * 0.7,
                    this.params.nonLinearity
                ));
            }
        }
        
        if (x < validGridSize - 1 && y > 0) {
            const diagIndex = (y - 1) * validGridSize + (x + 1);
            if (this.particles[diagIndex]) {
                this.springs.push(new Spring(
                    this.particles[index],
                    this.particles[diagIndex],
                    null,
                    this.params.stiffness * 0.7,
                    this.params.nonLinearity
                ));
            }
        }
    }
}
```

## 最后

关于果冻，在 2D 游戏开发中，果冻效果的一个重要特征是面积守恒。  
果冻效果的参数调节是实现真实感的关键。主要的参数包括：弹性系数，控制材料的硬度；粘性系数，控制材料的粘稠程度；表面张力系数，影响表面的收缩行为；密度，控制材料的质量分布；阻尼系数，控制振动的衰减速度。这些... 就不想再做了  

关于物理数值模拟的计算，还有种叫做 pbd 的操作，基于位置与约束条件去做计算，而再不去做什么受力分析。听说和拉格朗日力学，最小作用量之类的有关... 看不懂  
关于弹簧质点模型，我觉得它也许会像有限元分析小时候，那时候它还很可爱。但有限元听起来还是有点哈人了也不想看了...  

↓，调小 Stiffness 前要把 Gravity 归零，不然会被压塌x
<iframe 
  style="width: 100%;
    height: 1200px;
    border: none;
    display: block;"
  src="https://huamurui.github.io/html-s/jelly-mario"
></iframe>