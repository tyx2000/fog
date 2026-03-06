# react-hooks-lite

[English](#english) | [简体中文](#zh-cn)

A lightweight React hooks package starter.

<a id="english"></a>

## English

## React Version Support

This package sets:

- `peerDependencies.react: >=16.8.0`

React Hooks were introduced in React `16.8.0`, so this is the minimum supported React version.

## Quick Start

```bash
npm install
npm run build
npm test
```

Build output:

- ESM only
- Target: `ES2022` (if your app needs older environments, transpile dependencies in your app build pipeline)

## On-demand Import

- Only supported: `import useDebounced from "react-hooks-lite/useDebounced"`

Root import is intentionally disabled; only subpath imports are supported for explicit on-demand usage.

## Hook Usage

<a id="useclickoutside-en"></a>

### useClickOutside

Purpose:

- Trigger logic when clicking outside a target element.

Scenarios:

- Close dropdowns, popovers, and context menus when the user clicks elsewhere.
- Dismiss modal side panels or filter drawers without wiring manual document listeners.

Parameters:

- `onClickOutside` (required): Callback fired for outside clicks.
- `options.enabled` (optional, default `true`): Enable or disable listener.
- `options.eventName` (optional, default `"click"`): Event to listen (`click`, `mousedown`, `touchstart`, etc).
- `options.capture` (optional, default `true`): Use capture phase.

```tsx
import useClickOutside from "react-hooks-lite/useClickOutside";

function Dropdown() {
  const ref = useClickOutside<HTMLDivElement>(() => {
    console.log("outside click");
  });

  return <div ref={ref}>Menu</div>;
}
```

<a id="useclipboard-en"></a>

### useClipboard

Purpose:

- Copy text to clipboard with success/error state.

Scenarios:

- Build "copy link" and "copy code" buttons with instant feedback.
- Show temporary success state in share dialogs or invite flows.

Parameters:

- `options.timeout` (optional, default `1500`): Auto reset `copied` state delay in ms.
- `options.onSuccess` (optional): Called on copy success.
- `options.onError` (optional): Called on copy failure.

```tsx
import useClipboard from "react-hooks-lite/useClipboard";

function CopyButton() {
  const { copy, copied, error } = useClipboard({ timeout: 1200 });

  return (
    <button onClick={() => void copy("Hello Hooks")}>
      {error ? "Copy failed" : copied ? "Copied" : "Copy"}
    </button>
  );
}
```

<a id="usecomposition-en"></a>

### useComposition

Purpose:

- Handle IME composition safely and avoid premature `onChange` updates.

Scenarios:

- Search inputs for Chinese, Japanese, and Korean users.
- Forms that should only validate after composition ends.

Parameters:

- `options.onChange` (optional): Called when composition is not active.
- `options.onCompositionStart` (optional): Composition start callback.
- `options.onCompositionUpdate` (optional): Composition update callback.
- `options.onCompositionEnd` (optional): Composition end callback.
- `options.triggerOnCompositionEnd` (optional, default `false`): Trigger `onChange` when composition ends.

```tsx
import useComposition from "react-hooks-lite/useComposition";
import { useState } from "react";

function SearchWithIME() {
  const [value, setValue] = useState("");
  const { handlers } = useComposition<HTMLInputElement>({
    onChange: (event) => setValue(event.target.value)
  });

  return <input value={value} {...handlers} />;
}
```

<a id="usecontainerquery-en"></a>

### useContainerQuery

Purpose:

- Track container size and evaluate query rules.

Scenarios:

- Switch card list layouts based on parent width instead of viewport width.
- Adapt widgets embedded inside dashboards, sidebars, or CMS blocks.

Parameters:

- `query` (required): Either query object (`minWidth`, `maxWidth`, `minHeight`, `maxHeight`) or predicate `(size) => boolean`.
- `options.initialSize` (optional, default `{ width: 0, height: 0 }`): Initial size before measure.
- `options.initialMatches` (optional, default `false`): Initial match state.
- `options.box` (optional): `ResizeObserver` box option.
- `options.onChange` (optional): Called when evaluated result or size updates.

```tsx
import useContainerQuery from "react-hooks-lite/useContainerQuery";

function ProductGrid() {
  const { ref, matches } = useContainerQuery({ minWidth: 600 });

  return <section ref={ref}>{matches ? "4 columns" : "2 columns"}</section>;
}
```

<a id="usedebounced-en"></a>

### useDebounced

Purpose:

- Debounce rapidly changing value.

Scenarios:

- Delay remote search requests until the user pauses typing.
- Reduce expensive filtering, sorting, or chart recalculation frequency.

Parameters:

- `input` (required): Source value.
- `delay` (optional, default `300`): Debounce wait time in ms.
- `options.equalityFn` (optional, default `Object.is`): Custom equality check.

```tsx
import useDebounced from "react-hooks-lite/useDebounced";
import { useState } from "react";

function SearchInput() {
  const [keyword, setKeyword] = useState("");
  const { value: debouncedKeyword } = useDebounced(keyword, 400);

  return <input value={keyword} onChange={(e) => setKeyword(e.target.value)} />;
}
```

<a id="usedrag-en"></a>

### useDrag

Purpose:

- Track drag state and drag position.

Scenarios:

- Build draggable panels, floating toolboxes, or reorder handles.
- Create simple canvas toys or whiteboard interactions without a full DnD library.

Parameters:

- `options.initialPosition` (optional, default `{ x: 0, y: 0 }`): Initial drag coordinates.
- `options.disabled` (optional, default `false`): Disable drag behavior.
- `options.onDragStart` (optional): Called on drag start.
- `options.onDrag` (optional): Called during dragging.
- `options.onDragEnd` (optional): Called on drag end.

```tsx
import useDrag from "react-hooks-lite/useDrag";

function DraggableCard() {
  const { ref, position } = useDrag<HTMLDivElement>();

  return <div ref={ref} style={{ transform: `translate(${position.x}px, ${position.y}px)` }} />;
}
```

<a id="useeventlistener-en"></a>

### useEventListener

Purpose:

- Declaratively bind and unbind event listeners.

Scenarios:

- Subscribe to `resize`, `scroll`, or custom DOM events in a React-friendly way.
- Reuse the same listener pattern for `window`, `document`, refs, or custom targets.

Parameters:

- `eventName` (required): Event name.
- `handler` (required): Event callback.
- `options.target` (optional, default `window`): Event target or ref target.
- `options.enabled` (optional, default `true`): Toggle listener.
- `options.capture` (optional): Capture mode.
- `options.passive` (optional): Passive listener mode.
- `options.once` (optional): Auto remove after first call.
- `options.signal` (optional): AbortSignal.

```tsx
import useEventListener from "react-hooks-lite/useEventListener";

function EscapeCounter() {
  useEventListener<KeyboardEvent>("keydown", (event) => {
    if (event.key === "Escape") console.log("esc");
  });

  return null;
}
```

<a id="useerrorboundary-en"></a>

### useErrorBoundary

Purpose:

- Throw errors into the nearest React error boundary manually.

Scenarios:

- Surface async request failures inside a UI error boundary fallback.
- Promote imperative failures from click handlers into a central boundary component.

Parameters:

- No parameters.

```tsx
import useErrorBoundary from "react-hooks-lite/useErrorBoundary";

function SaveButton() {
  const { showBoundary } = useErrorBoundary();

  return <button onClick={() => showBoundary(new Error("Save failed"))}>Save</button>;
}
```

<a id="usehotkeys-en"></a>

### useHotKeys

Purpose:

- Register keyboard shortcut combinations.

Scenarios:

- Add editor-style shortcuts such as `Ctrl+S`, `Ctrl+K`, or `Cmd+/`.
- Build power-user command palettes and productivity workflows.

Parameters:

- `hotKeys` (required): Combo string or array, for example `"ctrl+s"` or `["ctrl+k", "meta+k"]`.
- `callback` (required): Shortcut callback.
- `options.target` (optional, default `window`): Event target or ref.
- `options.enabled` (optional, default `true`): Toggle listener.
- `options.preventDefault` (optional, default `false`): Prevent default browser behavior on match.
- `options.exact` (optional, default `true`): Require exact modifier match.
- `options.eventName` (optional, default `"keydown"`): Use `keydown` or `keyup`.

```tsx
import useHotKeys from "react-hooks-lite/useHotKeys";

function SaveShortcut() {
  useHotKeys("ctrl+s", (event) => {
    event.preventDefault();
    console.log("save");
  });

  return <p>Try Ctrl+S</p>;
}
```

<a id="useisclient-en"></a>

### useIsClient

Purpose:

- Detect whether the component has mounted on the client side.

Scenarios:

- Guard browser-only APIs such as `window`, `document`, or `localStorage`.
- Avoid hydration mismatches when rendering SSR content.

Parameters:

- No parameters.

```tsx
import useIsClient from "react-hooks-lite/useIsClient";

function ClientOnly() {
  const isClient = useIsClient();
  return <p>{isClient ? "client" : "server"}</p>;
}
```

<a id="useintersection-en"></a>

### useIntersection

Purpose:

- Observe element visibility in a viewport or container.

Scenarios:

- Lazy-load images, charts, or analytics when a section enters the viewport.
- Trigger scroll-based reveal animations or infinite list pagination.

Parameters:

- `options.root` (optional, default `null`): Observation root.
- `options.rootMargin` (optional): Root margin string.
- `options.threshold` (optional): Intersection threshold.
- `options.freezeOnceVisible` (optional, default `false`): Stop observing after visible once.
- `options.initialIsIntersecting` (optional, default `false`): Initial visible state.
- `options.onChange` (optional): Called with the latest entry.

```tsx
import useIntersection from "react-hooks-lite/useIntersection";

function LazySection() {
  const { ref, isIntersecting } = useIntersection<HTMLDivElement>({ threshold: 0.3 });
  return <div ref={ref}>{isIntersecting ? "Visible" : "Hidden"}</div>;
}
```

<a id="useinterval-en"></a>

### useInterval

Purpose:

- Manage interval lifecycle with start, stop, and reset controls.

Scenarios:

- Poll APIs on a fixed cadence.
- Build auto-advancing banners, timers, and ticking counters.

Parameters:

- `callback` (required): Callback on each tick.
- `delay` (required): Interval in ms, or `null` to disable.
- `options.autoStart` (optional, default `true`): Start automatically.
- `options.enabled` (optional, default `true`): Enable interval behavior.
- `options.immediate` (optional, default `false`): Trigger callback once immediately when starting.

```tsx
import useInterval from "react-hooks-lite/useInterval";
import { useState } from "react";

function AutoCounter() {
  const [count, setCount] = useState(0);
  const { clear } = useInterval(() => setCount((n) => n + 1), 1000);

  return <button onClick={clear}>{count}</button>;
}
```

<a id="usekeypress-en"></a>

### useKeyPress

Purpose:

- Track whether a target key is currently pressed.

Scenarios:

- Show temporary UI hints while a modifier key is held.
- Add game, canvas, or accessibility interactions that depend on pressed state.

Parameters:

- `key` (required): Key string, key array, or predicate.
- `options.target` (optional, default `window`): Event target or ref.
- `options.enabled` (optional, default `true`): Toggle listener.
- `options.preventDefault` (optional, default `false`): Prevent default on keydown match.

```tsx
import useKeyPress from "react-hooks-lite/useKeyPress";

function EscapeHint() {
  const isEscPressed = useKeyPress("Escape");
  return <p>{isEscPressed ? "Esc is pressed" : "Press Esc"}</p>;
}
```

<a id="uselatest-en"></a>

### useLatest

Purpose:

- Keep a stable ref whose `current` always points to the latest value.

Scenarios:

- Read the latest callback inside timers, listeners, or async tasks without stale closures.
- Bridge declarative props into imperative APIs.

Parameters:

- `value` (required): Latest value to keep in the ref.

```tsx
import useLatest from "react-hooks-lite/useLatest";
import { useEffect } from "react";

function Poller({ onTick }: { onTick: () => void }) {
  const onTickRef = useLatest(onTick);

  useEffect(() => {
    const id = setInterval(() => onTickRef.current(), 1000);
    return () => clearInterval(id);
  }, [onTickRef]);

  return null;
}
```

<a id="uselongpress-en"></a>

### useLongPress

Purpose:

- Trigger an action when a pointer is held for a threshold duration.

Scenarios:

- Mobile context actions, hold-to-delete buttons, or press-and-hold confirmations.
- Gesture-based UI where tap and long press should do different things.

Parameters:

- `callback` (required): Triggered after the long-press threshold.
- `options.threshold` (optional, default `400`): Press duration in ms.
- `options.enabled` (optional, default `true`): Enable or disable long press.
- `options.onStart` (optional): Called when press starts.
- `options.onFinish` (optional): Called when long press completes.
- `options.onCancel` (optional): Called when press ends before completion.

```tsx
import useLongPress from "react-hooks-lite/useLongPress";

function HoldButton() {
  const { handlers, isPressed } = useLongPress(() => {
    console.log("long press triggered");
  }, { threshold: 500 });

  return <button {...handlers}>{isPressed ? "Holding..." : "Hold me"}</button>;
}
```

<a id="uselocalstorage-en"></a>

### useLocalStorage

Purpose:

- Persist state in `localStorage` with reactive updates.

Scenarios:

- Store theme, locale, or dismissed banner preferences.
- Keep draft form input across refreshes.

Parameters:

- `key` (required): Storage key.
- `initialValue` (required): Initial value if storage is empty or invalid.
- `options.serializer` (optional): Custom serialize function.
- `options.deserializer` (optional): Custom deserialize function.
- `options.initializeWithValue` (optional, default `true`): Read storage during initial render.

```tsx
import useLocalStorage from "react-hooks-lite/useLocalStorage";

function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "light");
  return <button onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>{theme}</button>;
}
```

<a id="usemediaquery-en"></a>

### useMediaQuery

Purpose:

- Subscribe to media query match state.

Scenarios:

- Switch UI logic between desktop and mobile breakpoints.
- React to `prefers-reduced-motion`, `prefers-color-scheme`, or print mode.

Parameters:

- `query` (required): CSS media query string.
- `options.defaultValue` (optional, default `false`): Fallback value when API is unavailable.
- `options.initializeWithValue` (optional, default `true`): Read actual query result on initial render.

```tsx
import useMediaQuery from "react-hooks-lite/useMediaQuery";

function ResponsiveLabel() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  return <span>{isDesktop ? "Desktop" : "Mobile"}</span>;
}
```

<a id="usepermission-en"></a>

### usePermission

Purpose:

- Track browser permission state (`granted`, `denied`, `prompt`, or `unsupported`).

Scenarios:

- Gate camera, microphone, notification, or geolocation features.
- Show preflight permission hints before opening a browser prompt.

Parameters:

- `permission` (required): `PermissionName`, full `PermissionDescriptor`, or `null`.

```tsx
import usePermission from "react-hooks-lite/usePermission";

function CameraPermission() {
  const state = usePermission("camera");
  return <p>camera: {state}</p>;
}
```

<a id="useprevious-en"></a>

### usePrevious

Purpose:

- Read the previous render's value.

Scenarios:

- Compare current and previous values for animation or diff display.
- Detect transitions such as "closed -> open" or "old price -> new price".

Parameters:

- `value` (required): Current value.
- `initialValue` (optional, default `undefined`): Value returned on first render.

```tsx
import usePrevious from "react-hooks-lite/usePrevious";
import { useState } from "react";

function PriceDiff() {
  const [price, setPrice] = useState(100);
  const previousPrice = usePrevious(price, price);

  return <button onClick={() => setPrice((n) => n + 10)}>{previousPrice} -&gt; {price}</button>;
}
```

<a id="userequest-en"></a>

### useRequest

Purpose:

- Async request state manager with lifecycle callbacks.

Scenarios:

- Standardize loading, error, refresh, and manual trigger behavior across pages.
- Wrap fetch requests for data tables, detail panels, or search results.

Parameters:

- `service` (required): Async function returning a `Promise`.
- `options.manual` (optional, default `false`): Manual mode; disable auto run on mount.
- `options.defaultParams` (optional): Params used by auto run or refresh fallback.
- `options.initialData` (optional): Initial data state.
- `options.onSuccess` (optional): Callback on resolved request.
- `options.onError` (optional): Callback on rejected request.
- `options.onFinally` (optional): Callback on settle.

```tsx
import useRequest from "react-hooks-lite/useRequest";

async function fetchUser(id: number) {
  const response = await fetch(`/api/users/${id}`);
  return response.json() as Promise<{ id: number; name: string }>;
}

function UserCard() {
  const { data, loading, run, refresh } = useRequest(fetchUser, { manual: true });

  return (
    <div>
      <button onClick={() => run(1)}>Load</button>
      <button onClick={() => refresh()}>Refresh</button>
      {loading ? "Loading..." : data?.name}
    </div>
  );
}
```

<a id="usescroll-en"></a>

### useScroll

Purpose:

- Read and control the scroll position of `window` or an element.

Scenarios:

- Show "back to top" buttons or sticky progress indicators.
- Sync a scrollable container with navigation or focus state.

Parameters:

- `options.target` (optional, default `window`): Scroll target or ref.
- `options.enabled` (optional, default `true`): Toggle scroll tracking.
- `options.behavior` (optional, default `"auto"`): Behavior for `scrollTo`.

```tsx
import useScroll from "react-hooks-lite/useScroll";

function ScrollPosition() {
  const { x, y, scrollTo } = useScroll();
  return <button onClick={() => scrollTo(0, 0)}>{x}, {y}</button>;
}
```

<a id="usescrolllock-en"></a>

### useScrollLock

Purpose:

- Lock and unlock page or target element scrolling.

Scenarios:

- Prevent background page scroll while a modal or drawer is open.
- Lock nested containers during drag or gesture interactions.

Parameters:

- `options.target` (optional, default `document.body`): Element or ref to lock.
- `options.autoLock` (optional, default `false`): Lock automatically on mount.

```tsx
import useScrollLock from "react-hooks-lite/useScrollLock";

function Modal() {
  const { lock, unlock } = useScrollLock();

  return (
    <div>
      <button onClick={lock}>Lock scroll</button>
      <button onClick={unlock}>Unlock scroll</button>
    </div>
  );
}
```

<a id="usesingleton-en"></a>

### useSingleton

Purpose:

- Create a value only once per component instance.

Scenarios:

- Lazily initialize class instances, caches, or clients that should not be recreated.
- Store imperative helpers without putting them into state.

Parameters:

- `factory` (required): Lazy initializer function.

```tsx
import useSingleton from "react-hooks-lite/useSingleton";

class ApiClient {
  constructor(public baseUrl: string) {}
}

function UserList() {
  const client = useSingleton(() => new ApiClient("/api"));
  return <div>{client.baseUrl}</div>;
}
```

<a id="usethrottle-en"></a>

### useThrottle

Purpose:

- Throttle value updates.

Scenarios:

- Limit high-frequency pointer, resize, or scroll derived state updates.
- Smooth live dashboards or charts without processing every change.

Parameters:

- `input` (required): Source value.
- `delay` (optional, default `300`): Throttle interval in ms.
- `options.leading` (optional, default `true`): Emit on leading edge.
- `options.trailing` (optional, default `true`): Emit on trailing edge.
- `options.equalityFn` (optional, default `Object.is`): Custom equality check.

```tsx
import useThrottle from "react-hooks-lite/useThrottle";
import { useState } from "react";

function PointerTracker() {
  const [point, setPoint] = useState({ x: 0, y: 0 });
  const { value: throttledPoint } = useThrottle(point, 100);

  return (
    <div onMouseMove={(event) => setPoint({ x: event.clientX, y: event.clientY })}>
      {throttledPoint.x}, {throttledPoint.y}
    </div>
  );
}
```

<a id="usetimeout-en"></a>

### useTimeout

Purpose:

- Manage one-shot timeout lifecycle.

Scenarios:

- Delay tooltips, toast dismissal, or idle state transitions.
- Trigger a single action after a wait period with start and cancel controls.

Parameters:

- `callback` (required): Callback fired when timeout completes.
- `delay` (required): Delay in ms, or `null` to disable.
- `options.autoStart` (optional, default `true`): Start automatically.
- `options.enabled` (optional, default `true`): Toggle timeout behavior.

```tsx
import useTimeout from "react-hooks-lite/useTimeout";

function DelayedMessage() {
  const { isActive, start, clear } = useTimeout(() => {
    console.log("timeout fired");
  }, 2000, { autoStart: false });

  return (
    <div>
      <button onClick={start}>Start</button>
      <button onClick={clear}>Cancel</button>
      <p>{isActive ? "Pending..." : "Idle"}</p>
    </div>
  );
}
```

<a id="useupdateeffect-en"></a>

### useUpdateEffect

Purpose:

- `useEffect` that skips the first render and runs only on updates.

Scenarios:

- Avoid firing side effects for default initial state.
- Trigger analytics, logs, or network sync only after user-driven changes.

Parameters:

- `effect` (required): Effect callback.
- `deps` (required): Dependency list.

```tsx
import useUpdateEffect from "react-hooks-lite/useUpdateEffect";
import { useState } from "react";

function SearchLog() {
  const [keyword, setKeyword] = useState("");

  useUpdateEffect(() => {
    console.log("keyword changed:", keyword);
  }, [keyword]);

  return <input value={keyword} onChange={(e) => setKeyword(e.target.value)} />;
}
```

<a id="zh-cn"></a>

## 简体中文

## React 版本支持

当前包配置为：

- `peerDependencies.react: >=16.8.0`

React Hooks 从 `16.8.0` 开始支持，因此这也是本包的最低支持版本。

## 快速开始

```bash
npm install
npm run build
npm test
```

构建产物说明：

- 仅输出 ESM
- 构建目标为 `ES2022`（如果你的业务应用需要兼容更低环境，请在业务构建阶段转译依赖）

## 按需引入

- 仅支持：`import useDebounced from "react-hooks-lite/useDebounced"`

不支持根入口导入，只允许通过子路径显式按需引入。

## Hook 用法说明

### useClickOutside

作用：

- 当点击目标元素外部时触发回调。

使用场景：

- 下拉菜单、气泡层、右键菜单点击外部自动关闭。
- 筛选抽屉、侧边栏、轻量弹层的外部点击关闭。

参数：

- `onClickOutside`（必填）：点击外部时触发的回调。
- `options.enabled`（可选，默认 `true`）：是否启用监听。
- `options.eventName`（可选，默认 `"click"`）：监听的事件名。
- `options.capture`（可选，默认 `true`）：是否使用捕获阶段。

示例：

- 英文代码示例见 [useClickOutside](#useclickoutside-en)

### useClipboard

作用：

- 复制文本到剪贴板，并提供成功或失败状态。

使用场景：

- 复制分享链接、邀请码、命令行片段。
- 需要短暂展示“已复制”反馈的按钮组件。

参数：

- `options.timeout`（可选，默认 `1500`）：`copied` 状态自动重置时间，单位毫秒。
- `options.onSuccess`（可选）：复制成功回调。
- `options.onError`（可选）：复制失败回调。

示例：

- 英文代码示例见 [useClipboard](#useclipboard-en)

### useComposition

作用：

- 安全处理输入法组合输入，避免拼写过程中提前触发逻辑。

使用场景：

- 中文、日文、韩文搜索框。
- 只希望在输入法结束后再校验或发请求的表单。

参数：

- `options.onChange`（可选）：未处于组合输入时触发。
- `options.onCompositionStart`（可选）：组合输入开始回调。
- `options.onCompositionUpdate`（可选）：组合输入过程回调。
- `options.onCompositionEnd`（可选）：组合输入结束回调。
- `options.triggerOnCompositionEnd`（可选，默认 `false`）：结束时是否补触发一次 `onChange`。

示例：

- 英文代码示例见 [useComposition](#usecomposition-en)

### useContainerQuery

作用：

- 监听容器尺寸并判断是否满足查询条件。

使用场景：

- 组件嵌入侧栏、卡片、仪表盘时按容器宽度自适应布局。
- 做真正的组件级响应式，而不是只依赖 viewport。

参数：

- `query`（必填）：查询对象或谓词函数。
- `options.initialSize`（可选，默认 `{ width: 0, height: 0 }`）：初始化尺寸。
- `options.initialMatches`（可选，默认 `false`）：初始化匹配状态。
- `options.box`（可选）：`ResizeObserver` 的 box 配置。
- `options.onChange`（可选）：尺寸或匹配结果变化时触发。

示例：

- 英文代码示例见 [useContainerQuery](#usecontainerquery-en)

### useDebounced

作用：

- 对频繁变化的值进行防抖。

使用场景：

- 输入搜索关键字时延迟请求。
- 避免高频筛选、排序、计算导致频繁重渲染。

参数：

- `input`（必填）：输入值。
- `delay`（可选，默认 `300`）：防抖时长，单位毫秒。
- `options.equalityFn`（可选，默认 `Object.is`）：自定义相等比较函数。

示例：

- 英文代码示例见 [useDebounced](#usedebounced-en)

### useDrag

作用：

- 跟踪拖拽状态和当前位置。

使用场景：

- 可拖动卡片、浮动面板、工具条。
- 简单白板、画布交互或轻量拖拽能力。

参数：

- `options.initialPosition`（可选，默认 `{ x: 0, y: 0 }`）：初始位置。
- `options.disabled`（可选，默认 `false`）：是否禁用拖拽。
- `options.onDragStart`（可选）：拖拽开始时触发。
- `options.onDrag`（可选）：拖拽过程中触发。
- `options.onDragEnd`（可选）：拖拽结束时触发。

示例：

- 英文代码示例见 [useDrag](#usedrag-en)

### useEventListener

作用：

- 以声明式方式绑定和解绑事件监听。

使用场景：

- 统一处理 `resize`、`scroll`、键盘事件、自定义 DOM 事件。
- 针对 `window`、`document`、ref 元素复用同一套监听写法。

参数：

- `eventName`（必填）：事件名。
- `handler`（必填）：事件处理函数。
- `options.target`（可选，默认 `window`）：事件目标或 ref。
- `options.enabled`（可选，默认 `true`）：是否启用。
- `options.capture`（可选）：是否捕获。
- `options.passive`（可选）：是否被动监听。
- `options.once`（可选）：是否只触发一次。
- `options.signal`（可选）：`AbortSignal`。

示例：

- 英文代码示例见 [useEventListener](#useeventlistener-en)

### useErrorBoundary

作用：

- 手动将错误抛给最近的 React 错误边界。

使用场景：

- 将异步请求错误接入统一错误兜底 UI。
- 将按钮点击中的命令式异常上抛给错误边界。

参数：

- 无参数。

示例：

- 英文代码示例见 [useErrorBoundary](#useerrorboundary-en)

### useHotKeys

作用：

- 注册组合键快捷键。

使用场景：

- 编辑器、命令面板、工作台类产品的快捷操作。
- 保存、搜索、切换面板等高频键盘交互。

参数：

- `hotKeys`（必填）：组合键字符串或数组。
- `callback`（必填）：匹配成功时的回调。
- `options.target`（可选，默认 `window`）：监听目标。
- `options.enabled`（可选，默认 `true`）：是否启用。
- `options.preventDefault`（可选，默认 `false`）：是否阻止默认行为。
- `options.exact`（可选，默认 `true`）：是否要求修饰键精确匹配。
- `options.eventName`（可选，默认 `"keydown"`）：监听 `keydown` 或 `keyup`。

示例：

- 英文代码示例见 [useHotKeys](#usehotkeys-en)

### useIsClient

作用：

- 判断组件是否已经在客户端挂载。

使用场景：

- 访问 `window`、`document`、`localStorage` 这类浏览器 API 前做保护。
- SSR 场景下避免 hydration mismatch。

参数：

- 无参数。

示例：

- 英文代码示例见 [useIsClient](#useisclient-en)

### useIntersection

作用：

- 监听元素是否进入视口或指定容器。

使用场景：

- 图片、图表、统计埋点的懒加载。
- 无限滚动、滚动动画触发。

参数：

- `options.root`（可选，默认 `null`）：观察根节点。
- `options.rootMargin`（可选）：根节点边距。
- `options.threshold`（可选）：交叉阈值。
- `options.freezeOnceVisible`（可选，默认 `false`）：可见一次后是否停止观察。
- `options.initialIsIntersecting`（可选，默认 `false`）：初始化可见状态。
- `options.onChange`（可选）：状态变化时触发。

示例：

- 英文代码示例见 [useIntersection](#useintersection-en)

### useInterval

作用：

- 管理定时轮询的启动、停止和重置。

使用场景：

- 固定频率轮询接口。
- 倒计时、轮播、自动递增计数器。

参数：

- `callback`（必填）：每次触发执行的回调。
- `delay`（必填）：间隔毫秒数，传 `null` 则禁用。
- `options.autoStart`（可选，默认 `true`）：是否自动启动。
- `options.enabled`（可选，默认 `true`）：是否启用。
- `options.immediate`（可选，默认 `false`）：启动时是否立即执行一次。

示例：

- 英文代码示例见 [useInterval](#useinterval-en)

### useKeyPress

作用：

- 跟踪某个按键当前是否处于按下状态。

使用场景：

- 按住修饰键时展示辅助提示或激活特定模式。
- 游戏、画布、可访问性增强交互。

参数：

- `key`（必填）：按键字符串、按键数组或判断函数。
- `options.target`（可选，默认 `window`）：监听目标。
- `options.enabled`（可选，默认 `true`）：是否启用。
- `options.preventDefault`（可选，默认 `false`）：匹配时是否阻止默认行为。

示例：

- 英文代码示例见 [useKeyPress](#usekeypress-en)

### useLatest

作用：

- 返回一个稳定 ref，且 `current` 永远指向最新值。

使用场景：

- 在定时器、事件监听器、异步回调中读取最新函数或状态。
- 避免闭包拿到过期值。

参数：

- `value`（必填）：需要保存为最新值的输入。

示例：

- 英文代码示例见 [useLatest](#uselatest-en)

### useLongPress

作用：

- 按住达到阈值时间后触发动作。

使用场景：

- 长按删除、长按确认、移动端上下文菜单。
- 区分点击和长按两种交互语义。

参数：

- `callback`（必填）：长按达到阈值后触发。
- `options.threshold`（可选，默认 `400`）：长按阈值，单位毫秒。
- `options.enabled`（可选，默认 `true`）：是否启用。
- `options.onStart`（可选）：开始按下时触发。
- `options.onFinish`（可选）：成功完成长按时触发。
- `options.onCancel`（可选）：未达到阈值提前结束时触发。

示例：

- 英文代码示例见 [useLongPress](#uselongpress-en)

### useLocalStorage

作用：

- 将状态持久化到 `localStorage`，并保持响应式更新。

使用场景：

- 保存主题、语言、用户偏好。
- 在刷新页面后保留草稿内容。

参数：

- `key`（必填）：存储键名。
- `initialValue`（必填）：默认值。
- `options.serializer`（可选）：自定义序列化函数。
- `options.deserializer`（可选）：自定义反序列化函数。
- `options.initializeWithValue`（可选，默认 `true`）：初次渲染时是否立即读取存储。

示例：

- 英文代码示例见 [useLocalStorage](#uselocalstorage-en)

### useMediaQuery

作用：

- 订阅媒体查询结果。

使用场景：

- 根据断点切换桌面端和移动端逻辑。
- 响应 `prefers-color-scheme`、`prefers-reduced-motion` 等系统偏好。

参数：

- `query`（必填）：媒体查询字符串。
- `options.defaultValue`（可选，默认 `false`）：API 不可用时的兜底值。
- `options.initializeWithValue`（可选，默认 `true`）：初始化时是否立即读取真实结果。

示例：

- 英文代码示例见 [useMediaQuery](#usemediaquery-en)

### usePermission

作用：

- 跟踪浏览器权限状态，如 `granted`、`denied`、`prompt`、`unsupported`。

使用场景：

- 摄像头、麦克风、通知、定位权限预检查。
- 在真正调起权限弹窗前先做提示文案。

参数：

- `permission`（必填）：`PermissionName`、完整 `PermissionDescriptor` 或 `null`。

示例：

- 英文代码示例见 [usePermission](#usepermission-en)

### usePrevious

作用：

- 获取上一次渲染时的值。

使用场景：

- 展示价格变化、状态迁移、前后值对比。
- 判断组件是否从关闭切换为打开。

参数：

- `value`（必填）：当前值。
- `initialValue`（可选，默认 `undefined`）：首次渲染返回值。

示例：

- 英文代码示例见 [usePrevious](#useprevious-en)

### useRequest

作用：

- 管理异步请求状态，并提供完整生命周期回调。

使用场景：

- 统一列表页、详情页、搜索页的 loading 和 error 处理。
- 封装手动触发、刷新、初始化数据等请求流程。

参数：

- `service`（必填）：返回 `Promise` 的异步函数。
- `options.manual`（可选，默认 `false`）：是否手动触发。
- `options.defaultParams`（可选）：自动执行或刷新时使用的默认参数。
- `options.initialData`（可选）：初始数据。
- `options.onSuccess`（可选）：成功回调。
- `options.onError`（可选）：失败回调。
- `options.onFinally`（可选）：结束回调。

示例：

- 英文代码示例见 [useRequest](#userequest-en)

### useScroll

作用：

- 读取并控制 `window` 或元素的滚动位置。

使用场景：

- 返回顶部按钮、阅读进度条、滚动同步导航。
- 管理局部滚动容器的位置与行为。

参数：

- `options.target`（可选，默认 `window`）：滚动目标或 ref。
- `options.enabled`（可选，默认 `true`）：是否启用跟踪。
- `options.behavior`（可选，默认 `"auto"`）：`scrollTo` 的滚动行为。

示例：

- 英文代码示例见 [useScroll](#usescroll-en)

### useScrollLock

作用：

- 锁定和恢复页面或指定元素的滚动。

使用场景：

- 弹窗、抽屉打开时禁止背景滚动。
- 特定交互期间锁定局部容器滚动。

参数：

- `options.target`（可选，默认 `document.body`）：要锁定的元素或 ref。
- `options.autoLock`（可选，默认 `false`）：挂载时是否自动锁定。

示例：

- 英文代码示例见 [useScrollLock](#usescrolllock-en)

### useSingleton

作用：

- 在单个组件实例内只创建一次值。

使用场景：

- 懒初始化客户端实例、缓存对象、命令式工具类。
- 避免每次渲染都重新创建昂贵对象。

参数：

- `factory`（必填）：惰性初始化函数。

示例：

- 英文代码示例见 [useSingleton](#usesingleton-en)

### useThrottle

作用：

- 对高频变化值进行节流。

使用场景：

- 鼠标移动、窗口缩放、滚动派生状态更新降频。
- 图表或面板实时数据刷新做平滑控制。

参数：

- `input`（必填）：输入值。
- `delay`（可选，默认 `300`）：节流时长。
- `options.leading`（可选，默认 `true`）：是否在开始阶段触发。
- `options.trailing`（可选，默认 `true`）：是否在结束阶段补触发。
- `options.equalityFn`（可选，默认 `Object.is`）：自定义相等比较。

示例：

- 英文代码示例见 [useThrottle](#usethrottle-en)

### useTimeout

作用：

- 管理一次性定时器的生命周期。

使用场景：

- 延迟关闭提示、延迟触发提示气泡、空闲超时处理。
- 需要显式开始和取消的单次延迟动作。

参数：

- `callback`（必填）：定时结束后触发的回调。
- `delay`（必填）：延迟时间，传 `null` 则禁用。
- `options.autoStart`（可选，默认 `true`）：是否自动开始。
- `options.enabled`（可选，默认 `true`）：是否启用。

示例：

- 英文代码示例见 [useTimeout](#usetimeout-en)

### useUpdateEffect

作用：

- 跳过首次渲染，仅在依赖更新时执行的 `useEffect`。

使用场景：

- 避免默认初始值触发副作用。
- 仅在用户实际修改后执行日志、埋点、同步请求。

参数：

- `effect`（必填）：副作用函数。
- `deps`（必填）：依赖数组。

示例：

- 英文代码示例见 [useUpdateEffect](#useupdateeffect-en)
