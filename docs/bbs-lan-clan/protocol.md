# Authority and protocol notes

Protocol v1 uses JSON WebSocket frames on `/ws`. The pure contract is `src/net/protocol.js`; simulation and adapter are in `src/net/simulation.js`, with no browser or `ws` dependency. The optional `server/index.mjs` supplies transport, bounded rooms and private persistence. The browser imports `client.js` and a compact world codec, never server code.

One `SharedWorld extends Game` exists per room. The native update is split at its existing avatar/shared/world boundaries: each avatar's movement, combat and inventory timers step once, then shared AI/projectiles/objectives step once. Actor state is swapped into the native methods and restored; there are no independent authoritative worlds per player. Client `NetworkView` is a read model with local wall-swept prediction and snapshot reconciliation, not an AI/loot/damage simulator.

| Direction | Messages | Permitted data |
|---|---|---|
| Client → host | `create`, `join`, `resume`, `leave` | Validated settings, ASCII handle, room code, private capability |
| Client → host | `ready`, `start`, `lobby`, `next`, `retry`, `save` | Intent only; owner/state/objective gates checked by host |
| Client → host | `input` | Monotonic sequence, bounded movement/angle/buttons, weapon selection, utility actions and bounded relative tracked aim |
| Host → client | `hello`, `welcome`, `world`, `snapshot`, `saved`, `error`, `pong` | Protocol, private own pass, shared geometry/revision, authoritative dynamic state, acknowledgements |

Input contains **no position, HP, damage, ammunition, frags, elapsed time, objective completion or boss phase**. Unknown fields/actions and nonfinite values fail validation. Charged attacks accrue on the host clock. Relative grip/eye/direction values pass native safe-reach/environment clipping; room-scale intent is velocity-limited and wall-swept. Native six weapon costs, cooldowns, hit cones/tracked rays, projectile wall collision, armor and death logic adjudicate damage. No client can call a completion or mutate a host registry through this protocol.

The host advances at **30 fixed ticks/second**, snapshots at **10 Hz**, client input at **20 Hz**. Catch-up is capped; accepted inputs replace prior held intent and have an eight-action bound. Stale input goes neutral after 300 ms. Remote actors interpolate over approximately 100 ms; local movement reconciles against authoritative snapshots and large errors snap back. A client holds controls after 1.5 seconds without snapshots. There is no server historical hit rewind; internet latency tuning remains pending.

Bounds: 4 KiB incoming frames, 40 messages/second with a 60-message burst, handshake IP bucket, 32 rooms / 128 connections, 8 competitive or 4 cooperative actors, 128 projectiles, 96 retained events, 256 KiB outgoing buffer/snapshot ceiling. Static geometry travels once per revision; discovery is bit-packed. Normal actor transform/inventory snapshots include server-confirmed muzzle/hurt feedback. Remote immersive heads/hands use bounded approximations, not full-body tracking.

Friendly fire is off in co-op/team/clan. Players do not push or block one another's locomotion; world walls and doors remain solid. Competitive abilities are adapted for equal loadouts: Ori support and squad Bass Drop are co-op only and disabled in the competitive interface. Native weapon Bass Cannon remains available. Ori stays in the local right-side comfort lane; shared squad support remains authoritative.

Reconnect replaces a socket reference without creating an actor, adding supplies or resetting sequence numbers. A new socket cannot use another's inventory without its 192-bit private pass. Retrying rolls world and inventory back together, preserves active actor object references and keeps accepted sequence numbers monotonic. Cooperative energy claims use stable IDs. Disk resumes for one code are serialized to prevent two rooms being restored from the same checkpoint.

Room codes are private eight-character random codes, not public directories. Capabilities are sent only to their own socket and kept out of snapshots/reports. The host listens on loopback by default, limits origins and serves only `dist`. Paths, code execution and arbitrary file reads/writes are not protocol operations. Native WebSocket framing is delegated to pinned server-only `ws`; no compression or custom binary parser is enabled.

The **manual** fixed-step clock and read-only snapshot broadcast used in automation are in-process server-library facilities, with no wire or CLI command. Screenshot heartbeat delivery can continue while a test clock is frozen. Test scripts emit ordinary validated input; they do not expose runtime teleport/HP/objective setters. Unit tests that deliberately arrange fixtures are distinguished from the input-only network/browser completion reports.
