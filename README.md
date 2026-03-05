# react-hooks-lite

A lightweight React hooks package starter.

## React version support

This package sets:

- `peerDependencies.react: >=16.8.0`

React Hooks were introduced in React 16.8.0, so this is the minimum supported React version.

## Quick start

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

### useClickOutside

Purpose:
- Trigger logic when clicking outside a target element.

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

### useClipboard

Purpose:
- Copy text to clipboard with success/error state.

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

### useComposition

Purpose:
- Handle IME composition safely (avoid premature `onChange` updates).

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

### useContainerQuery

Purpose:
- Track container size and evaluate query rules.

Parameters:
- `query` (required): Either query object (`minWidth/maxWidth/minHeight/maxHeight`) or predicate `(size) => boolean`.
- `options.initialSize` (optional, default `{ width: 0, height: 0 }`): Initial size before measure.
- `options.initialMatches` (optional, default `false`): Initial match state.
- `options.box` (optional): `ResizeObserver` box option.
- `options.onChange` (optional): Called when evaluated result/size updates.

```tsx
import useContainerQuery from "react-hooks-lite/useContainerQuery";

function ProductGrid() {
  const { ref, matches } = useContainerQuery({ minWidth: 600 });

  return <section ref={ref}>{matches ? "4 columns" : "2 columns"}</section>;
}
```

### useDebounced

Purpose:
- Debounce rapidly changing value.

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

### useDrag

Purpose:
- Track drag state and drag position.

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

### useEventListener

Purpose:
- Declaratively bind/unbind event listeners.

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

### useErrorBoundary

Purpose:
- Throw errors into nearest React error boundary manually.

Parameters:
- No required parameters.

```tsx
import useErrorBoundary from "react-hooks-lite/useErrorBoundary";

function SaveButton() {
  const { showBoundary } = useErrorBoundary();

  return <button onClick={() => showBoundary(new Error("Save failed"))}>Save</button>;
}
```

### useHotKeys

Purpose:
- Register keyboard shortcut combinations.

Parameters:
- `hotKeys` (required): Combo string or array, e.g. `"ctrl+s"`, `["ctrl+k", "meta+k"]`.
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

### useIsClient

Purpose:
- Detect whether component has mounted on client side.

Parameters:
- No parameters.

```tsx
import useIsClient from "react-hooks-lite/useIsClient";

function ClientOnly() {
  const isClient = useIsClient();
  return <p>{isClient ? "client" : "server"}</p>;
}
```

### useIntersection

Purpose:
- Observe element visibility in viewport/container.

Parameters:
- `options.root` (optional, default `null`): Observation root.
- `options.rootMargin` (optional): Root margin string.
- `options.threshold` (optional): Intersection threshold.
- `options.freezeOnceVisible` (optional, default `false`): Stop observing after visible once.
- `options.initialIsIntersecting` (optional, default `false`): Initial visible state.
- `options.onChange` (optional): Called with latest entry.

```tsx
import useIntersection from "react-hooks-lite/useIntersection";

function LazySection() {
  const { ref, isIntersecting } = useIntersection<HTMLDivElement>({ threshold: 0.3 });
  return <div ref={ref}>{isIntersecting ? "Visible" : "Hidden"}</div>;
}
```

### useInterval

Purpose:
- Manage interval lifecycle with start/stop/reset controls.

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

### useKeyPress

Purpose:
- Track whether target key is currently pressed.

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

### useLatest

Purpose:
- Keep a stable ref whose `current` is always latest value.

Parameters:
- `value` (required): Latest value to keep in ref.

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

### useLongPress

Purpose:
- Trigger action when pointer is held for threshold duration.

Parameters:
- `callback` (required): Triggered after long press threshold.
- `options.threshold` (optional, default `400`): Press duration in ms.
- `options.enabled` (optional, default `true`): Enable/disable long press.
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

### useLocalStorage

Purpose:
- Persist state in `localStorage` with reactive updates.

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

### useMediaQuery

Purpose:
- Subscribe to media query match state.

Parameters:
- `query` (required): CSS media query string.
- `options.defaultValue` (optional, default `false`): Fallback value when API unavailable.
- `options.initializeWithValue` (optional, default `true`): Read actual query result on initial render.

```tsx
import useMediaQuery from "react-hooks-lite/useMediaQuery";

function ResponsiveLabel() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  return <span>{isDesktop ? "Desktop" : "Mobile"}</span>;
}
```

### usePermission

Purpose:
- Track browser permission state (`granted`, `denied`, `prompt`, or `unsupported`).

Parameters:
- `permission` (required): `PermissionName`, full `PermissionDescriptor`, or `null`.

```tsx
import usePermission from "react-hooks-lite/usePermission";

function CameraPermission() {
  const state = usePermission("camera");
  return <p>camera: {state}</p>;
}
```

### usePrevious

Purpose:
- Read previous render's value.

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

### useRequest

Purpose:
- Async request state manager with lifecycle callbacks.

Parameters:
- `service` (required): Async function returning a Promise.
- `options.manual` (optional, default `false`): Manual mode; disable auto run on mount.
- `options.defaultParams` (optional): Params used by auto run/refresh fallback.
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

### useScroll

Purpose:
- Read and control scroll position of window/element.

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

### useScrollLock

Purpose:
- Lock and unlock page (or target element) scrolling.

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

### useSingleton

Purpose:
- Create a value only once per component instance.

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

### useThrottle

Purpose:
- Throttle value updates.

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

### useTimeout

Purpose:
- Manage one-shot timeout lifecycle.

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

### useUpdateEffect

Purpose:
- `useEffect` that skips first render and runs only on updates.

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
